import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Droplets, Stethoscope, Calendar, Clock,
  ChevronDown, Loader2, AlertTriangle, User,
  CheckCircle2, AlertCircle, Activity, CalendarPlus,
  FileText, Edit3, Plus,
} from 'lucide-react';
import { fetchCompanions } from '../../services/companionService';
import { fetchCompanionHealthData } from '../../services/healthService';
import MedicalRecordForm from './MedicalRecordForm';
import ConsultationForm from './ConsultationForm';

/**
 * HealthDashboard — Companion medical overview page (Santé module).
 * Includes a companion selector, 4 top stats cards, chronic pathologies (orange dots),
 * known allergies (red dots), medical consultation history timeline,
 * and interactive modals to edit the medical profile and add consultations.
 */
function HealthDashboard() {
  const [companions, setCompanions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Modal controls
  const [showMedModal, setShowMedModal] = useState(false);
  const [showConsModal, setShowConsModal] = useState(false);

  // Load all companions for the dropdown
  useEffect(() => {
    async function loadCompanions() {
      const { data } = await fetchCompanions();
      setCompanions(data || []);
      setLoading(false);
    }
    loadCompanions();
  }, []);

  // Load medical record + consultations when companion changes
  const loadCompanionHealth = useCallback(async (compagnonId) => {
    if (!compagnonId) {
      setMedicalRecord(null);
      setConsultations([]);
      return;
    }
    setLoadingData(true);
    const { medicalRecord: medData, consultations: consData } =
      await fetchCompanionHealthData(compagnonId);
    setMedicalRecord(medData || null);
    setConsultations(consData || []);
    setLoadingData(false);
  }, []);

  const handleSelectCompanion = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    loadCompanionHealth(id);
  };

  /**
   * Format date for display.
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedCompanion = companions.find((c) => c.id === selectedId);

  // Categorize consultations for top cards
  const now = new Date();
  const sortedConsultations = [...consultations].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );
  const pastConsultations = sortedConsultations.filter(
    (c) => new Date(c.date) <= now || c.status === 'Terminé'
  );
  const upcomingConsultations = sortedConsultations.filter(
    (c) => new Date(c.date) > now || c.status === 'Planifié' || c.status === 'Confirmé'
  );

  const lastConsultation = pastConsultations[0] || sortedConsultations[0] || null;
  const nextConsultation = upcomingConsultations[0] || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Santé - Dossier médical & consultations
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Consultez le dossier médical et l'historique des consultations d'un compagnon.
            </p>
          </div>
        </div>

        {/* Companion selector & Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {selectedId && !loadingData && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMedModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                Modifier le dossier
              </button>
              <button
                type="button"
                onClick={() => setShowConsModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Nouvelle consultation
              </button>
            </div>
          )}

          <div className="relative w-full sm:w-72">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedId}
              onChange={handleSelectCompanion}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Sélectionner un compagnon</option>
              {companions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ───── Empty state (no companion selected) ───── */}
      {!selectedId && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Aucun compagnon sélectionné
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Utilisez le menu déroulant ci-dessus pour sélectionner un compagnon et consulter son dossier médical.
          </p>
        </div>
      )}

      {/* ───── Loading state ───── */}
      {selectedId && loadingData && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* ───── Data view ───── */}
      {selectedId && !loadingData && (
        <>
          {/* ───── 4 Top Stats Cards ───── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Blood group */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Groupe sanguin</p>
                <p className="text-xl font-bold text-gray-900">
                  {medicalRecord?.blood_type || '—'}
                </p>
              </div>
            </div>

            {/* 2. Doctor */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Médecin traitant</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {medicalRecord?.doctor_name || '—'}
                </p>
              </div>
            </div>

            {/* 3. Last consultation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Dernière consultation</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {lastConsultation ? formatDate(lastConsultation.date) : 'Aucune'}
                </p>
              </div>
            </div>

            {/* 4. Next Appointment (Prochain RDV) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <CalendarPlus className="w-6 h-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Prochain RDV</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {nextConsultation ? formatDate(nextConsultation.date) : 'Aucun'}
                </p>
              </div>
            </div>
          </div>

          {/* ───── Medical Content Grid ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1 Column: Pathologies & Allergies */}
            <div className="space-y-6">
              {/* Pathologies chroniques (Orange dots) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Pathologies chroniques</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMedModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                </div>
                <div className="p-5">
                  {medicalRecord?.pathologiesList && medicalRecord.pathologiesList.length > 0 ? (
                    <ul className="space-y-3">
                      {medicalRecord.pathologiesList.map((item, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm font-medium text-gray-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-sm" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune donnée</p>
                  )}
                </div>
              </div>

              {/* Allergies connues (Red dots) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500" />
                    <h3 className="text-sm font-bold text-gray-900">Allergies connues</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMedModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                </div>
                <div className="p-5">
                  {medicalRecord?.allergiesList && medicalRecord.allergiesList.length > 0 ? (
                    <ul className="space-y-3">
                      {medicalRecord.allergiesList.map((item, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm font-medium text-gray-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-sm" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune donnée</p>
                  )}
                </div>
              </div>

              {/* Health Summary if available */}
              {medicalRecord?.health_summary && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-blue-500" />
                      <h3 className="text-sm font-bold text-gray-900">Résumé général</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMedModal(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modifier
                    </button>
                  </div>
                  <div className="p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {medicalRecord.health_summary}
                  </div>
                </div>
              )}
            </div>

            {/* Right 2 Columns: Historique médical vertical timeline */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-gray-600" />
                  <h3 className="text-sm font-bold text-gray-900">Historique médical</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {consultations.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouvelle consultation
                </button>
              </div>

              <div className="p-6">
                {consultations.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">Aucune donnée</p>
                    <p className="text-xs text-gray-400 mt-1">Aucun historique médical disponible pour ce compagnon.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 my-2">
                    {sortedConsultations.map((cons) => {
                      const isCompleted = cons.status === 'Terminé';
                      const isCancelled = cons.status === 'Annulé';

                      const statusColor = isCompleted
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : isCancelled
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200';

                      const markerColor = isCompleted
                        ? 'bg-emerald-500 ring-emerald-100'
                        : isCancelled
                          ? 'bg-red-500 ring-red-100'
                          : 'bg-blue-500 ring-blue-100';

                      return (
                        <div key={cons.id} className="relative group">
                          {/* Timeline dot */}
                          <span
                            className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ${markerColor} ring-4 transition-transform group-hover:scale-125`}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/70 hover:bg-gray-50 p-4 rounded-xl border border-gray-200/70 transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {cons.specialty || 'Consultation générale'}
                                </h4>
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                                  {cons.status || 'Terminé'}
                                </span>
                              </div>

                              <p className="text-xs font-medium text-gray-600 mt-1">
                                {cons.doctor_name || 'Médecin non renseigné'}
                              </p>

                              {cons.notes && (
                                <p className="text-xs text-gray-500 mt-2 bg-white px-3 py-2 rounded-lg border border-gray-100 leading-relaxed">
                                  {cons.notes}
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold text-gray-700">
                                {formatDate(cons.date)}
                              </p>
                              {formatTime(cons.date) && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  à {formatTime(cons.date)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ───── Medical Record Edit Modal ───── */}
          {showMedModal && selectedCompanion && (
            <MedicalRecordForm
              compagnonId={selectedId}
              companionName={`${selectedCompanion.first_name || ''} ${selectedCompanion.last_name || ''}`.trim()}
              medicalRecord={medicalRecord}
              onSuccess={() => {
                setShowMedModal(false);
                loadCompanionHealth(selectedId);
              }}
              onClose={() => setShowMedModal(false)}
            />
          )}

          {/* ───── Consultation Create Modal ───── */}
          {showConsModal && selectedCompanion && (
            <ConsultationForm
              compagnonId={selectedId}
              companionName={`${selectedCompanion.first_name || ''} ${selectedCompanion.last_name || ''}`.trim()}
              onSuccess={() => {
                setShowConsModal(false);
                loadCompanionHealth(selectedId);
              }}
              onClose={() => setShowConsModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default HealthDashboard;
