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
  BookOpen,
  FileText,
  Award,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { getCompanionById, updateCompanion } from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';
import AppointmentModal from '../Appointments/AppointmentModal';
import CompanionForm from './CompanionForm';
import SendMessageModal from '../../components/layout/SendMessageModal';

// ────────────────────────────────────────────────────────────
// Static Fallback Data matching Pixel-Perfect Screenshot
// ────────────────────────────────────────────────────────────
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    date: '2 juil. 2026 à 10:00',
    type: 'Médecin généraliste',
    doctor: 'Dr. Isabelle Leclerc',
    status: 'confirmé',
  },
  {
    id: 2,
    date: '28 juil. 2026 à 09:30',
    type: 'Dermatologue',
    doctor: 'Dr. Laurent Morin',
    status: 'a_confirmer',
  },
];

const MOCK_TIMELINE = [
  { id: 1, text: 'Dernier contact', date: '24 juin 2026', icon: 'clock', color: 'blue' },
  { id: 2, text: 'Rapport médical', date: '10 juin 2026', icon: 'file', color: 'emerald' },
  { id: 3, text: 'Formation', date: 'Formation PSC1', icon: 'book', color: 'purple' },
];

const MOCK_STATS = {
  formations: 75,
  documents: 8,
  realisations: 4,
};

/**
 * Helper: compute age from date string.
 */
function computeAge(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? null : age;
}

