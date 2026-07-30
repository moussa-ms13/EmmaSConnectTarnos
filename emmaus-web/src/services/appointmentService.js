import supabase from './supabaseClient';

/**
 * appointmentService — CRUD operations for the appointments table.
 */

/**
 * Fetch all appointments joined with companion details, ordered by appointment_date ascending.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getAllAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .order('appointment_date', { ascending: true });

  return { data, error };
}

/**
 * Create a new appointment.
 * @param {object} appointmentData
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function createAppointment(appointmentData) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .maybeSingle();

  return { data, error };
}

/**
 * Update an existing appointment by ID.
 * @param {string} id - Appointment ID
 * @param {object} updateData
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateAppointment(id, updateData) {
  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
    .maybeSingle();

  return { data, error };
}

/**
 * Delete an appointment by ID.
 * @param {string} id - Appointment ID
 * @returns {Promise<{ error: object }>}
 */
export async function deleteAppointment(id) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  return { error };
}
