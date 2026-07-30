import React, { useState } from 'react';
import {
  X, Droplets, Stethoscope, Activity, AlertCircle,
  FileText, Loader2, Save,
} from 'lucide-react';
import { updateMedicalRecord, parseMedicalList } from '../../services/healthService';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * MedicalRecordForm — Modal form to edit a companion's medical profile.
 * Parses comma-separated strings for pathologies and allergies into clean string arrays.
 * @param {{
 *   compagnonId: string,
 *   companionName: string,
 *   medicalRecord: object | null,
 *   onSuccess: function,
 *   onClose: function
 * }} props
 */
function MedicalRecordForm({ compagnonId, companionName, medicalRecord, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    blood_type: medicalRecord?.blood_type || '',
    doctor_name: medicalRecord?.doctor_name || '',
    pathologies: Array.isArray(medicalRecord?.pathologies)
      ? medicalRecord.pathologies.join(', ')
      : medicalRecord?.pathologies || '',
    allergies: Array.isArray(medicalRecord?.allergies)
      ? medicalRecord.allergies.join(', ')
      : medicalRecord?.allergies || '',
    health_summary: medicalRecord?.health_summary || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        compagnon_id: compagnonId,
        blood_type: formData.blood_type.trim() || null,
        doctor_name: formData.doctor_name.trim() || null,
        pathologies: parseMedicalList(formData.pathologies),
        allergies: parseMedicalList(formData.allergies),
        health_summary: formData.health_summary.trim() || null,
      };

      const { error: saveErr } = await updateMedicalRecord(medicalRecord?.id || compagnonId, payload);
      if (saveErr) {
        throw new Error(saveErr.message || 'Erreur lors de la sauvegarde du dossier médical.');
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ───── Header ───── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Modifier le dossier médical
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {companionName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ───── Form Body ───── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Type */}
            <div>
              <label htmlFor="med-blood" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Groupe sanguin
              </label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 pointer-events-none" />
                <select
                  id="med-blood"
                  value={formData.blood_type}
                  onChange={(e) => setFormData((p) => ({ ...p, blood_type: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                >
                  <option value="">Non spécifié</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doctor Name */}
            <div>
              <label htmlFor="med-doctor" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Médecin traitant
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                <input
                  id="med-doctor"
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData((p) => ({ ...p, doctor_name: e.target.value }))}
                  placeholder="ex: Dr. Martin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Pathologies */}
          <div>
            <label htmlFor="med-pathologies" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Pathologies chroniques
            </label>
            <div className="relative">
              <Activity className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500 pointer-events-none" />
              <textarea
                id="med-pathologies"
                value={formData.pathologies}
                onChange={(e) => setFormData((p) => ({ ...p, pathologies: e.target.value }))}
                placeholder="ex: Hypertension, Diabète de type 2, Asthme (séparés par des virgules)"
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Séparez chaque pathologie par une virgule.
            </p>
          </div>

          {/* Allergies */}
          <div>
            <label htmlFor="med-allergies" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Allergies connues
            </label>
            <div className="relative">
              <AlertCircle className="absolute left-3.5 top-3.5 w-4 h-4 text-red-500 pointer-events-none" />
              <textarea
                id="med-allergies"
                value={formData.allergies}
                onChange={(e) => setFormData((p) => ({ ...p, allergies: e.target.value }))}
                placeholder="ex: Pénicilline, Arachides, Pollen (séparés par des virgules)"
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Séparez chaque allergie par une virgule.
            </p>
          </div>

          {/* Health Summary */}
          <div>
            <label htmlFor="med-summary" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Résumé général / Notes médicales
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <textarea
                id="med-summary"
                value={formData.health_summary}
                onChange={(e) => setFormData((p) => ({ ...p, health_summary: e.target.value }))}
                placeholder="Observation générale sur la situation de santé, traitements en cours, précautions..."
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* ───── Footer ───── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalRecordForm;
