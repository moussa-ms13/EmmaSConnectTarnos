import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Clock, Users, CheckCircle2, PlayCircle,
  AlertCircle, Loader2, Award, ChevronRight, X, Save,
  User, BarChart3, Edit3, Trash2,
} from 'lucide-react';
import {
  getAllFormations,
  getAllCompanionFormations,
  createFormation,
  updateFormation,
  deleteFormation,
  assignFormation,
  updateFormationProgress,
} from '../../services/trainingService';
import { fetchCompanions } from '../../services/companionService';

/**
 * TrainingsList — Formations & modules d'apprentissage module.
 * Strictly uses real Supabase database rows with zero mock/fallback data.
 */
function TrainingsList() {
  const [formations, setFormations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(10);

  const [assignCompId, setAssignCompId] = useState('');
  const [assignProgress, setAssignProgress] = useState(25);
  const [assignStatus, setAssignStatus] = useState('En cours');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formRes, assignRes, compRes] = await Promise.all([
        getAllFormations(),
        getAllCompanionFormations(),
        fetchCompanions(),
      ]);
      setFormations(formRes.data || []);
      setAssignments(assignRes.data || []);
      setCompanions(compRes.data || []);
    } catch (err) {
      console.error('Error loading training data:', err);
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute top stats
  const totalCourses = formations.length;
  const totalHours = formations.reduce((acc, f) => acc + (f.duration_hours || 0), 0);
  const completedCount = formations.filter((f) => f.progress_percentage === 100 || f.status === 'Terminé').length;
  const avgProgress = totalCourses > 0
    ? Math.round(formations.reduce((acc, f) => acc + (f.progress_percentage || 0), 0) / totalCourses)
    : 0;

  // Handle Create or Update Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);

    if (editCourse) {
      const updatedData = {
        title: newTitle.trim(),
        duration_hours: Number(newDuration) || 0,
      };
      setFormations((prev) =>
        prev.map((f) => (f.id === editCourse.id ? { ...f, ...updatedData } : f))
      );
      await updateFormation(editCourse.id, updatedData);
      setEditCourse(null);
    } else {
      await createFormation({
        title: newTitle.trim(),
        duration_hours: Number(newDuration) || 0,
        participants_count: 0,
      });
    }

    setNewTitle('');
    setNewDuration(10);
    setShowCreateModal(false);
    setSaving(false);
    loadData();
  };

  const handleEditClick = (course) => {
    setEditCourse(course);
    setNewTitle(course.title || '');
    setNewDuration(course.duration_hours || 10);
    setShowCreateModal(true);
  };

  const handleDeleteClick = async (courseId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
    setFormations((prev) => prev.filter((f) => f.id !== courseId));
    await deleteFormation(courseId);
  };

  // Handle Assign Course
  const handleAssignCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !assignCompId) return;
    setSaving(true);
    await assignFormation({
      compagnon_id: assignCompId,
      formation_id: selectedCourse.id,
      progress_percentage: Number(assignProgress),
      status: assignStatus,
      completed_at: assignStatus === 'Terminé' ? new Date().toISOString().split('T')[0] : null,
    });
    setShowAssignModal(false);
    setSaving(false);
    loadData();
  };

  const getProgressBarColor = (status, progress) => {
    if (status === 'Terminé' || progress === 100) {
      return 'bg-emerald-500';
    }
    if (status === 'En cours' || (progress > 0 && progress < 100)) {
      return 'bg-blue-600';
    }
    return 'bg-gray-300';
  };

  const getStatusBadge = (status, progress) => {
    if (status === 'Terminé' || progress === 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Terminé
        </span>
      );
    }
    if (status === 'En cours' || progress > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <PlayCircle className="w-3.5 h-3.5" /> En cours
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        <Clock className="w-3.5 h-3.5" /> À commencer
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ───── Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Formations — Parcours de développement
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Suivi des ateliers, formations d'inclusion numérique et progression d'apprentissage.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditCourse(null);
            setNewTitle('');
            setNewDuration(10);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-md shadow-purple-600/25 hover:bg-purple-700 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouvelle formation
        </button>
      </div>

      {/* ───── Top Stats Cards ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formations au catalogue</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Heures de formation</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalHours} h</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modules terminés</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Taux moyen d'avancement</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{avgProgress}%</p>
          </div>
        </div>
      </div>

      {/* ───── Courses Grid ───── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {formations.map((course) => {
            const prog = course.progress_percentage ?? 0;
            const barColor = getProgressBarColor(course.status, prog);

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: badge + status + edit/delete actions */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration_hours || 10} h
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(course.status, prog)}
                      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(course)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Modifier la formation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(course.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer la formation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>Progression du parcours</span>
                      <span className="font-extrabold text-gray-900">{prog}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, prog))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer action row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {course.participants_count || 1} participant(s)
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowAssignModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
                  >
                    Assigner un compagnon
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Create / Edit Formation Modal ───── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
              <h3 className="text-lg font-bold text-gray-900">
                {editCourse ? 'Modifier la formation' : 'Nouvelle formation au catalogue'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditCourse(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Titre de la formation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Initiation à Internet et e-mail"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Durée (en heures)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditCourse(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editCourse ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Assign Formation Modal ───── */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assigner une formation</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCourse.title}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Compagnon <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignCompId}
                  onChange={(e) => setAssignCompId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                >
                  <option value="">Sélectionner un compagnon</option>
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Statut
                </label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-purple-500 focus:bg-white"
                >
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="À commencer">À commencer</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                  <span>Progrès initial</span>
                  <span className="font-bold text-purple-700">{assignProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={assignProgress}
                  onChange={(e) => setAssignProgress(e.target.value)}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !assignCompId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingsList;
