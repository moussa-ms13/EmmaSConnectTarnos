import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, MessageSquare, CalendarPlus, MapPin, Phone, Mail,
  User, Heart, Droplets, Stethoscope, BookOpen, FileText, Award,
  Calendar, Clock, AlertTriangle, TrendingUp, Activity, Loader2,
  CheckCircle2, Globe, Cpu, Flag, Download, RefreshCw, ChevronRight,
} from 'lucide-react';
import { getCompanionById, updateCompanion } from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';
import AppointmentModal from '../Appointments/AppointmentModal';
import CompanionForm from './CompanionForm';
import SendMessageModal from '../../components/layout/SendMessageModal';

// ────────────────────────────────────────────────────────────
// MOCK DATA — Used for UI-only fields with no DB columns yet
// ────────────────────────────────────────────────────────────
const MOCK_DOCUMENTS = [
  { id: 1, title: "Carte d'identité", expiry: '2028-06-15', status: 'valide',      icon: '🪪' },
  { id: 2, title: 'Titre de séjour',  expiry: '2025-03-20', status: 'a_renouveler',icon: '📋' },
  { id: 3, title: 'Passeport',        expiry: null,          status: 'manquant',    icon: '📕' },
  { id: 4, title: 'Attestation CAF',  expiry: '2027-01-01', status: 'valide',      icon: '📄' },
  { id: 5, title: 'RIB Bancaire',     expiry: null,          status: 'valide',      icon: '🏦' },
  { id: 6, title: 'CV',               expiry: null,          status: 'valide',      icon: '📝' },
];

const MOCK_FORMATIONS = [
  { id: 1, title: 'Formation PSC1',          location: 'Tarnos — 15 janv. 2024', status: 'obtenu',    progress: 100 },
  { id: 2, title: 'Atelier Menuiserie Bois', location: 'Bayonne — 5 mars 2024',  status: 'en_cours',  progress: 65  },
  { id: 3, title: 'Français Langue Étrangère', location: 'Tarnos — 1 sept. 2024', status: 'planifié', progress: 0  },
];

const MOCK_SKILLS = {
  techniques: [
    { name: 'Menuiserie bois',         pct: 70 },
    { name: 'Peinture / rénovation',   pct: 45 },
    { name: 'Jardinage',               pct: 60 },
  ],
  soft: [
    { name: 'Ponctualité',             pct: 90 },
    { name: 'Travail en équipe',       pct: 80 },
    { name: 'Communication',           pct: 65 },
  ],
  languages: [
    { name: 'Français',                pct: 70 },
    { name: 'Arabe',                   pct: 95 },
    { name: 'Anglais',                 pct: 30 },
  ],
  digital: [
    { name: 'Bureautique (Word/Excel)', pct: 50 },
    { name: 'Email / Internet',         pct: 65 },
    { name: 'Smartphone',               pct: 80 },
  ],
};

const MOCK_TIMELINE = [
  { id: 1, label: 'Intégration',       date: '12 janv. 2024', color: 'bg-blue-500' },
  { id: 2, label: 'Début formation',   date: '5 mars 2024',   color: 'bg-amber-500' },
  { id: 3, label: 'Obtention PSC1',    date: '28 mars 2024',  color: 'bg-emerald-500' },
  { id: 4, label: 'Atelier chantier', date: '10 juin 2024',  color: 'bg-purple-500' },
];

const MOCK_APPOINTMENTS = [
  { id: 1, type: 'Médecin généraliste', doctor: 'Dr. Isabelle Leclerc', date: '2026-07-02T10:00', status: 'confirmé'   },
  { id: 2, type: 'Dermatologue',        doctor: 'Dr. Laurent Morin',    date: '2026-07-28T09:30', status: 'a_confirmer' },
];

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'medical',      label: 'Médical'      },
  { key: 'documents',    label: 'Documents'    },
  { key: 'rendezvous',   label: 'Rendez-vous'  },
  { key: 'formations',   label: 'Formations'   },
  { key: 'competences',  label: 'Compétences'  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function toSafeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map((i) => toSafeString(i)).filter(Boolean).join(', ') || fallback;
    return String(val.name || val.label || val.value || val.first_name || val.title || fallback);
  }
  return String(val);
}

function computeAge(dateVal) {
  if (!dateVal) return null;
  const birth = new Date(dateVal);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? null : age;
}

function computeDaysSince(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function formatDate(dateVal) {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : '—';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return typeof dateVal === 'string' ? dateVal : '—'; }
}

