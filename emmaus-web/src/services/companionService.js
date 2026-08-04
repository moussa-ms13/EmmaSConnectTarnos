import supabase from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

/**
 * companionService — CRUD operations for the compagnons table.
 * Includes role join, medical records, and referent profile for detailed views.
 */

/**
 * Fetch all companions with their role name, ordered by creation date (newest first).
 * Falls back to plain select if the roles relationship is not yet available.
 * @returns {{ data, error }}
 */
export async function fetchCompanions() {
  let { data, error } = await supabase
    .from('compagnons')
    .select('*, roles(id, name)')
    .order('created_at', { ascending: false });

  if (error && error.message?.includes('roles')) {
    const result = await supabase
      .from('compagnons')
      .select('*')
      .order('created_at', { ascending: false });
    data = result.data;
    error = result.error;
  }

  return { data, error };
}

/**
 * Find the linked companion ID for the current auth user (by user_id or email).
 * Useful for redirecting viewers to their own profile page.
 * @param {string} userId
 * @param {string} [userEmail]
 * @returns {Promise<string|null>}
 */
export async function fetchMyCompanionId(userId, userEmail) {
  if (!userId && !userEmail) return null;

  if (userId) {
    const { data } = await supabase
      .from('compagnons')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (userEmail) {
    const { data } = await supabase
      .from('compagnons')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

/**
 * Fetch a single companion by ID with full profile details:
 * - Role, Medical records, Referent profile
 * @param {string} id
 * @returns {{ data, error }}
 */
export async function getCompanionById(id) {
  let { data: companion, error } = await supabase
    .from('compagnons')
    .select('*, roles(id, name), referent:profiles!referent_id(id, first_name, last_name, role_id)')
    .eq('id', id)
    .single();

  if (error) {
    const fallback = await supabase
      .from('compagnons')
      .select('*')
      .eq('id', id)
      .single();
    companion = fallback.data;
    error = fallback.error;
  }

  if (error || !companion) {
    return { data: null, error };
  }

  // Fetch medical records for this companion
  const { data: medicalRecords } = await supabase
    .from('medical_records')
    .select('*')
    .eq('compagnon_id', id)
    .limit(1)
    .maybeSingle();

  companion.medical_record = medicalRecords || null;

  return { data: companion, error: null };
}

/**
 * Fetch a single companion by ID (basic, for list operations).
 * @param {string} id
 * @returns {{ data, error }}
 */
export async function fetchCompanionById(id) {
  const { data, error } = await supabase
    .from('compagnons')
    .select('*, roles(id, name)')
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Fetch all available roles from the roles table.
 * @returns {{ data, error }}
 */
export async function fetchRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name')
    .order('name', { ascending: true });
  return { data, error };
}

/**
 * Create a new companion WITH optional medical record data.
 * Automatically injects the authenticated user as `created_by`.
 *
 * @param {object} payload - { ...companionFields, medical: { blood_type, doctor_name, allergies, pathologies } }
 * @returns {{ data, error }}
 */
export async function createCompanion(payload) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Utilisateur non authentifié.') };
  }

  await supabase
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  // Separate medical data and auth fields from companion fields
  const { medical, email, password, role = 'Viewer', ...companionData } = payload;

  let newUserId = null;
  if (email && password) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://mock.supabase.co') {
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const { data: authData, error: signUpErr } = await tempClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: companionData.first_name || '',
              last_name: companionData.last_name || '',
              name: `${companionData.first_name || ''} ${companionData.last_name || ''}`.trim(),
            },
          },
        });

        if (signUpErr) {
          return { data: null, error: signUpErr };
        }
        newUserId = authData?.user?.id || null;
      } else {
        newUserId = `demo-user-${Date.now()}`;
      }
    } catch (err) {
      console.warn('Auth user creation error:', err);
    }
  }

  // Clean empty strings from companion data
  const cleanData = Object.fromEntries(
    Object.entries({ ...companionData, email, role }).filter(([, v]) => v !== '' && v !== undefined)
  );

  const { data, error } = await supabase
    .from('compagnons')
    .insert([{ ...cleanData, user_id: newUserId, created_by: user.id }])
    .select('*, roles(id, name)')
    .single();

  if (error || !data) {
    return { data, error };
  }

  // Insert medical record if any medical data was provided
  if (medical && Object.values(medical).some((v) => v)) {
    await supabase
      .from('medical_records')
      .insert([{ compagnon_id: data.id, ...medical }]);
  }

  return { data, error: null };
}

