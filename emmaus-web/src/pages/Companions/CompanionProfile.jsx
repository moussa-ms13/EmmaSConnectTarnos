import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  CalendarPlus,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  Droplets,
  Stethoscope,
  AlertCircle,
  Activity,
  BookOpen,
  FileText,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Users,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { getCompanionById, updateCompanion } from '../../services/companionService';
import AppointmentModal from '../Appointments/AppointmentModal';
import CompanionForm from './CompanionForm';
import SendMessageModal from '../../components/layout/SendMessageModal';

// ────────────────────────────────────────────────────────────
// Mock data for sections not yet backed by the database
// ────────────────────────────────────────────────────────────
const MOCK_APPOINTMENTS = [
  { id: 1, date: '2026-08-05', time: '10:00', type: 'Médecin généraliste', doctor: 'Dr. Martin', status: 'confirmé' },
  { id: 2, date: '2026-08-12', time: '14:30', type: 'Dentiste', doctor: 'Dr. Lefèvre', status: 'en_attente' },
  { id: 3, date: '2026-08-20', time: '09:00', type: 'Psychologue', doctor: 'Mme Dubois', status: 'confirmé' },
];

const MOCK_TIMELINE = [
  { id: 1, date: '28 juil. 2026', text: 'Inscription sur la plateforme', icon: 'check', color: 'emerald' },
  { id: 2, date: '27 juil. 2026', text: 'Rendez-vous médical confirmé', icon: 'calendar', color: 'blue' },
  { id: 3, date: '25 juil. 2026', text: 'Formation « Premiers secours » terminée', icon: 'book', color: 'purple' },
  { id: 4, date: '22 juil. 2026', text: 'Document d\'identité ajouté', icon: 'file', color: 'amber' },
];

const MOCK_STATS = {
  formations: 55,
  documents: 8,
  realisations: 3,
};

/**
 * Helper: compute age from date string.
 */