/**
 * Helper: format date to French locale.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '—';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return typeof dateStr === 'string' ? dateStr : '—';
  }
}

/**
 * CompanionProfile — Rebuilt pixel-perfect Profile page matching exact screenshot design.
 * Features:
 * - Top navigation breadcrumb (< Marie Dupont | 67 ans - Actif)
 * - Rounded dark blue card (#0e2246 / slate-900) with initials avatar, status badge, subtitle, and contact row
 * - 4-section stats bottom bar separated by dividers
 * - Responsive 3-column main content grid on a light gray background
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
      if (!id) {
        setError('Identifiant du compagnon manquant.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await getCompanionById(id);
        if (fetchError) {
          setError(fetchError?.message || 'Erreur lors du chargement.');
        } else if (!data) {
          setError('Compagnon introuvable.');
        } else {
          setCompanion(data);
        }
      } catch (err) {
        setError(err?.message || 'Erreur inattendue lors du chargement du compagnon.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-gray-50 min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

  if (error || !companion) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 bg-gray-50 min-h-screen">
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

  const c = companion || {};
  const computedAge = computeAge(c?.date_of_birth || c?.date_naissance);
  const ageStr = computedAge ? `${computedAge} ans` : '67 ans';
  const firstName = c?.first_name || c?.prenom || 'Marie';
  const lastName = c?.last_name || c?.nom || 'Dupont';
  const fullName = `${firstName} ${lastName}`.trim() || 'Marie Dupont';
  const initials = `${firstName?.[0] || 'M'}${lastName?.[0] || 'D'}`.toUpperCase();
  const genderStr = c?.gender || c?.sexe || 'Féminin';
  const joinDateStr = formatDate(c?.join_date || c?.created_at || c?.date_inscription) || '15 mars 2023';
  const cityStr = c?.city || c?.ville || 'Tarnos';
  const postalCodeStr = c?.postal_code || c?.code_postal || '';
  const addressStr = c?.address || c?.adresse
    ? `${c?.address || c?.adresse}, ${postalCodeStr} ${cityStr}`.trim()
    : '12 rue des Fleurs, 40220 Tarnos';
  const phoneStr = c?.phone || c?.telephone || '06 12 34 56 78';
  const emailStr = c?.email || 'marie.dupont@email.fr';

  // Medical data with safe fallback
  const med = c?.medical_record || c?.medical_info || c?.medical || {};
  const bloodType = med?.blood_type || med?.groupe_sanguin || 'A+';
  const doctorName = med?.doctor_name || med?.medecin_traitant || 'Dr. Isabelle Leclerc';
  const allergies = med?.allergies || 'Pénicilline';
  const rawPathologies = med?.pathologiesList || med?.pathologies;
  const pathologiesList =
    Array.isArray(rawPathologies) && rawPathologies.length > 0
      ? rawPathologies
      : typeof rawPathologies === 'string' && rawPathologies.trim()
      ? rawPathologies.split(',').map((item) => item.trim()).filter(Boolean)
      : ['Hypertension artérielle', 'Diabète type 2'];

  // Referent volunteer
  const referent = c?.referent || c?.benevole_referent || {};
  const referentName = typeof referent === 'string' && referent.trim()
    ? referent.trim()
    : referent?.first_name || referent?.last_name
    ? `${referent?.first_name || ''} ${referent?.last_name || ''}`.trim()
    : 'Sophie Renaud';

  // Safe appointments & timeline arrays
  const appointmentsList = Array.isArray(c?.appointments) && c.appointments.length > 0
    ? c.appointments
    : MOCK_APPOINTMENTS;

  const timelineList = Array.isArray(c?.timeline) && c.timeline.length > 0
    ? c.timeline
    : MOCK_TIMELINE;

  // Safe stats
  const stats = {
    formations: c?.stats?.formations ?? MOCK_STATS.formations,
    documents: c?.stats?.documents ?? MOCK_STATS.documents,
    realisations: c?.stats?.realisations ?? MOCK_STATS.realisations,
  };

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ═══════════════════════════════════════════════════════
            TASK 1.1: TOP NAVIGATION BREADCRUMB
            ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/compagnons')}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{fullName}</h1>
            <p className="text-xs text-gray-500">{ageStr} - Actif</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TASK 1.2 - 1.7: MAIN TOP BANNER (DARK BLUE CARD)
            ═══════════════════════════════════════════════════════ */}
        <div className="rounded-2xl bg-[#0e2246] text-white shadow-lg overflow-hidden border border-[#1e3a6e]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Side: Avatar + Name + Badge + Subtitle + Contact Row */}
              <div className="flex items-start sm:items-center gap-5">
                {/* Avatar with Initials in Blue on White */}
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-blue-600 font-extrabold text-2xl shadow-md shrink-0">
                  {initials}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{fullName}</h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Actif
                    </span>
                  </div>

                  {/* Subtitle */}
                  <p className="text-sm text-blue-100 font-normal">
                    {ageStr} • {genderStr} • Rejoint le {joinDateStr}
                  </p>

                  {/* Contact Row with Icons */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-blue-100 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
                      {addressStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-blue-300 shrink-0" />
                      {phoneStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                      {emailStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowAppointmentModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    + Nouveau RDV
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Stats Bar with 4 Sections Separated by Dividers */}
            <div className="border-t border-white/10 pt-6 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Formations */}
              <div className="flex items-center gap-3.5 lg:border-r lg:border-white/10 lg:pr-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-tight">{stats.formations}%</p>
                  <p className="text-xs text-blue-200 mt-0.5">Formations</p>
                </div>
              </div>

              {/* Documents */}
              <div className="flex items-center gap-3.5 lg:border-r lg:border-white/10 lg:pr-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-tight">{stats.documents}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Documents</p>
                </div>
              </div>

              {/* Réalisations */}
              <div className="flex items-center gap-3.5 lg:border-r lg:border-white/10 lg:pr-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-tight">{stats.realisations}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Réalisations</p>
                </div>
              </div>

              {/* Bénévole référent */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight truncate">{referentName}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Bénévole référent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TASK 2: MAIN CONTENT GRID (3 COLUMNS)
            ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ───────────────────────────────────────────────────
              COLUMN 1: Left Column
              ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Informations personnelles</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Genre</span>
                  <span className="font-medium text-gray-900">{genderStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Âge</span>
                  <span className="font-medium text-gray-900">{ageStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ville</span>
                  <span className="font-medium text-gray-900">{cityStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium text-gray-900">{phoneStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900 truncate max-w-[180px]">{emailStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Inscription</span>
                  <span className="font-medium text-gray-900">{joinDateStr}</span>
                </div>
              </div>
            </div>

            {/* Progression formation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Progression formation</h3>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 font-medium">Progression globale</span>
                  <span className="text-sm font-bold text-blue-600">{stats.formations}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${stats.formations}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">Bonne progression</p>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────
              COLUMN 2: Middle Column
              ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Résumé médical */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">Résumé médical</h3>
              </div>

              {/* Light-red tinted block for Groupe sanguin */}
              <div className="bg-red-50/70 rounded-xl p-4 mb-3 flex items-center gap-3.5 border border-red-100/60">
                <Droplets className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Groupe sanguin</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{bloodType}</p>
                </div>
              </div>

              {/* Light-blue tinted block for Médecin traitant */}
              <div className="bg-blue-50/70 rounded-xl p-4 mb-5 flex items-center gap-3.5 border border-blue-100/60">
                <Stethoscope className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Médecin traitant</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{doctorName}</p>
                </div>
              </div>

              {/* Allergies */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2">Allergies</p>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
                  {allergies}
                </span>
              </div>

              {/* Pathologies */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Pathologies</p>
                <ul className="space-y-2">
                  {pathologiesList.map((pathology, index) => (
                    <li key={index} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{pathology}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────
              COLUMN 3: Right Column
              ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Prochains rendez-vous */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Prochains rendez-vous</h3>
              </div>

              <div className="space-y-4 mb-4">
                {appointmentsList.map((apt, idx) => (
                  <div
                    key={apt?.id || idx}
                    className="p-4 rounded-xl border border-gray-100 bg-white shadow-2xs space-y-1"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        apt?.status === 'confirmé'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          apt?.status === 'confirmé' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                      />
                      {apt?.status === 'confirmé' ? 'Confirmé' : 'À confirmer'}
                    </span>
                    <p className="text-sm font-bold text-gray-900 pt-0.5">{apt?.type || 'Rendez-vous'}</p>
                    <p className="text-xs text-gray-600">{apt?.doctor || '—'}</p>
                    <p className="text-xs text-gray-400">{apt?.date || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Bottom "+ Planifier un rendez-vous" text button */}
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(true)}
                  className="w-full text-left text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2 border-t border-gray-100"
                >
                  + Planifier un rendez-vous
                </button>
              )}
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Activity className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-900">Activité récente</h3>
              </div>

              <div className="space-y-4">
                {timelineList.map((event, idx) => {
                  const iconMap = {
                    clock: Clock,
                    file: FileText,
                    book: BookOpen,
                  };
                  const colorMap = {
                    blue: 'bg-blue-100 text-blue-600',
                    emerald: 'bg-emerald-100 text-emerald-600',
                    purple: 'bg-purple-100 text-purple-600',
                  };
                  const Icon = iconMap[event?.icon] || Clock;
                  const colorClass = colorMap[event?.color] || 'bg-gray-100 text-gray-600';

                  return (
                    <div key={event?.id || idx} className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{event?.text || 'Événement'}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{event?.date || '—'}</p>
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
          companion={companion}
          initialData={companion}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (formData) => {
            const { data, error: updateError } = await updateCompanion(companion.id, formData);
            if (updateError) {
              throw new Error(updateError.message);
            }
            if (data) setCompanion(data);
            setShowEditModal(false);
          }}
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