/**
 * Update an existing companion AND its medical record.
 *
 * @param {string} id
 * @param {object} payload - { ...companionFields, medical: { blood_type, doctor_name, allergies, pathologies } }
 * @returns {{ data, error }}
 */
export async function updateCompanion(id, payload) {
  const { medical, password, ...companionData } = payload;

  // Clean empty strings from companion data
  const cleanData = Object.fromEntries(
    Object.entries(companionData).filter(([, v]) => v !== '' && v !== undefined)
  );

  const { data, error } = await supabase
    .from('compagnons')
    .update(cleanData)
    .eq('id', id)
    .select('*, roles(id, name)')
    .single();

  if (error) {
    return { data, error };
  }

  // Upsert medical record if medical data was provided
  if (medical && Object.values(medical).some((v) => v)) {
    // Check if a record already exists
    const { data: existing } = await supabase
      .from('medical_records')
      .select('id')
      .eq('compagnon_id', id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('medical_records')
        .update(medical)
        .eq('compagnon_id', id);
    } else {
      await supabase
        .from('medical_records')
        .insert([{ compagnon_id: id, ...medical }]);
    }
  }

  return { data, error: null };
}

export async function deleteCompanion(id) {
  const { error } = await supabase
    .from('compagnons')
    .delete()
    .eq('id', id);
  return { error };
}

/**
 * Upload an avatar image file to the Supabase Storage 'avatars' bucket.
 * Returns the public URL of the uploaded image.
 *
 * @param {File} file
 * @returns {{ url: string | null, error }}
 */
export async function uploadAvatar(file) {
  if (!file) {
    return { url: null, error: new Error('Aucun fichier fourni.') };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `compagnons/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Erreur lors du téléversement de l\'avatar :', uploadError.message);
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { url: data?.publicUrl || null, error: null };
}

// ─────────────────────────────────────────────────────────────
// Task Management Functions
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all tasks (Admin/Editor only).
 * Joins compagnon name for display.
 * @returns {{ data, error }}
 */
export async function fetchAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, compagnon:compagnons!assigned_to(id, first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Fetch tasks assigned to a specific companion (Viewer/Compagnon).
 * @param {string} companionId
 * @returns {{ data, error }}
 */
export async function fetchMyTasks(companionId) {
  if (!companionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', companionId)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Create a new task.
 * @param {{ title, description, status, priority, assigned_to, due_date }} payload
 * @returns {{ data, error }}
 */
export async function createTask(payload) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: authErr || new Error('Non authentifié.') };

  const clean = Object.fromEntries(
    Object.entries({ ...payload, created_by: user.id }).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );

  const { data, error } = await supabase
    .from('tasks')
    .insert([clean])
    .select('*, compagnon:compagnons!assigned_to(id, first_name, last_name)')
    .single();
  return { data, error };
}

/**
 * Update the status of a task.
 * @param {string} taskId
 * @param {string} status  - 'todo' | 'in_progress' | 'done' | 'cancelled'
 * @returns {{ data, error }}
 */
export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a task by ID (Admin only).
 * @param {string} taskId
 * @returns {{ error }}
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  return { error };
}

// ─────────────────────────────────────────────────────────────
// Documents (Profile Tab)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all documents for a companion.
 * @param {string} companionId
 * @returns {{ data, error }}
 */
export async function fetchDocuments(companionId) {
  if (!companionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('compagnon_id', companionId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Add a document for a companion. Optionally uploads a file to Storage.
 * @param {string} companionId
 * @param {{ title: string, status: string, expiry_date?: string, icon?: string }} payload
 * @param {File|null} file
 * @returns {{ data, error }}
 */
export async function addDocument(companionId, payload, file = null) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: authErr || new Error('Non authentifié.') };

  let file_url = null;
  let file_name = null;

  if (file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `compagnons/${companionId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      file_url = urlData?.publicUrl || null;
      file_name = file.name;
    }
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      compagnon_id: companionId,
      title: payload.title,
      status: payload.status || 'valide',
      expiry_date: payload.expiry_date || null,
      icon: payload.icon || '📄',
      file_url,
      file_name,
      created_by: user.id,
    }])
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a document by ID.
 * @param {string} documentId
 * @returns {{ error }}
 */
