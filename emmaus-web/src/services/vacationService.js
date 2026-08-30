import supabase from './supabaseClient';

/**
 * vacationService — CRUD operations for the vacations table.
 * Supports RBAC: users create requests, admins approve/reject.
 */

/**
 * Create a new vacation request.
 * Automatically injects the authenticated user as `requested_by`.
 * Default status is 'En attente'.
 *
 * @param {{ compagnon_id?: string, start_date: string, end_date: string, reason?: string }} data
 * @returns {{ data, error }}
 */
export async function createVacationRequest(data) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Utilisateur non authentifié.') };
  }

  // Ensure a profile row exists for the FK constraint.
  // Try upsert first; if RLS blocks INSERT, try a plain insert as fallback.
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, first_name: user.user_metadata?.first_name || null, last_name: user.user_metadata?.last_name || null },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  if (upsertErr) {
    // Fallback: try plain insert (ignore duplicate key errors)
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: user.id })
      .select()
      .maybeSingle();
    // If both fail and it's NOT a duplicate key error, surface it
    if (insertErr && !insertErr.message?.includes('duplicate') && !insertErr.message?.includes('already exists')) {
      console.warn('[vacationService] Could not ensure profile row:', insertErr.message);
    }
  }

  const payload = {
    ...data,
    compagnon_id: data.compagnon_id || null,
    requested_by: user.id,
    status: 'En attente',
  };

  const { data: result, error } = await supabase
    .from('vacations')
    .insert([payload])
    .select()
    .single();

  return { data: result, error };
}

/**
 * Fetch vacation requests only for the logged-in user.
 * Falls back to fetching all (no filter) if the `requested_by` column
 * doesn't exist yet in the database.
 * Ordered newest first.
 *
 * @returns {{ data, error }}
 */
export async function getUserVacations() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Utilisateur non authentifié.') };
  }

  let { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('requested_by', user.id)
    .order('created_at', { ascending: false });

  // Fallback: if requested_by column doesn't exist yet, fetch all
  if (error && error.message?.includes('requested_by')) {
    const fallback = await supabase
      .from('vacations')
      .select('*')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  return { data, error };
}

/**
 * Fetch ALL vacation requests from all users (Admin view).
 * Joins with profiles to get requester name.
 * Ordered newest first.
 *
 * @returns {{ data, error }}
 */
export async function getAllVacations() {
  let { data, error } = await supabase
    .from('vacations')
    .select('*, requester:profiles!requested_by(id, first_name, last_name)')
    .order('created_at', { ascending: false });

  // Fallback: if the join fails (schema not yet applied)
  if (error) {
    const fallback = await supabase
      .from('vacations')
      .select('*')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  return { data, error };
}

/**
 * Update the status of a vacation request (Admin action).
 *
 * @param {string} id - Vacation request UUID
 * @param {'Approuvé' | 'Refusé'} newStatus
 * @returns {{ data, error }}
 */
export async function updateVacationStatus(id, newStatus) {
  const { data, error } = await supabase
    .from('vacations')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}
