import React, { useState } from 'react';
import {
  X, Calendar, Stethoscope, UserCheck, FileText,
  Loader2, PlusCircle, Clock,
} from 'lucide-react';
import { createConsultation } from '../../services/healthService';

const STATUS_OPTIONS = ['Terminé', 'Confirmé', 'Planifié', 'Annulé'];

/**
 * ConsultationForm — Modal form to add a new medical consultation for a companion.
 * Uses interactive date picker with showPicker support.
 * @param {{
 *   compagnonId: string,
 *   companionName: string,
 *   onSuccess: function,
 *   onClose: function
 * }} props
 */
function ConsultationForm({ compagnonId, companionName, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    specialty: '',
    doctor_name: '',
    status: 'Terminé',
    notes: '',
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
        date: formData.date ? new Date(formData.date).toISOString() : null,
        specialty: formData.specialty.trim() || 'Consultation générale',
        doctor_name: formData.doctor_name.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      const { error: createErr } = await createConsultation(payload);
      if (createErr) {
        throw new Error(createErr.message || 'Erreur lors de la création de la consultation.');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* ───── Header ───── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Nouvelle consultation
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
            {/* Date */}
            <div>
              <label htmlFor="cons-date" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="cons-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  onClick={(e) => {
                    if ('showPicker' in e.target) {
                      try { e.target.showPicker(); } catch {}
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="cons-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Statut
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                <select
                  id="cons-status"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specialty */}
            <div>
              <label htmlFor="cons-spec" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Spécialité / Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="cons-spec"
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="ex: Médecin généraliste"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>

            {/* Doctor */}
            <div>
              <label htmlFor="cons-doc" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Praticien
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="cons-doc"
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData((p) => ({ ...p, doctor_name: e.target.value }))}
                  placeholder="ex: Dr. Lefèvre"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="cons-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes / Observations
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <textarea
                id="cons-notes"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Prescriptions, recommandations, prochain contrôle..."
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
                  <PlusCircle className="w-4 h-4" />
                  Ajouter la consultation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConsultationForm;
