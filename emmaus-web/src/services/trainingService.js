import supabase from './supabaseClient';

/**
 * trainingService — CRUD operations for Formations and companion progress.
 */

/**
 * Fetch all available training courses.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getAllFormations() {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .order('title', { ascending: true });

  return { data, error };
}

/**
 * Fetch all companion training assignments with course and companion details.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getAllCompanionFormations() {
  const { data, error } = await supabase
    .from('compagnon_formations')
    .select('*, formations(*), compagnons(id, first_name, last_name, avatar_url, profession)')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch training assignments for a specific companion.
 * @param {string} compagnonId
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getCompanionFormations(compagnonId) {
  const { data, error } = await supabase
    .from('compagnon_formations')
    .select('*, formations(*)')
    .eq('compagnon_id', compagnonId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Create a new training course.
 * @param {object} formationData - { title, duration_hours, participants_count }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function createFormation(formationData) {
  const { data, error } = await supabase
    .from('formations')
    .insert([formationData])
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Update an existing training course by ID.
 * @param {string} id - Formation ID
 * @param {object} formationData - { title, duration_hours, participants_count }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateFormation(id, formationData) {
  const { data, error } = await supabase
    .from('formations')
    .update(formationData)
    .eq('id', id)
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Delete a training course by ID.
 * @param {string} id - Formation ID
 * @returns {Promise<{ error: object }>}
 */
export async function deleteFormation(id) {
  const { error } = await supabase
    .from('formations')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Assign a training course to a companion.
 * @param {object} assignmentData - { compagnon_id, formation_id, progress_percentage, status }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function assignFormation(assignmentData) {
  const { data, error } = await supabase
    .from('compagnon_formations')
    .insert([assignmentData])
    .select('*, formations(*), compagnons(id, first_name, last_name, avatar_url)')
    .maybeSingle();

  return { data, error };
}

/**
 * Update training progress and status for an assignment.
 * @param {string} id - Assignment ID
 * @param {object} updateData - { progress_percentage, status, completed_at }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateFormationProgress(id, updateData) {
  const { data, error } = await supabase
    .from('compagnon_formations')
    .update(updateData)
    .eq('id', id)
    .select('*, formations(*)')
    .maybeSingle();

  return { data, error };
}

/**
 * Delete a training assignment.
 * @param {string} id
 * @returns {Promise<{ error: object }>}
 */
export async function deleteFormationAssignment(id) {
  const { error } = await supabase
    .from('compagnon_formations')
    .delete()
    .eq('id', id);

  return { error };
}
