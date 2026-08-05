import React, { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, Stethoscope, User, MapPin,
  AlertTriangle, Loader2, Save, PlusCircle, Send,
} from 'lucide-react';
import { createAppointment, updateAppointment } from '../../services/appointmentService';
import { fetchCompanions } from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';

const STATUS_OPTIONS = ['Confirmé', 'En attente', 'À confirmer', 'Annulé'];

/**
 * AppointmentModal — Form modal to schedule or request an appointment.
 *
 * Role-aware behaviour:
 *  - Admin / Editor: can choose any status, sees "Planifier un rendez-vous".
 *  - Viewer:         status is locked to 'En attente', sees "Demander un rendez-vous".
 *
 * After save, always calls onSuccess() so the parent re-fetches fresh data
 * from the DB — prevents WSOD caused by injecting incomplete partial objects.
 */
function AppointmentModal({
  appointment = null,
  companions = [],
  defaultCompanionId = '',
  onSuccess,
  onClose,
}) {
  const { isViewer } = useAuth();
  const isEditing = Boolean(appointment);

  const [companionList, setCompanionList] = useState(companions || []);

  // Fetch companions if not provided by parent
  useEffect(() => {
    if (!companionList || companionList.length === 0) {
      fetchCompanions().then(({ data }) => {
        setCompanionList(data || []);
      });
    }
  }, [companionList]);

  // Extract initial date and time from ISO string if editing
  const getInitialDate = () => {
    if (appointment?.appointment_date) {
      return new Date(appointment.appointment_date).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const getInitialTime = () => {
    if (appointment?.appointment_date) {
      const d = new Date(appointment.appointment_date);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    }
    return '10:00';
  };

  // Viewers always submit with 'En attente'
  const initialStatus = isViewer ? 'En attente' : (appointment?.status || 'Confirmé');

  const [formData, setFormData] = useState({
    compagnon_id: appointment?.compagnon_id || defaultCompanionId || '',
    date: getInitialDate(),
    time: getInitialTime(),
    specialty: appointment?.specialty || '',
    doctor_name: appointment?.doctor_name || '',
    location: appointment?.location || '',
    is_urgent: appointment?.is_urgent || false,
    status: initialStatus,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!formData.compagnon_id) {
        throw new Error('Veuillez sélectionner un compagnon.');
      }
      if (!formData.date) {
        throw new Error('Veuillez sélectionner une date.');
      }

      // Combine date and time into ISO timestamp
      const dateTimeString = `${formData.date}T${formData.time || '09:00'}:00`;
      const isoDate = new Date(dateTimeString).toISOString();

      const payload = {
        compagnon_id: formData.compagnon_id,
        appointment_date: isoDate,
        specialty: formData.specialty.trim() || 'Consultation',
        doctor_name: formData.doctor_name.trim() || null,
        location: formData.location.trim() || null,
        is_urgent: formData.is_urgent,
        // Viewers are always locked to 'En attente'
        status: isViewer ? 'En attente' : formData.status,
      };

      if (isEditing) {
        const { error: updErr } = await updateAppointment(appointment.id, payload);
        if (updErr) throw new Error(updErr.message || 'Erreur lors de la modification.');
      } else {
        const { error: createErr } = await createAppointment(payload);
        if (createErr) throw new Error(createErr.message || 'Erreur lors de la création.');
      }

      // Always delegate re-fetch to parent — never inject partial objects
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
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
              {isEditing
                ? 'Modifier le rendez-vous'
                : isViewer
                  ? 'Demander un rendez-vous'
                  : 'Planifier un rendez-vous'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEditing
                ? 'Modifiez les informations du rendez-vous médical.'
                : isViewer
                  ? 'Soumettez une demande de rendez-vous. Elle sera examinée par un administrateur.'
                  : 'Planifiez une nouvelle consultation pour un compagnon.'}
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

        {/* ───── Viewer info banner ───── */}
        {isViewer && !isEditing && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <Send className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Votre demande sera soumise avec le statut <strong>« En attente »</strong> et nécessite une validation par un administrateur.
            </p>
          </div>
        )}

        {/* ───── Form Body ───── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Companion Selector */}
          <div>
            <label htmlFor="apt-companion" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Compagnon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                id="apt-companion"
                required
                value={formData.compagnon_id}
                onChange={(e) => setFormData((p) => ({ ...p, compagnon_id: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
              >
                <option value="">Sélectionner un compagnon</option>
                {companionList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="apt-date" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="apt-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  onClick={(e) => { if ('showPicker' in e.target) { try { e.target.showPicker(); } catch {} } }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label htmlFor="apt-time" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Heure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="apt-time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Specialty & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="apt-spec" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Spécialité / Motif <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="apt-spec"
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="ex: Médecin généraliste, Dentiste"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="apt-doc" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Praticien
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="apt-doc"
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData((p) => ({ ...p, doctor_name: e.target.value }))}
                  placeholder="ex: Dr. Martin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Location & Status (Status hidden for Viewers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="apt-location" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Lieu / Adresse
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="apt-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  placeholder="ex: Hôpital de Bayonne"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                />
              </div>
            </div>

            {/* Status — Admin/Editor only */}
            {!isViewer && (
              <div>
                <label htmlFor="apt-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Statut
                </label>
                <select
                  id="apt-status"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Viewer sees a read-only "En attente" badge */}
            {isViewer && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Statut
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  En attente de validation
                </div>
              </div>
            )}
          </div>

          {/* Urgent checkbox toggle — hidden for viewers */}
          {!isViewer && (
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData((p) => ({ ...p, is_urgent: e.target.checked }))}
                  className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-800">
                    Marquer comme rendez-vous URGENT
                  </span>
                </div>
              </label>
            </div>
          )}

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
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all ${
                isViewer
                  ? 'bg-amber-500 shadow-amber-500/25 hover:bg-amber-600'
                  : 'bg-blue-600 shadow-blue-600/25 hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isViewer ? (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer la demande
                </>
              ) : (
                <>
                  {isEditing ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  {isEditing ? 'Enregistrer' : 'Planifier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentModal;
