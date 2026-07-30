import supabase from './supabaseClient';

/**
 * healthService — CRUD operations for the consultations table.
 */

/**
 * Fetch all consultations for a given companion, ordered newest first.
 * @param {string} compagnonId
 * @returns {{ data, error }}
 */
export async function fetchConsultations(compagnonId) {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('compagnon_id', compagnonId)
    .order('date', { ascending: false });
  return { data, error };
}

/**
 * Fetch all consultations across all companions (for the Health dashboard overview).
 * @returns {{ data, error }}
 */
export async function fetchAllConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*, compagnons(id, first_name, last_name)')
    .order('date', { ascending: false });
  return { data, error };
}

/**
 * Create a new consultation.
 * @param {object} consultation
 * @returns {{ data, error }}
 */
export async function createConsultation(consultation) {
  const { data, error } = await supabase
    .from('consultations')
    .insert([consultation])
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch medical record for a companion.
 * @param {string} compagnonId
 * @returns {{ data, error }}
 */
export async function fetchMedicalRecord(compagnonId) {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('compagnon_id', compagnonId)
    .maybeSingle();
  return { data, error };
}

/**
 * Update (or upsert) a medical record.
 * @param {string} recordId
 * @param {object} data
 * @returns {Promise<{ data, error }>}
 */
export async function updateMedicalRecord(recordId, data) {
  if (data.compagnon_id) {
    const { data: res, error } = await supabase
      .from('medical_records')
      .upsert(
        { ...data, id: recordId && recordId !== data.compagnon_id ? recordId : undefined },
        { onConflict: 'compagnon_id' }
      )
      .select()
      .maybeSingle();
    return { data: res, error };
  } else {
    const { data: res, error } = await supabase
      .from('medical_records')
      .update(data)
      .eq('id', recordId)
      .select()
      .maybeSingle();
    return { data: res, error };
  }
}


/**
 * Normalize an array or comma-separated string into a clean string array.
 * @param {string | string[] | null} val
 * @returns {string[]}
 */
export function parseMedicalList(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Fetch full health overview for a companion (medical record + consultations).
 * @param {string} compagnonId
 * @returns {Promise<{ medicalRecord, consultations, error }>}
 */
export async function fetchCompanionHealthData(compagnonId) {
  const [medRes, consRes] = await Promise.all([
    fetchMedicalRecord(compagnonId),
    fetchConsultations(compagnonId),
  ]);

  const medicalRecord = medRes.data
    ? {
        ...medRes.data,
        pathologiesList: parseMedicalList(medRes.data.pathologies),
        allergiesList: parseMedicalList(medRes.data.allergies),
      }
    : null;

  return {
    medicalRecord,
    consultations: consRes.data || [],
    error: medRes.error || consRes.error || null,
  };
}

