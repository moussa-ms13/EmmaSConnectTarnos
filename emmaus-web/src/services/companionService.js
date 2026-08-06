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
// Real schema: public.documents
//   compagnon_id, file_name, file_url, file_type, file_size,
//   expiration_date, status ('Valide'|'À renouveler'|'Expiré')
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all documents for a companion.
 * Delegates to the existing documentService logic but scoped to one companion.
 * @param {string} companionId
 * @returns {{ data: array, error }}
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
 * Add a document record for a companion, with optional file upload to the
 * existing 'documents' storage bucket.
 *
 * Maps UI fields → real schema columns:
 *   payload.title       → file_name  (the documents table has no 'title' column)
 *   payload.file_type   → file_type  ('Identité'|'Médical'|'Administratif'|'Formation'|'Autre')
 *   payload.status      → status     ('Valide'|'À renouveler'|'Expiré')
 *   payload.expiry_date → expiration_date
 *
 * @param {string} companionId
 * @param {{ title: string, file_type?: string, status?: string, expiry_date?: string }} payload
 * @param {File|null} file
 * @returns {{ data, error }}
 */
export async function addDocument(companionId, payload, file = null) {
  let file_url = '#';
  let file_name = payload.title || 'Document';
  let file_size = 0;

  if (file) {
    const fileExt = file.name.split('.').pop();
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `compagnons/${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      file_url = urlData?.publicUrl || '#';
      file_name = file.name;
      file_size = file.size || 0;
    } else {
      console.warn('Storage upload error (non-fatal):', uploadErr.message);
    }
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      compagnon_id: companionId,
      file_name,
      file_url,
      file_type:        payload.file_type       || 'Administratif',
      file_size,
      expiration_date:  payload.expiry_date      || null,
      status:           payload.status           || 'Valide',
    }])
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a document record (and its storage file) by ID.
 * Delegates to the full logic in documentService, replicated here to avoid
 * a circular import.
 * @param {string} documentId
 * @param {string} [fileUrl]
 * @returns {{ error }}
 */
export async function deleteDocument(documentId, fileUrl) {
  // Try to delete from storage first (best-effort)
  const targetUrl = fileUrl || (await supabase
    .from('documents').select('file_url').eq('id', documentId).maybeSingle()
  ).data?.file_url;

  if (targetUrl && targetUrl !== '#') {
    const marker = '/documents/';
    const idx = targetUrl.indexOf(marker);
    if (idx !== -1) {
      const filePath = decodeURIComponent(targetUrl.substring(idx + marker.length));
      await supabase.storage.from('documents').remove([filePath]);
    }
  }

  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  return { error };
}

// ─────────────────────────────────────────────────────────────
// Appointments (Profile Tab)
// Real schema: public.appointments
//   compagnon_id, appointment_date, doctor_name, specialty,
//   location, is_urgent, status
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all appointments for a specific companion, newest first.
 * @param {string} companionId
 * @returns {{ data: array, error }}
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

/**
 * Submit an appointment request for a companion.
 * @param {string} compagnonId
 * @param {string} message
 * @returns {{ data, error }}
 */
export async function submitAppointmentRequest(compagnonId, message) {
  const { data, error } = await supabase
    .from('appointment_requests')
    .insert([{
      compagnon_id: compagnonId,
      message,
      status: 'En attente'
    }])
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch all pending appointment requests.
 * @returns {{ data, error }}
 */
export async function fetchPendingAppointmentRequests() {
  const { data, error } = await supabase
    .from('appointment_requests')
    .select('*, compagnon:compagnons(first_name, last_name, avatar_url)')
    .eq('status', 'En attente')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Mark an appointment request as handled (Traité).
 * @param {string} requestId
 * @returns {{ data, error }}
 */
export async function markAppointmentRequestHandled(requestId) {
  const { data, error } = await supabase
    .from('appointment_requests')
    .update({ status: 'Traité' })
    .eq('id', requestId)
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────
// Formations (Profile Tab)
// Real schema: many-to-many via public.compagnon_formations
//   compagnon_id, formation_id, progress_percentage, status,
//   completed_at
// The formation catalogue lives in public.formations (title, duration_hours)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch a companion's formation assignments with joined formation details.
 * Returns a flat list: { id (assignment id), formation_id, title, progress_percentage, status, completed_at }
 * @param {string} companionId
 * @returns {{ data: array, error }}
 */
export async function fetchFormations(companionId) {
  if (!companionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('compagnon_formations')
    .select('*, formations(id, title, duration_hours)')
    .eq('compagnon_id', companionId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };

  // Flatten so the UI can read .title, .progress, .status directly
  const flat = (data || []).map((row) => ({
    id:                   row.id,
    formation_id:         row.formation_id,
    compagnon_id:         row.compagnon_id,
    title:                row.formations?.title || 'Formation sans titre',
    duration_hours:       row.formations?.duration_hours || 0,
    progress_percentage:  row.progress_percentage || 0,
    // Normalise status to match the UI badge keys
    status:               normaliseFormationStatus(row.status),
    completed_at:         row.completed_at,
    created_at:           row.created_at,
  }));

  return { data: flat, error: null };
}

/** Map DB status values to the UI badge keys used in FormationBadge */
function normaliseFormationStatus(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('termin') || s.includes('obtenu') || s.includes('complet')) return 'obtenu';
  if (s.includes('cours') || s.includes('progress') || s.includes('encours')) return 'en_cours';
  return 'planifié';
}

/**
 * Add a formation to a companion's profile.
 * Strategy:
 *   1. Upsert into public.formations to get/create the catalogue entry.
 *   2. Insert a row in public.compagnon_formations linking companion ↔ formation.
 *
 * @param {string} companionId
 * @param {{ title: string, status?: string, progress?: number }} payload
 * @returns {{ data, error }}  — returns the flattened assignment row
 */
export async function addFormation(companionId, payload) {
  // Step 1: Ensure the formation title exists in the catalogue
  let formationId;
  const { data: existing } = await supabase
    .from('formations')
    .select('id')
    .ilike('title', payload.title.trim())
    .maybeSingle();

  if (existing?.id) {
    formationId = existing.id;
  } else {
    const { data: newFormation, error: createErr } = await supabase
      .from('formations')
      .insert([{ title: payload.title.trim(), duration_hours: 0, participants_count: 0 }])
      .select('id')
      .single();
    if (createErr) return { data: null, error: createErr };
    formationId = newFormation.id;
  }

  // Map UI progress % and status to DB columns
  const dbStatus = payload.status === 'obtenu'
    ? 'Terminé'
    : payload.status === 'en_cours'
    ? 'En cours'
    : 'À commencer';

  const progress = Number(payload.progress) || 0;
  const completedAt = dbStatus === 'Terminé' ? (payload.completed_at || new Date().toISOString().split('T')[0]) : null;

  // Step 2: Insert the junction row
  const { data, error } = await supabase
    .from('compagnon_formations')
    .insert([{
      compagnon_id:         companionId,
      formation_id:         formationId,
      progress_percentage:  progress,
      status:               dbStatus,
      completed_at:         completedAt,
    }])
    .select('*, formations(id, title, duration_hours)')
    .single();

  if (error) return { data: null, error };

  // Return the flattened shape the UI expects
  return {
    data: {
      id:                  data.id,
      formation_id:        data.formation_id,
      compagnon_id:        data.compagnon_id,
      title:               data.formations?.title || payload.title,
      duration_hours:      data.formations?.duration_hours || 0,
      progress_percentage: data.progress_percentage,
      status:              normaliseFormationStatus(data.status),
      completed_at:        data.completed_at,
      created_at:          data.created_at,
    },
    error: null,
  };
}

/**
 * Delete a formation assignment from compagnon_formations by assignment ID.
 * Does NOT delete the formation from the catalogue.
 * @param {string} assignmentId
 * @returns {{ error }}
 */
export async function deleteFormation(assignmentId) {
  const { error } = await supabase
    .from('compagnon_formations')
    .delete()
    .eq('id', assignmentId);
  return { error };
}

// ─────────────────────────────────────────────────────────────
// Skills — NOTE: No 'skills' table exists in this database.
// The Compétences tab is mapped from compagnon_formations data
// grouped by formation category, or left as an empty section
// with an explanatory empty state. These stubs return empty data
// gracefully so no runtime errors occur.
// ─────────────────────────────────────────────────────────────

/** No-op: skills table does not exist. Returns empty grouped object. */
export async function fetchSkills(_companionId) {
  return { data: { techniques: [], soft: [], languages: [], digital: [] }, error: null };
}

/** No-op: skills table does not exist. Returns null data gracefully. */
export async function addSkill(_companionId, _payload) {
  return { data: null, error: new Error('Le module Compétences sera disponible prochainement.') };
}

/** No-op: skills table does not exist. */
export async function deleteSkill(_skillId) {
  return { error: null };
}


