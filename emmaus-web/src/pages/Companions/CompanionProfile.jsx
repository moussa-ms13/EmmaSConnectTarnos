import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, MessageSquare, CalendarPlus, MapPin, Phone, Mail,
  User, Heart, Droplets, Stethoscope, BookOpen, FileText, Award,
  Calendar, Clock, AlertTriangle, Activity, Loader2,
  CheckCircle2, Globe, Cpu, Flag, Download, RefreshCw, ChevronRight,
  Plus, X, Trash2, Upload,
} from 'lucide-react';
import {
  getCompanionById, updateCompanion,
  fetchDocuments, addDocument, deleteDocument,
  fetchCompanionAppointments,
  fetchFormations, addFormation, deleteFormation,
  fetchSkills, addSkill, deleteSkill,
} from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';
import AppointmentModal from '../Appointments/AppointmentModal';
import CompanionForm from './CompanionForm';
import SendMessageModal from '../../components/layout/SendMessageModal';

// ────────────────────────────────────────────────────────────
// TABS configuration
// ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'medical',      label: 'Médical'      },
  { key: 'documents',    label: 'Documents'    },
  { key: 'rendezvous',   label: 'Rendez-vous'  },
  { key: 'formations',   label: 'Formations'   },
  { key: 'competences',  label: 'Compétences'  },
];

// Minimal timeline — built from companion's real dates
const MOCK_TIMELINE = [
  { id: 1, label: 'Intégration',       date: '—', color: 'bg-blue-500'    },
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
  // Map real DB status values (capital first letter) to display config
  const s = String(status || '').toLowerCase();
  let label = status || 'Valide';
  let cls = 'bg-emerald-100 text-emerald-700';
  if (s.includes('renouveler') || s.includes('renouveler')) {
    label = 'À renouveler'; cls = 'bg-orange-100 text-orange-700';
  } else if (s.includes('expir')) {
    label = 'Expiré'; cls = 'bg-red-100 text-red-700';
  } else if (s === 'valide') {
    label = 'Valide'; cls = 'bg-emerald-100 text-emerald-700';
  }
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

function SkillBar({ name, pct, progress }) {
  const val = pct ?? progress ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${val}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{val}%</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="py-14 flex flex-col items-center text-center text-gray-400">
      <Icon className="w-10 h-10 mb-3 text-gray-200" />
      <p className="text-sm font-medium text-gray-400">{message}</p>
      {action && (
        <p className="text-xs text-gray-300 mt-1">{action}</p>
      )}
    </div>
  );
}

// Reusable modal shell
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