export async function deleteDocument(documentId) {
  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  return { error };
}

// ─────────────────────────────────────────────────────────────
// Appointments (Profile Tab — fetches from existing appointments table)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all appointments linked to a specific companion.
 * @param {string} companionId
 * @returns {{ data, error }}
 */
export async function fetchCompanionAppointments(companionId) {
  if (!companionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('compagnon_id', companionId)
    .order('appointment_date', { ascending: false });
  return { data: data || [], error };
}

// ─────────────────────────────────────────────────────────────
// Formations (Profile Tab)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all formations for a companion.
 * @param {string} companionId
 * @returns {{ data, error }}
 */
export async function fetchFormations(companionId) {
  if (!companionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('compagnon_id', companionId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Add a formation for a companion.
 * @param {string} companionId
 * @param {{ title: string, location?: string, status: string, progress: number }} payload
 * @returns {{ data, error }}
 */
export async function addFormation(companionId, payload) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: authErr || new Error('Non authentifié.') };

  const { data, error } = await supabase
    .from('formations')
    .insert([{
      compagnon_id: companionId,
      title: payload.title,
      location: payload.location || null,
      status: payload.status || 'planifié',
      progress: Number(payload.progress) || 0,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      created_by: user.id,
    }])
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a formation by ID.
 * @param {string} formationId
 * @returns {{ error }}
 */
export async function deleteFormation(formationId) {
  const { error } = await supabase.from('formations').delete().eq('id', formationId);
  return { error };
}

// ─────────────────────────────────────────────────────────────
// Skills (Profile Tab)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all skills for a companion, grouped by category.
 * Returns { techniques: [], soft: [], languages: [], digital: [] }
 * @param {string} companionId
 * @returns {{ data: object, error }}
 */
export async function fetchSkills(companionId) {
  if (!companionId) return { data: { techniques: [], soft: [], languages: [], digital: [] }, error: null };
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('compagnon_id', companionId)
    .order('created_at', { ascending: true });

  if (error) return { data: { techniques: [], soft: [], languages: [], digital: [] }, error };

  const grouped = { techniques: [], soft: [], languages: [], digital: [] };
  (data || []).forEach((s) => {
    if (grouped[s.category]) grouped[s.category].push(s);
  });
  return { data: grouped, error: null };
}

/**
 * Add a skill for a companion.
 * @param {string} companionId
 * @param {{ category: string, name: string, progress: number }} payload
 * @returns {{ data, error }}
 */
export async function addSkill(companionId, payload) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: authErr || new Error('Non authentifié.') };

  const { data, error } = await supabase
    .from('skills')
    .insert([{
      compagnon_id: companionId,
      category: payload.category,
      name: payload.name,
      progress: Number(payload.progress) || 0,
      created_by: user.id,
    }])
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a skill by ID.
 * @param {string} skillId
 * @returns {{ error }}
 */
export async function deleteSkill(skillId) {
  const { error } = await supabase.from('skills').delete().eq('id', skillId);
  return { error };
}
