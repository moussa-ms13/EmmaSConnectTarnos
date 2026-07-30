import React, { useState, useEffect } from 'react';
import {
  Award, Plus, Trophy, Star, Shield, Bookmark, CheckCircle2,
  Calendar, User, Trash2, X, Save, Loader2, Filter, Heart, Sparkles,
} from 'lucide-react';
import {
  getAllAchievements,
  createAchievement,
  deleteAchievement,
} from '../../services/achievementService';
import { fetchCompanions } from '../../services/companionService';

const CATEGORY_OPTIONS = ['Excellence', 'Engagement', 'Formation', 'Innovation'];
const BADGE_LEVELS = ['Or', 'Argent', 'Bronze', 'Certificat', 'Expert', 'Spécial'];

/**
 * AchievementsList — Full UI for Réalisations (Achievements) module.
 * Features dark blue statistics banner, category filter chips, and colorful badge cards.
 * Strictly uses real Supabase database rows with zero mock/fallback data.
 */
function AchievementsList() {
  const [achievements, setAchievements] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [compagnonId, setCompagnonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Excellence');
  const [badgeLevel, setBadgeLevel] = useState('Or');
  const [dateAwarded, setDateAwarded] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achRes, compRes] = await Promise.all([
        getAllAchievements(),
        fetchCompanions(),
      ]);
      setAchievements(achRes.data || []);
      setCompanions(compRes.data || []);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const totalAchievements = achievements.length;
  const goldCount = achievements.filter((a) => a.badge_level === 'Or').length;
  const certCount = achievements.filter((a) => a.badge_level === 'Certificat' || a.category === 'Formation').length;
  const uniqueCompanions = new Set(achievements.map((a) => a.compagnon_id || a.compagnons?.first_name)).size;

  const handleCreateAchievement = async (e) => {
    e.preventDefault();
    if (!compagnonId || !title.trim()) return;
    setSaving(true);
    await createAchievement({
      compagnon_id: compagnonId,
      title: title.trim(),
      description: description.trim() || null,
      category,
      badge_level: badgeLevel,
      date_awarded: dateAwarded || new Date().toISOString().split('T')[0],
    });
    setCompagnonId('');
    setTitle('');
    setDescription('');
    setShowModal(false);
    setSaving(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette réalisation ?')) return;
    await deleteAchievement(id);
    loadData();
  };

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory === 'Tous') return true;
    return a.category === selectedCategory;
  });

  const getBadgeStyling = (level) => {
    switch (level) {
      case 'Or':
        return {
          cardBorder: 'border-amber-300 hover:border-amber-400',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-amber-500/30',
          icon: Trophy,
          badgeLabel: 'Médaille d’Or',
        };
      case 'Argent':
        return {
          cardBorder: 'border-slate-300 hover:border-slate-400',
          badgeBg: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-slate-500/30',
          icon: Shield,
          badgeLabel: 'Médaille d’Argent',
        };
      case 'Bronze':
        return {
          cardBorder: 'border-amber-700/30 hover:border-amber-700/50',
          badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-amber-700/30',
          icon: Award,
          badgeLabel: 'Médaille de Bronze',
        };
      case 'Certificat':
        return {
          cardBorder: 'border-blue-200 hover:border-blue-300',
          badgeBg: 'bg-blue-600 text-white shadow-blue-600/30',
          icon: Bookmark,
          badgeLabel: 'Certificat validé',
        };
      case 'Expert':
        return {
          cardBorder: 'border-purple-200 hover:border-purple-300',
          badgeBg: 'bg-purple-600 text-white shadow-purple-600/30',
          icon: Sparkles,
          badgeLabel: 'Expertise',
        };
      default:
        return {
          cardBorder: 'border-emerald-200 hover:border-emerald-300',
          badgeBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
          icon: Star,
          badgeLabel: level || 'Spécial',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ───── Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Réalisations — Certifications & récompenses
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Valorisation des compétences acquises, diplômes et succès des compagnons.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-500/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Décerner une réalisation
        </button>
      </div>

      {/* ───── Top Dark Blue Statistics Banner ───── */}
      <div
        className="rounded-2xl px-8 py-6 text-white shadow-lg grid grid-cols-2 lg:grid-cols-4 gap-6"
        style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1a2f5a 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Récompenses</p>
            <p className="text-2xl font-extrabold mt-0.5">{totalAchievements}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Médailles d'Or</p>
            <p className="text-2xl font-extrabold mt-0.5">{goldCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Certificats</p>
            <p className="text-2xl font-extrabold mt-0.5">{certCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Compagnons primés</p>
            <p className="text-2xl font-extrabold mt-0.5">{uniqueCompanions}</p>
          </div>
        </div>
      </div>

      {/* ───── Category Filter Chips ───── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Catégories :
        </span>
        {['Tous', ...CATEGORY_OPTIONS].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat === 'Tous' ? 'Toutes les catégories' : cat}
          </button>
        ))}
      </div>

      {/* ───── Achievements Grid ───── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">Aucune réalisation dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredAchievements.map((item) => {
            const compName = `${item.compagnons?.first_name || ''} ${item.compagnons?.last_name || ''}`.trim() || 'Compagnon';
            const style = getBadgeStyling(item.badge_level);
            const Icon = style.icon;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-2 ${style.cardBorder} p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  {/* Top row: badge pill + category */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${style.badgeBg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {style.badgeLabel}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer: companion avatar + date + delete */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      {compName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{compName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {item.date_awarded ? new Date(item.date_awarded).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer la réalisation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Award Achievement Modal ───── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
              <h3 className="text-lg font-bold text-gray-900">Décerner une réalisation</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAchievement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Compagnon <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={compagnonId}
                  onChange={(e) => setCompagnonId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
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
                  Titre du certificat / prix <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Major de promotion, Certificat bureautique"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Niveau / Badge
                  </label>
                  <select
                    value={badgeLevel}
                    onChange={(e) => setBadgeLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {BADGE_LEVELS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date d'obtention
                </label>
                <input
                  type="date"
                  value={dateAwarded}
                  onChange={(e) => setDateAwarded(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description / Motivation
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motivation ou détail de la compétence validée..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !compagnonId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AchievementsList;
