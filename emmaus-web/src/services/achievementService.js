import supabase from './supabaseClient';

/**
 * achievementService — CRUD operations for the achievements (Réalisations & badges) table.
 */

/**
 * Fetch all achievements joined with companion details.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getAllAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .order('date_awarded', { ascending: false });

  return { data, error };
}

/**
 * Fetch achievements for a specific companion.
 * @param {string} compagnonId
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getCompanionAchievements(compagnonId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('compagnon_id', compagnonId)
    .order('date_awarded', { ascending: false });

  return { data, error };
}

/**
 * Create/award a new achievement to a companion.
 * @param {object} achievementData - { compagnon_id, title, description, category, badge_level, date_awarded }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function createAchievement(achievementData) {
  const { data, error } = await supabase
    .from('achievements')
    .insert([achievementData])
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .maybeSingle();

  return { data, error };
}

/**
 * Update an existing achievement.
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateAchievement(id, updateData) {
  const { data, error } = await supabase
    .from('achievements')
    .update(updateData)
    .eq('id', id)
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .maybeSingle();

  return { data, error };
}

/**
 * Delete an achievement.
 * @param {string} id
 * @returns {Promise<{ error: object }>}
 */
export async function deleteAchievement(id) {
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', id);

  return { error };
}
