import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, User,
  Plus, Edit3, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, X, CheckCircle2,
  HelpCircle, AlertCircle, CalendarPlus, Send,
} from 'lucide-react';
import { getAllAppointments, deleteAppointment } from '../../services/appointmentService';
import { fetchCompanions, fetchPendingAppointmentRequests, markAppointmentRequestHandled } from '../../services/companionService';
import AppointmentModal from './AppointmentModal';
import { useAuth } from '../../components/auth/AuthProvider';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * AppointmentsList — Rendez-vous module main page.
 * Role-aware: Admins/Editors see "Planifier un RDV", Viewers see "Demander un RDV".
 * Safe optional chaining on all compagnons relation fields to prevent WSOD.
 */
function AppointmentsList() {
  const { canAdd, canEdit, canDelete, isViewer } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendrier');

  // Calendar view state
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [defaultCompanionId, setDefaultCompanionId] = useState('');
  const [handlingRequestId, setHandlingRequestId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptsRes, compsRes, reqsRes] = await Promise.all([
        getAllAppointments(),
        fetchCompanions(),
        fetchPendingAppointmentRequests(),
      ]);
      setAppointments(aptsRes.data || []);
      setCompanions(compsRes.data || []);
      setPendingRequests(reqsRes.data || []);
    } catch (err) {
      console.error('[AppointmentsList] loadData error:', err);
      setAppointments([]);
      setCompanions([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;
    await deleteAppointment(id);
    await loadData();
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    setDefaultCompanionId('');
    setHandlingRequestId(null);
    setModalOpen(true);
  };

  const openEditModal = (apt) => {
    setEditingAppointment(apt);
    setDefaultCompanionId(apt.compagnon_id || '');
    setHandlingRequestId(null);
    setModalOpen(true);
  };

  const openPlanifyRequest = (req) => {
    setEditingAppointment(null);
    setDefaultCompanionId(req.compagnon_id);
    setHandlingRequestId(req.id);
    setModalOpen(true);
  };

  // ───── Calendar helpers ─────
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // Adjust Monday = 0, Sunday = 6
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonthDate(new Date());
    setSelectedDay(null);
  };

  const monthLabel = currentMonthDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  // Group appointments by YYYY-MM-DD
  const aptsByDate = {};
  appointments.forEach((apt) => {
    if (!apt.appointment_date) return;
    const dStr = new Date(apt.appointment_date).toISOString().split('T')[0];
    if (!aptsByDate[dStr]) aptsByDate[dStr] = [];
    aptsByDate[dStr].push(apt);
  });

  // Filter appointments for the right column list
  const filteredAppointments = selectedDay
    ? appointments.filter((a) => {
        if (!a.appointment_date) return false;
        return new Date(a.appointment_date).toISOString().split('T')[0] === selectedDay;
      })
    : appointments;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmé':
        return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'En attente':
        return { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      case 'À confirmer':
        return { badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'Annulé':
        return { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
      default:
        return { badge: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} à ${timePart}`;
  };

  const getInitials = (first, last) => {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ───── Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Rendez-vous — Planification &amp; suivi médical
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organisation et suivi des rendez-vous médicaux, administratifs et d'accompagnement.
            </p>
          </div>
        </div>

        {/* Role-based primary button */}
        {canAdd && !isViewer && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Planifier un RDV
          </button>
        )}
        {isViewer && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-500/25 hover:bg-amber-600 active:scale-[0.98] transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            Demander un RDV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('calendrier')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'calendrier' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Calendrier des consultations
        </button>
        <button
          onClick={() => setActiveTab('demandes')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'demandes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Demandes de rendez-vous
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ───── Main Layout Grid ───── */}
      {activeTab === 'calendrier' ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ───── Left Column (Calendar & Legend) ───── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Calendar Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 capitalize">{monthLabel}</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors mr-1"
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-xs font-bold text-gray-400 py-1">{day}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl bg-gray-50/40" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const cellDate = new Date(year, month, dayNum);
                const cellDateStr = cellDate.toISOString().split('T')[0];
                const dayApts = aptsByDate[cellDateStr] || [];
                const isSelected = selectedDay === cellDateStr;
                const isToday = new Date().toISOString().split('T')[0] === cellDateStr;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : cellDateStr)}
                    className={`h-10 sm:h-12 rounded-xl p-1 flex flex-col items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20 font-bold'
                        : isToday
                          ? 'border-blue-200 bg-blue-50/40 font-bold text-blue-700'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {dayApts.length > 0 && (
                      <div className="flex items-center gap-0.5 justify-center flex-wrap max-w-full">
                        {Array.from(new Set(dayApts.map((a) => a.status || 'Confirmé')))
                          .slice(0, 3)
                          .map((st, idx) => (
                            <span key={idx} className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(st).dot}`} />
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───── Legend Card ───── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Légende des statuts
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-700">
              {[
                { label: 'Confirmé', color: 'bg-emerald-500' },
                { label: 'En attente', color: 'bg-amber-500' },
                { label: 'À confirmer', color: 'bg-blue-500' },
                { label: 'Annulé', color: 'bg-red-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───── Right Column (Upcoming Appointments List) ───── */}
        <div className="lg:col-span-7 space-y-4">
          {/* List Header */}
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">
                {selectedDay
                  ? `Rendez-vous du ${new Date(selectedDay).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Prochains rendez-vous'}
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {filteredAppointments.length}
              </span>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Afficher tout
                </button>
              )}
            </div>

            {/* Secondary "Planifier" / "Demander" button in panel */}
            {!isViewer && canAdd && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Planifier
              </button>
            )}
            {isViewer && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Demander
              </button>
            )}
          </div>

          {/* List Content */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <CalendarPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">
                Aucun rendez-vous {selectedDay ? 'ce jour' : 'planifié'}
              </h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                {selectedDay
                  ? "Il n'y a pas de consultation programmée pour la date sélectionnée."
                  : isViewer
                    ? 'Cliquez sur « Demander un RDV » pour soumettre une demande.'
                    : 'Cliquez sur « Planifier un RDV » pour ajouter un nouveau rendez-vous.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => {
                // Safe destructuring — guard against missing join
                const comp = apt.compagnons || {};
                const firstName = comp?.first_name ?? '';
                const lastName = comp?.last_name ?? '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Compagnon non spécifié';
                const avatarUrl = comp?.avatar_url ?? null;
                const style = getStatusStyle(apt.status);

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                          {getInitials(firstName, lastName)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900 truncate">{fullName}</h3>
                          {apt.is_urgent && (
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">
                          {apt.specialty || 'Consultation'}
                          {apt.doctor_name ? ` — ${apt.doctor_name}` : ''}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{apt.location || 'Lieu non spécifié'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status, Date & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        {apt.status || 'Confirmé'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDateTime(apt.appointment_date)}</span>
                      </div>
                      {/* Actions — only for Admin/Editor */}
                      {!isViewer && (
                        <div className="flex items-center gap-1 mt-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(apt)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(apt.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      ) : (
        /* ───── Demandes de rendez-vous ───── */
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">Aucune demande en attente</h3>
              <p className="text-sm text-gray-400 mt-1">Toutes les demandes de rendez-vous ont été traitées.</p>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const comp = req.compagnon || {};
              const fullName = `${comp.first_name || ''} ${comp.last_name || ''}`.trim() || 'Compagnon inconnu';
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {comp.avatar_url ? (
                      <img
                        src={comp.avatar_url}
                        alt={fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                        {getInitials(comp.first_name, comp.last_name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{fullName}</h3>
                      <p className="text-sm text-gray-700 mt-1 italic break-words line-clamp-3">"{req.message}"</p>
                      <p className="text-xs text-gray-400 mt-1.5">Reçue le {new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  {!isViewer && canAdd && (
                    <button
                      onClick={() => openPlanifyRequest(req)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-bold transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Planifier
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───── Create / Edit Modal ───── */}
      {modalOpen && (
        <AppointmentModal
          appointment={editingAppointment}
          companions={companions}
          defaultCompanionId={defaultCompanionId}
          onSuccess={async () => {
            setModalOpen(false);
            if (handlingRequestId) {
              await markAppointmentRequestHandled(handlingRequestId);
              setHandlingRequestId(null);
            }
            loadData();
          }}
          onClose={() => {
            setModalOpen(false);
            setHandlingRequestId(null);
          }}
        />
      )}
    </div>
  );
}

export default AppointmentsList;