function computeAge(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Helper: format date to French locale.
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
 * Helper: format short date.
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * CompanionProfile — Detailed profile dashboard for a single companion.
 */
function CompanionProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await getCompanionById(id);
      if (fetchError) {
        setError(fetchError.message);
      } else if (!data) {
        setError('Compagnon introuvable.');
      } else {
        setCompanion(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // ───── Loading state ─────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // ───── Error state ─────
  if (error || !companion) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Erreur</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Compagnon introuvable.'}</p>
        <button
          onClick={() => navigate('/compagnons')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  const c = companion;
  const age = computeAge(c.date_of_birth);
  const initials = `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`;
  const fullName = `${c.first_name} ${c.last_name}`;
  const med = c.medical_record;
  const referent = c.referent;
  const statusLabel = c.status === 'actif' ? 'Actif' : c.status === 'inactif' ? 'Inactif' : c.status || 'Actif';

  return (
    <div className="space-y-6 -m-8 min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          TOP BANNER
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/compagnons')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux compagnons
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left — Avatar + Info */}
          <div className="flex items-center gap-5">
            {/* Initials avatar or Profile Image */}
            {c.avatar_url ? (
              <img
                src={c.avatar_url}
                alt={fullName}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-blue-500/10 shrink-0 border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/25 shrink-0">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                {/* Status badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {statusLabel}
                </span>
              </div>
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {c.profession && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    {c.profession}
                  </span>
                )}
                {age && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {age} ans
                  </span>
                )}
                {c.gender && (
                  <span className="flex items-center gap-1">
                    {c.gender}
                  </span>
                )}
                {c.join_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Depuis {formatDate(c.join_date)}
                  </span>
                )}
                {(c.address || c.postal_code || c.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[c.address, c.postal_code, c.city].filter(Boolean).join(', ')}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {c.phone}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {c.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMsgModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Message
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => setShowAppointmentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              Nouveau RDV
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          STATS ROW — Dark Blue
          ═══════════════════════════════════════════════════════ */}
      <div className="mx-8">
        <div
          className="rounded-2xl px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1a2f5a 100%)' }}
        >
          {/* Formations % */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{MOCK_STATS.formations}%</p>
              <p className="text-xs text-blue-200">Formations</p>
            </div>
          </div>
          {/* Documents */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{MOCK_STATS.documents}</p>
              <p className="text-xs text-blue-200">Documents</p>
            </div>
          </div>
          {/* Réalisations */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{MOCK_STATS.realisations}</p>
              <p className="text-xs text-blue-200">Réalisations</p>
            </div>
          </div>
          {/* Bénévole référent */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {referent
                  ? `${referent.first_name || ''} ${referent.last_name || ''}`.trim()
                  : 'Non assigné'}
              </p>
              <p className="text-xs text-blue-200">Bénévole référent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          GRID LAYOUT — Detail Cards
          ═══════════════════════════════════════════════════════ */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* ───── Card: Informations personnelles ───── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Informations personnelles</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { label: 'Genre', value: c.gender || '—' },
              { label: 'Âge', value: age ? `${age} ans` : '—' },
              { label: 'Profession', value: c.profession || '—' },
              { label: 'Adresse', value: c.address || '—' },
              { label: 'Code postal', value: c.postal_code || '—' },
              { label: 'Ville', value: c.city || '—' },
              { label: 'Téléphone', value: c.phone || '—' },
              { label: 'E-mail', value: c.email || '—' },
              { label: 'Inscription', value: formatDate(c.join_date || c.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── Card: Résumé médical ───── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Heart className="w-4.5 h-4.5 text-red-500" />
            <h3 className="text-sm font-bold text-gray-900">Résumé médical</h3>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Blood type */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <Droplets className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Groupe sanguin</p>
                <p className="text-sm font-semibold text-gray-900">{med?.blood_type || '—'}</p>
              </div>
            </div>
            {/* Doctor */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Stethoscope className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Médecin traitant</p>
                <p className="text-sm font-semibold text-gray-900">{med?.doctor_name || '—'}</p>
              </div>
            </div>
            {/* Allergies */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Allergies</p>
                <p className="text-sm font-medium text-gray-900">{med?.allergies || 'Aucune connue'}</p>
              </div>
            </div>
            {/* Pathologies */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4.5 h-4.5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pathologies</p>
                <p className="text-sm font-medium text-gray-900">{med?.pathologies || 'Aucune connue'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Card: Prochains rendez-vous (MOCK) ───── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Prochains rendez-vous</h3>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {MOCK_APPOINTMENTS.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_APPOINTMENTS.map((apt) => (
              <div key={apt.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                {/* Date block */}
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-700">{formatShortDate(apt.date).split(' ')[0]}</span>
                  <span className="text-[10px] font-semibold text-blue-500 uppercase">{formatShortDate(apt.date).split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{apt.type}</p>
                  <p className="text-xs text-gray-500">{apt.doctor} · {apt.time}</p>
                </div>
                {/* Status */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  apt.status === 'confirmé'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {apt.status === 'confirmé' ? 'Confirmé' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── Card: Progression formation (MOCK) ───── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">Progression formation</h3>
          </div>
          <div className="px-5 py-5">
            {/* Main progress */}
            <div className="text-center mb-5">
              <p className="text-4xl font-bold text-gray-900 mb-1">{MOCK_STATS.formations}%</p>
              <p className="text-sm text-gray-500">Progression globale</p>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${MOCK_STATS.formations}%` }}
              />
            </div>
            {/* Breakdown */}
            <div className="space-y-3">
              {[
                { label: 'Premiers secours', pct: 100, color: 'bg-emerald-500' },
                { label: 'Hygiène alimentaire', pct: 75, color: 'bg-blue-500' },
                { label: 'Droits sociaux', pct: 30, color: 'bg-amber-500' },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                    <span className="text-xs font-bold text-gray-500">{f.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.color} transition-all duration-500`}
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───── Card: Activité récente (MOCK Timeline) ───── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-gray-600" />
            <h3 className="text-sm font-bold text-gray-900">Activité récente</h3>
          </div>
          <div className="px-5 py-4">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

              <div className="space-y-5">
                {MOCK_TIMELINE.map((event) => {
                  const iconMap = {
                    check: CheckCircle2,
                    calendar: Calendar,
                    book: BookOpen,
                    file: FileText,
                  };
                  const colorMap = {
                    emerald: 'bg-emerald-100 text-emerald-600',
                    blue: 'bg-blue-100 text-blue-600',
                    purple: 'bg-purple-100 text-purple-600',
                    amber: 'bg-amber-100 text-amber-600',
                  };
                  const Icon = iconMap[event.icon] || Circle;
                  const colorClass = colorMap[event.color] || 'bg-gray-100 text-gray-600';

                  return (
                    <div key={event.id} className="flex items-start gap-4 relative">
                      <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shrink-0 z-10`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-gray-900">{event.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Create Appointment Modal ───── */}
      {showAppointmentModal && c && (
        <AppointmentModal
          appointment={null}
          companions={[c]}
          defaultCompanionId={c.id}
          onSuccess={() => {
            setShowAppointmentModal(false);
          }}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}

      {/* ───── Edit Companion Modal ───── */}
      {showEditModal && c && (
        <CompanionForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={companion}
          onSuccess={(updated) => {
            if (updated) setCompanion(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {/* ───── Send Message Modal ───── */}
      <SendMessageModal
        isOpen={showMsgModal}
        onClose={() => setShowMsgModal(false)}
        defaultReceiverName={`${companion?.first_name || ''} ${companion?.last_name || ''}`.trim()}
        defaultReceiverId={companion?.id}
      />
    </div>
  );
}

export default CompanionProfile;