function formatDateShort(dateVal) {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : '—';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return typeof dateVal === 'string' ? dateVal : '—'; }
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────
function DocStatusBadge({ status }) {
  const cfg = {
    valide:       { label: 'Valide',        cls: 'bg-emerald-100 text-emerald-700' },
    a_renouveler: { label: 'À renouveler',  cls: 'bg-orange-100  text-orange-700'  },
    manquant:     { label: 'Manquant',      cls: 'bg-red-100     text-red-700'     },
  };
  const { label, cls } = cfg[status] || cfg.valide;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function FormationBadge({ status }) {
  const cfg = {
    obtenu:   { label: 'Obtenu',   cls: 'bg-emerald-100 text-emerald-700' },
    en_cours: { label: 'En cours', cls: 'bg-blue-100    text-blue-700'    },
    planifié: { label: 'Planifié', cls: 'bg-gray-100    text-gray-600'    },
  };
  const { label, cls } = cfg[status] || cfg.planifié;
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

function SkillBar({ name, pct }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
function CompanionProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canAdd, canEdit, isViewer, isCompagnon } = useAuth();

  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) { setError('Identifiant manquant.'); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await getCompanionById(id);
        if (fetchError) setError(fetchError?.message || 'Erreur de chargement.');
        else if (!data) setError('Compagnon introuvable.');
        else { setCompanion(data); setNoteValue(data?.notes || ''); }
      } catch (err) {
        setError(err?.message || 'Erreur inattendue.');
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
        {!isViewer && !isCompagnon && (
          <button
            onClick={() => navigate('/compagnons')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        )}
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────
  const c = companion;
  const firstName     = toSafeString(c.first_name || c.prenom, 'Mohamed');
  const lastName      = toSafeString(c.last_name  || c.nom,    'Diallo');
  const fullName      = `${firstName} ${lastName}`.trim();
  const initials      = `${firstName[0] || 'M'}${lastName[0] || 'D'}`.toUpperCase();
  const profession    = toSafeString(c.profession, 'Atelier Menuiserie');
  const joinDateStr   = formatDate(c.join_date || c.created_at || c.date_inscription);
  const joinDateShort = formatDateShort(c.join_date || c.created_at || c.date_inscription);
  const dobStr        = formatDate(c.date_of_birth || c.date_naissance);
  const nationality   = toSafeString(c.nationality || c.nationalite, 'Non renseignée');
  const gender        = toSafeString(c.gender || c.sexe, '—');
  const phoneStr      = toSafeString(c.phone || c.telephone, '06 12 34 56 78');
  const emailStr      = toSafeString(c.email, 'contact@exemple.fr');
  const cityStr       = toSafeString(c.city || c.ville, 'Tarnos');
  const postalStr     = toSafeString(c.postal_code || c.code_postal, '40220');
  const addressStr    = c.address || c.adresse
    ? `${toSafeString(c.address || c.adresse)}, ${postalStr} ${cityStr}`
    : `—`;

  const daysSinceJoin = computeDaysSince(c.join_date || c.created_at);
  const progressPct   = Math.min(100, Math.max(0, Number(c.stats?.formations || 78)));

  // Formations & docs counts from mock (replace with DB data when available)
  const formationsDone  = MOCK_FORMATIONS.filter((f) => f.status === 'obtenu').length;
  const formationsTotal = MOCK_FORMATIONS.length;
  const documentsDone   = MOCK_DOCUMENTS.filter((d) => d.status === 'valide').length;
  const documentsTotal  = MOCK_DOCUMENTS.length;

  // Medical
  const med          = c.medical_record || c.medical_info || c.medical || {};
  const bloodType    = toSafeString(med.blood_type || med.groupe_sanguin, 'A+');
  const doctorName   = toSafeString(med.doctor_name || med.medecin_traitant, 'Dr. Isabelle Leclerc');
  const allergies    = toSafeString(med.allergies, 'Pénicilline');
  const rawPaths     = med.pathologiesList || med.pathologies;
  const pathologies  = Array.isArray(rawPaths) && rawPaths.length
    ? rawPaths.map((p) => toSafeString(p)).filter(Boolean)
    : typeof rawPaths === 'string' && rawPaths.trim()
    ? rawPaths.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Hypertension artérielle', 'Diabète type 2'];

  // Referent
  const ref         = c.referent || c.benevole_referent || {};
  const referentName = typeof ref === 'object' && ref !== null
    ? (`${toSafeString(ref.first_name)} ${toSafeString(ref.last_name)}`.trim()) || toSafeString(ref.name, 'Sophie Renaud')
    : toSafeString(ref, 'Sophie Renaud');

  // Appointments
  const aptsList = Array.isArray(c.appointments) && c.appointments.length
    ? c.appointments : MOCK_APPOINTMENTS;

  return (
    <div className="min-h-screen bg-gray-50 -m-8">
      {/* ═══════════════════════════════════════
          HEADER CARD — Dark Blue Gradient
      ═══════════════════════════════════════ */}
      <div
        className="w-full text-white"
        style={{ background: 'linear-gradient(135deg, #0f2246 0%, #1e3a6e 60%, #1a3460 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5 text-blue-300 text-sm">
            {!isViewer && !isCompagnon && (
              <button
                type="button"
                onClick={() => navigate('/compagnons')}
                className="hover:text-white transition-colors flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Compagnons
              </button>
            )}
            {!isViewer && !isCompagnon && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
            <span className="text-white font-semibold">{fullName}</span>
          </div>

          {/* Main header row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* LEFT — Avatar + Identity */}
            <div className="flex items-start gap-5 flex-1">
              {/* Avatar */}
              <div className="relative shrink-0">
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt={fullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg backdrop-blur-sm">
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-500 border-2 border-[#0f2246] rounded-full" />
              </div>

              <div className="space-y-2 flex-1">
                {/* Name + badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">{fullName}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Actif
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-sm text-blue-200 font-normal">
                  {profession} &bull; Entré le {joinDateShort}
                </p>

                {/* Contact row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-blue-200 pt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />{cityStr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-300 shrink-0" />{phoneStr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-300 shrink-0" />{emailStr}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-3 max-w-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-blue-200 font-medium">Progression globale</span>
                    <span className="text-xs font-bold text-white">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Action buttons */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:pt-2">
              <button
                type="button"
                onClick={() => setShowMsgModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/40"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Planifier
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier
                </button>
              )}
            </div>
          </div>

          {/* Metrics bar */}
          <div className="mt-6 grid grid-cols-3 gap-0 border-t border-white/10 pt-5 pb-0 divide-x divide-white/10">
            <div className="flex items-center gap-3 pr-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-blue-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">{formationsDone}/{formationsTotal}</p>
                <p className="text-[11px] text-blue-300">Formations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-blue-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">{documentsDone}/{documentsTotal}</p>
                <p className="text-[11px] text-blue-300">Documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5 text-blue-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">{daysSinceJoin ?? '—'}</p>
                <p className="text-[11px] text-blue-300">Jours</p>
              </div>
            </div>
          </div>

          {/* ───── Tab Navigation ───── */}
          <nav className="flex gap-0 mt-5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-white border-blue-400'
                    : 'text-blue-300 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          TAB CONTENT AREA
      ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-7">

        {/* ─── TAB: Informations ─── */}
        {activeTab === 'informations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left col */}
            <div className="lg:col-span-2 space-y-6">

              {/* Informations personnelles */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <User className="w-4.5 h-4.5 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Informations personnelles</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: 'Prénom',          value: firstName },
                    { label: 'Nom',             value: lastName  },
                    { label: 'Date de naissance', value: dobStr },
                    { label: 'Nationalité',     value: nationality },
                    { label: 'Téléphone',       value: phoneStr  },
                    { label: 'E-mail',          value: emailStr  },
                    { label: 'Adresse',         value: addressStr, full: true },
                  ].map(({ label, value, full }) => (
                    <div key={label} className={`flex justify-between text-sm gap-4 ${full ? 'sm:col-span-2' : ''}`}>
                      <span className="text-gray-400 shrink-0">{label}</span>
                      <span className="font-semibold text-gray-900 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historique */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <Clock className="w-4.5 h-4.5 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-900">Historique</h3>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-5">
                    {MOCK_TIMELINE.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-3 relative">
                        <span className={`absolute -left-3.5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${ev.color} shrink-0`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ev.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ev.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-6">
              {/* Responsable */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <User className="w-4.5 h-4.5 text-purple-500" />
                  <h3 className="text-sm font-bold text-gray-900">Responsable</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700 shrink-0">
                    {referentName.split(' ').map((n) => n[0] || '').join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{referentName}</p>
                    <p className="text-xs text-gray-400">Bénévole référent</p>
                  </div>
                </div>
              </div>

              {/* Note interne */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <FileText className="w-4.5 h-4.5 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-900">Note interne</h3>
                </div>
                {canEdit ? (
                  <textarea
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    rows={5}
                    placeholder="Ajouter une note sur ce compagnon..."
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder-gray-300"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">{noteValue || 'Aucune note.'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Médical ─── */}
        {activeTab === 'medical' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <Heart className="w-4.5 h-4.5 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">Résumé médical</h3>
              </div>
              {/* Blood type */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50/70 border border-red-100">
                <Droplets className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Groupe sanguin</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{bloodType}</p>
                </div>
              </div>
              {/* Doctor */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                <Stethoscope className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Médecin traitant</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{doctorName}</p>
                </div>
              </div>
              {/* Allergies */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Allergies</p>
                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{allergies}</span>
              </div>
              {/* Pathologies */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Pathologies</p>
                <ul className="space-y-2">
                  {pathologies.map((p, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Documents ─── */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Documents ({MOCK_DOCUMENTS.length})</h3>
              {canAdd && (
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  + Ajouter un document
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative flex flex-col gap-3">
                  {/* Status badge top-right */}
                  <div className="absolute top-4 right-4">
                    <DocStatusBadge status={doc.status} />
                  </div>
                  {/* Icon + title */}
                  <div className="flex items-start gap-3 pr-20">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.expiry ? `Expire le ${formatDateShort(doc.expiry)}` : 'Pas de date d\'expiration'}
                      </p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                      <Download className="w-3.5 h-3.5" />Télécharger
                    </button>
                    {canEdit && (
                      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-amber-600 transition-colors ml-auto">
                        <RefreshCw className="w-3.5 h-3.5" />Mettre à jour
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: Rendez-vous ─── */}
        {activeTab === 'rendezvous' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Rendez-vous</h3>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Planifier un RDV
                </button>
              )}
            </div>
            {aptsList.map((apt, idx) => (
              <div key={apt.id || idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    apt.status === 'confirmé' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apt.status === 'confirmé' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    {apt.status === 'confirmé' ? 'Confirmé' : 'À confirmer'}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateShort(apt.date)}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{toSafeString(apt.type, 'Rendez-vous')}</p>
                <p className="text-xs text-gray-500">{toSafeString(apt.doctor || apt.specialty, '—')}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: Formations ─── */}
        {activeTab === 'formations' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Formations ({MOCK_FORMATIONS.length})</h3>
            </div>
            {MOCK_FORMATIONS.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{f.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.location}</p>
                  </div>
                  <FormationBadge status={f.status} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Avancement</span>
                    <span className="text-xs font-bold text-gray-700">{f.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        f.status === 'obtenu' ? 'bg-emerald-500' : f.status === 'en_cours' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: Compétences ─── */}
        {activeTab === 'competences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Savoir-faire techniques */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Savoir-faire techniques</h3>
              </div>
              <div className="space-y-4">
                {MOCK_SKILLS.techniques.map((s) => <SkillBar key={s.name} {...s} />)}
              </div>
            </div>

            {/* Savoir-être */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                <h3 className="text-sm font-bold text-gray-900">Savoir-être</h3>
              </div>
              <div className="space-y-4">
                {MOCK_SKILLS.soft.map((s) => <SkillBar key={s.name} {...s} />)}
              </div>
            </div>

            {/* Langues */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Globe className="w-4.5 h-4.5 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900">Langues</h3>
              </div>
              <div className="space-y-4">
                {MOCK_SKILLS.languages.map((s) => <SkillBar key={s.name} {...s} />)}
              </div>
            </div>

            {/* Numérique */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <Cpu className="w-4.5 h-4.5 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-900">Numérique</h3>
              </div>
              <div className="space-y-4">
                {MOCK_SKILLS.digital.map((s) => <SkillBar key={s.name} {...s} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {showAppointmentModal && c && (
        <AppointmentModal
          appointment={null}
          companions={[c]}
          defaultCompanionId={c.id}
          onSuccess={() => setShowAppointmentModal(false)}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}

      {showEditModal && c && (
        <CompanionForm
          companion={companion}
          initialData={companion}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (formData) => {
            const { data, error: updateError } = await updateCompanion(companion.id, formData);
            if (updateError) throw new Error(updateError.message);
            if (data) setCompanion(data);
            setShowEditModal(false);
          }}
          onSuccess={(updated) => {
            if (updated) setCompanion(updated);
            setShowEditModal(false);
          }}
        />
      )}

      <SendMessageModal
        isOpen={showMsgModal}
        onClose={() => setShowMsgModal(false)}
        defaultReceiverName={`${toSafeString(companion?.first_name)} ${toSafeString(companion?.last_name)}`.trim() || 'Compagnon'}
        defaultReceiverId={companion?.id}
      />
    </div>
  );
}

export default CompanionProfile;