const INPUT_CLS = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';
const LABEL_CLS = 'block text-xs font-semibold text-gray-600 mb-1.5';

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

  // ── Real data state for tabs ──────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [aptsLoading, setAptsLoading] = useState(false);

  const [formations, setFormations] = useState([]);
  const [formationsLoading, setFormationsLoading] = useState(false);

  const [skills, setSkills] = useState({ techniques: [], soft: [], languages: [], digital: [] });
  const [skillsLoading, setSkillsLoading] = useState(false);

  // ── Modal state for each tab ──────────────────────────────
  const [showDocModal, setShowDocModal] = useState(false);
  // Real schema: file_name, file_type ('Identité'|'Médical'|'Administratif'|'Formation'|'Autre'),
  //              status ('Valide'|'À renouveler'|'Expiré'), expiry_date → expiration_date
  const [newDoc, setNewDoc] = useState({ title: '', file_type: 'Administratif', status: 'Valide', expiry_date: '' });
  const [docFile, setDocFile] = useState(null);
  const [docSaving, setDocSaving] = useState(false);

  const [showFormationModal, setShowFormationModal] = useState(false);
  const [newFormation, setNewFormation] = useState({ title: '', location: '', status: 'planifié', progress: 0 });
  const [formationSaving, setFormationSaving] = useState(false);

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ category: 'techniques', name: '', progress: 0 });
  const [skillSaving, setSkillSaving] = useState(false);

  // ── Load companion base data ──────────────────────────────
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

  // ── Lazy-load tab data on tab switch ─────────────────────
  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    const { data } = await fetchDocuments(id);
    setDocuments(data || []);
    setDocsLoading(false);
  }, [id]);

  const loadAppointments = useCallback(async () => {
    setAptsLoading(true);
    const { data } = await fetchCompanionAppointments(id);
    setAppointments(data || []);
    setAptsLoading(false);
  }, [id]);

  const loadFormations = useCallback(async () => {
    setFormationsLoading(true);
    const { data } = await fetchFormations(id);
    setFormations(data || []);
    setFormationsLoading(false);
  }, [id]);

  const loadSkills = useCallback(async () => {
    setSkillsLoading(true);
    const { data } = await fetchSkills(id);
    setSkills(data);
    setSkillsLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'documents')   loadDocuments();
    if (activeTab === 'rendezvous')  loadAppointments();
    if (activeTab === 'formations')  loadFormations();
    if (activeTab === 'competences') loadSkills();
  }, [activeTab, id, loadDocuments, loadAppointments, loadFormations, loadSkills]);

  // ── Handlers: Add Document ────────────────────────────────
  const handleAddDocument = async () => {
    if (!newDoc.title.trim()) return;
    setDocSaving(true);
    // addDocument maps payload.title → file_name, payload.file_type → file_type,
    // payload.status → status, payload.expiry_date → expiration_date
    const { data, error: saveErr } = await addDocument(id, newDoc, docFile);
    setDocSaving(false);
    if (!saveErr && data) {
      setDocuments((prev) => [data, ...prev]);
      setNewDoc({ title: '', file_type: 'Administratif', status: 'Valide', expiry_date: '' });
      setDocFile(null);
      setShowDocModal(false);
    }
  };

  // ── Handlers: Add Formation ───────────────────────────────
  const handleAddFormation = async () => {
    if (!newFormation.title.trim()) return;
    setFormationSaving(true);
    const { data, error: saveErr } = await addFormation(id, newFormation);
    setFormationSaving(false);
    if (!saveErr && data) {
      setFormations((prev) => [data, ...prev]);
      setNewFormation({ title: '', location: '', status: 'planifié', progress: 0 });
      setShowFormationModal(false);
    }
  };

  // ── Handlers: Add Skill ───────────────────────────────────
  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    setSkillSaving(true);
    const { data, error: saveErr } = await addSkill(id, newSkill);
    setSkillSaving(false);
    if (!saveErr && data) {
      setSkills((prev) => ({
        ...prev,
        [newSkill.category]: [...(prev[newSkill.category] || []), data],
      }));
      setNewSkill({ category: 'techniques', name: '', progress: 0 });
      setShowSkillModal(false);
    }
  };

  // ─────────────────────────────────────────────────────────
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

  // ── Derived data ─────────────────────────────────────────
  const c = companion;
  const firstName     = toSafeString(c.first_name || c.prenom, 'Compagnon');
  const lastName      = toSafeString(c.last_name  || c.nom,    '');
  const fullName      = `${firstName} ${lastName}`.trim();
  const initials      = `${firstName[0] || 'C'}${lastName[0] || ''}`.toUpperCase();
  const profession    = toSafeString(c.profession, '');
  const joinDateStr   = formatDate(c.join_date || c.created_at || c.date_inscription);
  const joinDateShort = joinDateStr;
  const dobStr        = formatDate(c.date_of_birth || c.date_naissance);
  const nationality   = toSafeString(c.nationality || c.nationalite, 'Non renseignée');
  const phoneStr      = toSafeString(c.phone || c.telephone, '—');
  const emailStr      = toSafeString(c.email, '—');
  const cityStr       = toSafeString(c.city || c.ville, '—');
  const postalStr     = toSafeString(c.postal_code || c.code_postal, '');
  const addressStr    = c.address || c.adresse
    ? `${toSafeString(c.address || c.adresse)}, ${postalStr} ${cityStr}`
    : `—`;

  const daysSinceJoin = computeDaysSince(c.join_date || c.created_at);
  const progressPct   = Math.min(100, Math.max(0, Number(c.stats?.formations || 0)));

  // Computed counts from real state
  const formationsDone  = formations.filter((f) => f.status === 'obtenu').length;
  const formationsTotal = formations.length;
  const documentsDone   = documents.filter((d) => d.status === 'valide').length;
  const documentsTotal  = documents.length;

  // Medical
  const med          = c.medical_record || c.medical_info || c.medical || {};
  const bloodType    = toSafeString(med.blood_type || med.groupe_sanguin, '—');
  const doctorName   = toSafeString(med.doctor_name || med.medecin_traitant, '—');
  const allergies    = toSafeString(med.allergies, 'Aucune');
  const rawPaths     = med.pathologiesList || med.pathologies;
  const pathologies  = Array.isArray(rawPaths) && rawPaths.length
    ? rawPaths.map((p) => toSafeString(p)).filter(Boolean)
    : typeof rawPaths === 'string' && rawPaths.trim()
    ? rawPaths.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Referent
  const ref         = c.referent || c.benevole_referent || {};
  const referentName = typeof ref === 'object' && ref !== null
    ? (`${toSafeString(ref.first_name)} ${toSafeString(ref.last_name)}`.trim()) || toSafeString(ref.name, '—')
    : toSafeString(ref, '—');

  // Timeline — use real join date if available
  const timeline = [
    { id: 1, label: 'Intégration', date: joinDateShort, color: 'bg-blue-500' },
  ];

  const SKILL_CATEGORIES = [
    { key: 'techniques', label: 'Savoir-faire techniques', icon: Award,        color: 'text-amber-500'   },
    { key: 'soft',       label: 'Savoir-être',             icon: CheckCircle2, color: 'text-emerald-500' },
    { key: 'languages',  label: 'Langues',                 icon: Globe,        color: 'text-blue-500'    },
    { key: 'digital',    label: 'Numérique',               icon: Cpu,          color: 'text-purple-500'  },
  ];

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
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">{fullName}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {toSafeString(c.status, 'Actif')}
                  </span>
                </div>
                {profession && (
                  <p className="text-sm text-blue-200 font-normal">
                    {profession} &bull; Entré le {joinDateShort}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-blue-200 pt-1">
                  {cityStr !== '—' && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />{cityStr}
                    </span>
                  )}
                  {phoneStr !== '—' && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-300 shrink-0" />{phoneStr}
                    </span>
                  )}
                  {emailStr !== '—' && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-300 shrink-0" />{emailStr}
                    </span>
                  )}
                </div>
                {progressPct > 0 && (
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
                )}
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
                <BookOpen className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">{formationsDone}/{formationsTotal}</p>
                <p className="text-[11px] text-blue-300">Formations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">{documentsDone}/{documentsTotal}</p>
                <p className="text-[11px] text-blue-300">Documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-300" />
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
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Informations personnelles</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: 'Prénom',              value: firstName },
                    { label: 'Nom',                 value: lastName  },
                    { label: 'Date de naissance',   value: dobStr },
                    { label: "Date d'intégration",  value: joinDateStr, highlight: true },
                    { label: 'Nationalité',         value: nationality },
                    { label: 'Téléphone',           value: phoneStr  },
                    { label: 'E-mail',              value: emailStr  },
                    { label: 'Adresse',             value: addressStr, full: true },
                  ].map(({ label, value, full, highlight }) => (
                    <div key={label} className={`flex justify-between text-sm gap-4 ${full ? 'sm:col-span-2' : ''}`}>
                      <span className="text-gray-400 shrink-0">{label}</span>
                      {highlight ? (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-xs">
                          {value || '—'}
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-900 text-right">{value || '—'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Historique */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-900">Historique</h3>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-5">
                    {timeline.map((ev) => (
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

            <div className="space-y-6">
              {/* Responsable */}
              {referentName !== '—' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                    <User className="w-5 h-5 text-purple-500" />
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
              )}

              {/* Note interne */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-gray-500" />
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
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">Résumé médical</h3>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50/70 border border-red-100">
                <Droplets className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Groupe sanguin</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{bloodType}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                <Stethoscope className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Médecin traitant</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{doctorName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Allergies</p>
                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{allergies}</span>
              </div>
              {pathologies.length > 0 && (
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
              )}
              {pathologies.length === 0 && (
                <p className="text-xs text-gray-400">Aucune pathologie enregistrée.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: Documents ─── */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Documents {documents.length > 0 ? `(${documents.length})` : ''}
              </h3>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowDocModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un document
                </button>
              )}
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                message="Aucun document enregistré."
                action={canAdd ? 'Cliquez sur « Ajouter un document » pour commencer.' : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative flex flex-col gap-3">
                    <div className="absolute top-4 right-4">
                      {/* status is 'Valide' | 'À renouveler' | 'Expiré' in real schema */}
                      <DocStatusBadge status={doc.status} />
                    </div>
                    <div className="flex items-start gap-3 pr-20">
                      {/* Icon derived from file_type, no 'icon' column in real schema */}
                      <span className="text-2xl">
                        {doc.file_type === 'Médical' ? '🏥'
                          : doc.file_type === 'Identité' ? '🪪'
                          : doc.file_type === 'Formation' ? '📚'
                          : '📄'}
                      </span>
                      <div>
                        {/* Real schema column is file_name, not title */}
                        <p className="text-sm font-bold text-gray-900">{doc.file_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {/* Real schema column is expiration_date, not expiry_date */}
                          {doc.expiration_date
                            ? `Expire le ${formatDateShort(doc.expiration_date)}`
                            : 'Pas de date d\'expiration'}
                        </p>
                        {doc.file_type && (
                          <span className="text-[10px] text-gray-400 font-medium">{doc.file_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      {doc.file_url && doc.file_url !== '#' && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />Télécharger
                        </a>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDocument(doc.id, doc.file_url);
                            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            {aptsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                message="Aucun rendez-vous planifié."
                action={canAdd ? 'Cliquez sur « Planifier un RDV » pour en ajouter un.' : undefined}
              />
            ) : (
              appointments.map((apt, idx) => (
                <div key={apt.id || idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      apt.status === 'confirmé' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${apt.status === 'confirmé' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      {apt.status === 'confirmé' ? 'Confirmé' : toSafeString(apt.status, 'À confirmer')}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateShort(apt.appointment_date || apt.date)}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{toSafeString(apt.specialty || apt.type || apt.title, 'Rendez-vous')}</p>
                  <p className="text-xs text-gray-500">{toSafeString(apt.doctor_name || apt.doctor || apt.location, '—')}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB: Formations ─── */}
        {activeTab === 'formations' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Formations {formations.length > 0 ? `(${formations.length})` : ''}
              </h3>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowFormationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une formation
                </button>
              )}
            </div>

            {formationsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
            ) : formations.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                message="Aucune formation enregistrée."
                action={canAdd ? 'Cliquez sur « Ajouter une formation » pour commencer.' : undefined}
              />
            ) : (
              formations.map((f) => {
                // Real schema: progress_percentage (from compagnon_formations junction),
                //              title (from joined formations table)
                const pct = f.progress_percentage ?? 0;
                return (
                  <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{f.title}</p>
                        {f.duration_hours > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{f.duration_hours}h de formation</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* status is normalised by fetchFormations/addFormation in service */}
                        <FormationBadge status={f.status} />
                        {canEdit && (
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteFormation(f.id);
                              setFormations((prev) => prev.filter((x) => x.id !== f.id));
                            }}
                            className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">Avancement</span>
                        <span className="text-xs font-bold text-gray-700">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            f.status === 'obtenu' ? 'bg-emerald-500' : f.status === 'en_cours' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── TAB: Compétences ─── */}
        {activeTab === 'competences' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Compétences</h3>
            </div>
            {/* The 'skills' table does not exist in the current database schema.
                This section will be activated once the skills module is created.
                Formation progress data from compagnon_formations is visible in the
                Formations tab above. */}
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <Award className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Module Compétences</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Ce module sera disponible prochainement. Les compétences seront liées
                aux formations complétées et aux évaluations effectuées par le référent.
              </p>
              <p className="text-xs text-blue-400 mt-3 font-medium">
                Consultez l'onglet <strong>Formations</strong> pour voir la progression actuelle.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}

      {/* Appointment Modal */}
      {showAppointmentModal && c && (
        <AppointmentModal
          appointment={null}
          companions={[c]}
          defaultCompanionId={c.id}
          onSuccess={() => {
            setShowAppointmentModal(false);
            if (activeTab === 'rendezvous') loadAppointments();
          }}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}

      {/* Edit Companion Modal */}
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

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={showMsgModal}
        onClose={() => setShowMsgModal(false)}
        defaultReceiverName={`${toSafeString(companion?.first_name)} ${toSafeString(companion?.last_name)}`.trim() || 'Compagnon'}
        defaultReceiverId={companion?.id}
      />

      {/* ─── Add Document Modal ─── */}
      {showDocModal && (
        <ModalShell title="Ajouter un document" onClose={() => setShowDocModal(false)}>
          <div>
            <label className={LABEL_CLS}>Nom du document <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newDoc.title}
              onChange={(e) => setNewDoc((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Carte d'identité"
              className={INPUT_CLS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* file_type matches real schema: 'Identité'|'Médical'|'Administratif'|'Formation'|'Autre' */}
              <label className={LABEL_CLS}>Catégorie</label>
              <select
                value={newDoc.file_type}
                onChange={(e) => setNewDoc((p) => ({ ...p, file_type: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="Identité">Identité</option>
                <option value="Médical">Médical</option>
                <option value="Administratif">Administratif</option>
                <option value="Formation">Formation</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              {/* status matches real schema: 'Valide'|'À renouveler'|'Expiré' */}
              <label className={LABEL_CLS}>Statut</label>
              <select
                value={newDoc.status}
                onChange={(e) => setNewDoc((p) => ({ ...p, status: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="Valide">Valide</option>
                <option value="À renouveler">À renouveler</option>
                <option value="Expiré">Expiré</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Date d'expiration</label>
            <input
              type="date"
              value={newDoc.expiry_date}
              onChange={(e) => setNewDoc((p) => ({ ...p, expiry_date: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Fichier (optionnel)</label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {docFile ? docFile.name : 'Choisir un fichier...'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDocModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddDocument}
              disabled={!newDoc.title.trim() || docSaving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {docSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </ModalShell>
      )}

      {/* ─── Add Formation Modal ─── */}
      {showFormationModal && (
        <ModalShell title="Ajouter une formation" onClose={() => setShowFormationModal(false)}>
          <p className="text-xs text-gray-400 -mt-1">
            La formation sera ajoutée au catalogue si elle n'existe pas encore, puis liée à ce compagnon.
          </p>
          <div>
            <label className={LABEL_CLS}>Titre de la formation <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newFormation.title}
              onChange={(e) => setNewFormation((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Formation PSC1"
              className={INPUT_CLS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* status mapped → 'À commencer'|'En cours'|'Terminé' in real DB */}
              <label className={LABEL_CLS}>Statut</label>
              <select
                value={newFormation.status}
                onChange={(e) => setNewFormation((p) => ({ ...p, status: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="planifié">À commencer</option>
                <option value="en_cours">En cours</option>
                <option value="obtenu">Terminé</option>
              </select>
            </div>
            <div>
              {/* stored as progress_percentage in compagnon_formations */}
              <label className={LABEL_CLS}>Avancement (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newFormation.progress}
                onChange={(e) => setNewFormation((p) => ({ ...p, progress: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowFormationModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddFormation}
              disabled={!newFormation.title.trim() || formationSaving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {formationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </ModalShell>
      )}

      {/* ─── Add Skill Modal ─── */}
      {showSkillModal && (
        <ModalShell title="Ajouter une compétence" onClose={() => setShowSkillModal(false)}>
          <div>
            <label className={LABEL_CLS}>Catégorie</label>
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill((p) => ({ ...p, category: e.target.value }))}
              className={INPUT_CLS}
            >
              <option value="techniques">Savoir-faire techniques</option>
              <option value="soft">Savoir-être</option>
              <option value="languages">Langues</option>
              <option value="digital">Numérique</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Nom de la compétence <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Menuiserie bois"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Niveau (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newSkill.progress}
              onChange={(e) => setNewSkill((p) => ({ ...p, progress: Number(e.target.value) }))}
              className={INPUT_CLS}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSkillModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!newSkill.name.trim() || skillSaving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {skillSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

export default CompanionProfile;
