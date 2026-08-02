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
import { getCompanionById } from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';
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
  { id: 4, date: '22 juil. 2026', text: "Document d'identité ajouté", icon: 'file', color: 'amber' },
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
 * Features a unified Dark Blue gradient header banner with built-in stats metrics,
 * conditional RBAC action buttons, and a 5-card pixel-perfect grid in a light gray background.
 */
function CompanionProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canAdd, canEdit } = useAuth();

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ═══════════════════════════════════════════════════════
          UNIFIED DARK-BLUE HEADER BANNER & STATS METRICS
          ═══════════════════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1a2f5a 100%)' }}
      >
        {/* Subtle radial background glow effects */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)',
          }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 70%)',
          }}
        />

        {/* Back navigation button */}
        <button
          type="button"
          onClick={() => navigate('/compagnons')}
          className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all mb-6 border border-white/10 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux compagnons
        </button>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-white/10">
          {/* Left — Avatar + Info */}
          <div className="flex items-center gap-5">
            {c.avatar_url ? (
              <img
                src={c.avatar_url}
                alt={fullName}
                className="w-20 h-20 rounded-2xl object-cover shadow-xl shrink-0 border-2 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shrink-0 border border-white/20">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{fullName}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {statusLabel}
                </span>
              </div>
              {/* Meta information tags */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-blue-100">
                {c.profession && (
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    {c.profession}
                  </span>
                )}
                {age && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    {age} ans
                  </span>
                )}
                {c.gender && (
                  <span className="flex items-center gap-1.5">
                    {c.gender}
                  </span>
                )}
                {c.join_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Depuis {formatDate(c.join_date)}
                  </span>
                )}
                {(c.address || c.postal_code || c.city) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {[c.address, c.postal_code, c.city].filter(Boolean).join(', ')}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-blue-400" />
                    {c.phone}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-400" />
                    {c.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — Action buttons with RBAC conditional display */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMsgModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md transition-all border border-white/15"
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
              Message
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md transition-all border border-white/15"
              >
                <Edit3 className="w-4 h-4 text-blue-300" />
                Modifier
              </button>
            )}
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowAppointmentModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all scale-[1.02]"
              >
                <CalendarPlus className="w-4.5 h-4.5" />
                Nouveau RDV
              </button>
            )}
          </div>
        </div>

        {/* Integrated Stats Metrics Row */}
        <div className="relative z-10 pt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <BookOpen className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white tracking-tight">{MOCK_STATS.formations}%</p>
              <p className="text-xs font-medium text-blue-200">Progression formations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <FileText className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white tracking-tight">{MOCK_STATS.documents}</p>
              <p className="text-xs font-medium text-blue-200">Documents archivés</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white tracking-tight">{MOCK_STATS.realisations}</p>
              <p className="text-xs font-medium text-blue-200">Badges et diplômes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <ShieldCheck className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-base font-bold text-white truncate">
                {referent
                  ? `${referent.first_name || ''} ${referent.last_name || ''}`.trim()
                  : 'Non assigné'}
              </p>
              <p className="text-xs font-medium text-blue-200">Bénévole référent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT GRID — Light gray background & 5 cards
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gray-50/80 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* ───── Card 1: Informations personnelles ───── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Informations personnelles</h3>
            </div>
            <div className="px-6 py-5 space-y-3.5">
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
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700/60 last:border-0">
                  <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ───── Card 2: Résumé médical ───── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Résumé médical</h3>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Blood type */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Groupe sanguin</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{med?.blood_type || '—'}</p>
                </div>
              </div>
              {/* Doctor */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Médecin traitant</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{med?.doctor_name || '—'}</p>
                </div>
              </div>
              {/* Allergies */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Allergies</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{med?.allergies || 'Aucune connue'}</p>
                </div>
              </div>
              {/* Pathologies */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pathologies</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{med?.pathologies || 'Aucune connue'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ───── Card 3: Progression formation ───── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Progression formation</h3>
            </div>
            <div className="px-6 py-6">
              {/* Main progress metric */}
              <div className="text-center mb-6">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">{MOCK_STATS.formations}%</p>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Progression globale</p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden mb-6">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                  style={{ width: `${MOCK_STATS.formations}%` }}
                />
              </div>
              {/* Breakdown */}
              <div className="space-y-4">
                {[
                  { label: 'Premiers secours', pct: 100, color: 'bg-emerald-500' },
                  { label: 'Hygiène alimentaire', pct: 75, color: 'bg-blue-500' },
                  { label: 'Droits sociaux', pct: 30, color: 'bg-amber-500' },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{f.label}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{f.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
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

          {/* ───── Card 4: Prochains rendez-vous ───── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Prochains rendez-vous</h3>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                {MOCK_APPOINTMENTS.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {MOCK_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  {/* Date block badge */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{formatShortDate(apt.date).split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase">{formatShortDate(apt.date).split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{apt.type}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{apt.doctor} · {apt.time}</p>
                  </div>
                  {/* Status tag */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    apt.status === 'confirmé'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {apt.status === 'confirmé' ? 'Confirmé' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ───── Card 5: Activité récente (Timeline) ───── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden xl:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
              <Clock className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Activité récente</h3>
            </div>
            <div className="px-6 py-6">
              <div className="relative">
                {/* Vertical timeline connector */}
                <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-slate-700" />

                <div className="space-y-6">
                  {MOCK_TIMELINE.map((event) => {
                    const iconMap = {
                      check: CheckCircle2,
                      calendar: Calendar,
                      book: BookOpen,
                      file: FileText,
                    };
                    const colorMap = {
                      emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
                      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
                      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
                      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
                    };
                    const Icon = iconMap[event.icon] || Circle;
                    const colorClass = colorMap[event.color] || 'bg-gray-100 text-gray-600';

                    return (
                      <div key={event.id} className="flex items-start gap-4 relative">
                        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shrink-0 z-10 shadow-sm border border-white dark:border-slate-800`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{event.text}</p>
                          <p className="text-xs font-medium text-gray-400 dark:text-slate-400 mt-0.5">{event.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
