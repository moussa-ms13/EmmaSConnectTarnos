import React, { useState, useEffect, useCallback } from 'react';
import {
  Palmtree, Plus, Loader2, AlertTriangle, Calendar,
  Check, X, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import {
  createVacationRequest,
  getUserVacations,
  getAllVacations,
  updateVacationStatus,
} from '../../services/vacationService';

/**
 * Status badge configuration — colors and labels.
 */
const STATUS_CONFIG = {
  'En attente': {
    label: 'En attente',
    style: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  'Approuvé': {
    label: 'Approuvé',
    style: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  'Refusé': {
    label: 'Refusé',
    style: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

/**
 * Format date for French display.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Compute duration in days between two dates.
 */
function computeDays(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
}

/**
 * StatusBadge — Renders a colored status badge with icon.
 */
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['En attente'];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.style}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/**
 * VacationsList — Role-based Congés page.
 * Admin sees all requests with approve/reject actions.
 * User sees their own requests and a creation form.
 */
function VacationsList() {
  const { user, profile, canAdd, canEdit, canDelete } = useAuth();
  const roleName = profile?.roles?.name || 'user';
  const isAdmin = roleName === 'admin';

  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state (user view)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Action loading state (admin view)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /**
   * Load vacations based on role.
   */
  const loadVacations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = isAdmin
      ? await getAllVacations()
      : await getUserVacations();

    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setVacations(data || []);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    loadVacations();
  }, [loadVacations]);

  /**
   * Handle form submission — create vacation request.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const { error: createErr } = await createVacationRequest(formData);
      if (createErr) throw new Error(createErr.message);

      // Reset form and refresh
      setFormData({ start_date: '', end_date: '', reason: '' });
      setShowForm(false);
      await loadVacations();
    } catch (err) {
      setFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Admin action — approve or reject a request.
   */
  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const { error: updateErr } = await updateVacationStatus(id, newStatus);
      if (updateErr) throw new Error(updateErr.message);
      await loadVacations();
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // User view metrics: Prochain congé & Retour au travail prévu le
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const approvedVacations = vacations
    .filter((v) => v.status === 'Approuvé' && new Date(v.end_date) >= now)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  const nextVacation = approvedVacations[0] || null;

  const getReturnWorkDate = (endDateStr) => {
    if (!endDateStr) return '—';
    const d = new Date(endDateStr);
    d.setDate(d.getDate() + 1);
    return formatDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Congés - Gestion des absences
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAdmin
                ? 'Gérez et approuvez les demandes de congés des compagnons.'
                : 'Soumettez et suivez vos demandes de congés.'}
            </p>
          </div>
        </div>

        {/* Add button (user view only) */}
        {!isAdmin && canAdd && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle demande
          </button>
        )}
      </div>

      {/* ───── Request Form (user view) ───── */}
      {!isAdmin && canAdd && showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h3 className="text-sm font-bold text-gray-900">Nouvelle demande de congé</h3>
            <p className="text-xs text-gray-500 mt-0.5">Renseignez les dates et le motif de votre absence.</p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start date */}
              <div>
                <label htmlFor="vac-start" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="vac-start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                    onClick={(e) => { if ('showPicker' in e.target) { try { e.target.showPicker(); } catch {} } }}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              {/* End date */}
              <div>
                <label htmlFor="vac-end" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="vac-end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                    onClick={(e) => { if ('showPicker' in e.target) { try { e.target.showPicker(); } catch {} } }}
                    required
                    min={formData.start_date || undefined}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="vac-reason" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Motif
              </label>
              <textarea
                id="vac-reason"
                value={formData.reason}
                onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Congé annuel, raison médicale, événement familial..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Soumettre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───── User Summary Statistics Cards (Requester View) ───── */}
      {!isAdmin && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Next Vacation Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
              <Palmtree className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Prochain congé
              </p>
              <p className="text-lg font-bold text-gray-900 truncate mt-0.5">
                {nextVacation ? formatDate(nextVacation.start_date) : 'Aucun congé prévu'}
              </p>
              {nextVacation && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  Approuvé ({computeDays(nextVacation.start_date, nextVacation.end_date)} jour{computeDays(nextVacation.start_date, nextVacation.end_date) > 1 ? 's' : ''})
                </p>
              )}
            </div>
          </div>

          {/* Return to Work Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Retour au travail prévu le
              </p>
              <p className="text-lg font-bold text-gray-900 truncate mt-0.5">
                {nextVacation ? getReturnWorkDate(nextVacation.end_date) : '—'}
              </p>
              {nextVacation && (
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Lendemain de fin de congé
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── Loading ───── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* ───── Error ───── */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      )}

      {/* ───── Empty state ───── */}
      {!loading && !error && vacations.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Palmtree className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Aucune demande de congé
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {isAdmin
              ? 'Aucune demande de congé n\'a été soumise pour le moment.'
              : 'Vous n\'avez pas encore soumis de demande de congé. Cliquez sur "Nouvelle demande" pour en créer une.'}
          </p>
        </div>
      )}

      {/* ───── Data Table ───── */}
      {!loading && !error && vacations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  {isAdmin && (
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Demandeur
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                    Période
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                    Durée
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                    Motif
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                    Statut
                  </th>
                  {isAdmin && (
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vacations.map((vac) => {
                  const requesterName = vac.requester
                    ? `${vac.requester.first_name || ''} ${vac.requester.last_name || ''}`.trim()
                    : '—';
                  const days = computeDays(vac.start_date, vac.end_date);
                  const isPending = vac.status === 'En attente';
                  const isProcessing = actionLoadingId === vac.id;

                  return (
                    <tr
                      key={vac.id}
                      className="hover:bg-blue-50/30 transition-colors duration-150"
                    >
                      {/* Requester name (admin only) */}
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                              {requesterName !== '—'
                                ? requesterName.split(' ').map((n) => n[0]).join('').slice(0, 2)
                                : '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{requesterName}</span>
                          </div>
                        </td>
                      )}

                      {/* Period */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {formatDate(vac.start_date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          au {formatDate(vac.end_date)}
                        </p>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-700">
                          {days} jour{days > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-[200px] truncate">
                          {vac.reason || '—'}
                        </p>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <StatusBadge status={vac.status} />
                      </td>

                      {/* Admin action buttons */}
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && !isProcessing && canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(vac.id, 'Approuvé')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accepter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(vac.id, 'Refusé')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Refuser
                                </button>
                              </>
                            )}
                            {isProcessing && (
                              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            )}
                            {!isPending && !isProcessing && (
                              <span className="text-xs text-gray-400">Traité</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacationsList;
