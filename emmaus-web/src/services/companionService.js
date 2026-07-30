import supabase from './supabaseClient';

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

  // Separate medical data from companion fields
  const { medical, ...companionData } = payload;

  // Clean empty strings from companion data
  const cleanData = Object.fromEntries(
    Object.entries(companionData).filter(([, v]) => v !== '' && v !== undefined)
  );

  const { data, error } = await supabase
    .from('compagnons')
    .insert([{ ...cleanData, created_by: user.id }])
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
  const { medical, ...companionData } = payload;

  const { data, error } = await supabase
    .from('compagnons')
    .update(companionData)
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

