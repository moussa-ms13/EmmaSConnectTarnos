import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import {
  fetchCompanions,
  createCompanion,
  updateCompanion,
  deleteCompanion,
  fetchMyCompanionId,
} from '../../services/companionService';
import CompanionForm from './CompanionForm';

const ITEMS_PER_PAGE = 10;

/**
 * Role badge styles and French labels.
 */
const ROLE_CONFIG = {
  admin: { label: 'Administrateur', style: 'bg-purple-100 text-purple-700' },
  Admin: { label: 'Administrateur', style: 'bg-purple-100 text-purple-700' },
  administrateur: { label: 'Administrateur', style: 'bg-purple-100 text-purple-700' },
  Administrateur: { label: 'Administrateur', style: 'bg-purple-100 text-purple-700' },
  editor: { label: 'Éditeur / Manager', style: 'bg-blue-100 text-blue-700' },
  Editor: { label: 'Éditeur / Manager', style: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Éditeur / Manager', style: 'bg-blue-100 text-blue-700' },
  Manager: { label: 'Éditeur / Manager', style: 'bg-blue-100 text-blue-700' },
  user: { label: 'Utilisateur', style: 'bg-blue-100 text-blue-700' },
  User: { label: 'Utilisateur', style: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Lecteur / Compagnon', style: 'bg-gray-100 text-gray-700' },
  Viewer: { label: 'Lecteur / Compagnon', style: 'bg-gray-100 text-gray-700' },
  read: { label: 'Lecteur / Compagnon', style: 'bg-gray-100 text-gray-700' },
};

/**
 * CompanionsList — Main page for the Compagnons module.
 * Displays a searchable, paginated data table with CRUD actions.
 */
function CompanionsList() {
  const { user, profile, isViewer, isCompagnon, canAdd, canEdit, canDelete } = useAuth();
  const navigate = useNavigate();

  // Strict access control: If the logged-in user is a Viewer or Compagnon, redirect them to their own profile page
  useEffect(() => {
    let isMounted = true;
    async function redirectViewer() {
      if (isViewer || isCompagnon) {
        let targetId = profile?.is_compagnon ? profile.id : null;
        if (!targetId) {
          targetId = await fetchMyCompanionId(user?.id, user?.email);
        }
        if (!targetId && profile?.id) {
          targetId = profile.id;
        }
        if (!targetId && user?.id) {
          targetId = user.id;
        }
        if (isMounted && targetId) {
          navigate(`/compagnons/${targetId}`, { replace: true });
        }
      }
    }

    if (isViewer || isCompagnon) {
      redirectViewer();
    }

    return () => {
      isMounted = false;
    };
  }, [isViewer, isCompagnon, profile, user, navigate]);

  // Data state
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  /**
   * Load all companions from Supabase.
   */
  const loadCompanions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchCompanions();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCompanions(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompanions();
  }, [loadCompanions]);

  /**
   * Filter companions by search query (first name, last name, or email).
   */
  const filteredCompanions = companions.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCompanions.length / ITEMS_PER_PAGE));
  const paginatedCompanions = filteredCompanions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /**
   * Handle saving a companion (create or update).
   */
  const handleSave = async (formData) => {
    if (editingCompanion) {
      // Update existing
      const { error: updateError } = await updateCompanion(editingCompanion.id, formData);
      if (updateError) throw new Error(updateError.message);
    } else {
      // Create new — created_by is injected automatically by createCompanion
      const { error: createError } = await createCompanion(formData);
      if (createError) throw new Error(createError.message);
    }
    setShowForm(false);
    setEditingCompanion(null);
    loadCompanions();
  };

  /**
   * Handle deleting a companion.
   */
  const handleDelete = async (id) => {
    const { error: deleteError } = await deleteCompanion(id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setDeletingId(null);
      loadCompanions();
    }
  };

  /**
   * Open the form modal for editing.
   */
  const openEdit = (companion) => {
    setEditingCompanion(companion);
    setShowForm(true);
  };

  /**
   * Open the form modal for creating.
   */
  const openCreate = () => {
    setEditingCompanion(null);
    setShowForm(true);
  };

  /**
   * Format a date string for display.
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Status badge color mapping.
   */
  const getStatusStyle = (status) => {
    switch (status) {
      case 'actif':
        return 'bg-emerald-100 text-emerald-700';
      case 'inactif':
        return 'bg-gray-100 text-gray-600';
      case 'en_attente':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'actif':
        return 'Actif';
      case 'inactif':
        return 'Inactif';
      case 'en_attente':
        return 'En attente';
      default:
        return status;
    }
  };

  /**
   * Get role display config from the companion role or joined roles data.
   */
  const getRoleDisplay = (companion) => {
    const roleVal = companion.role || companion.roles?.name || companion.role_name;
    if (!roleVal) return { label: 'Compagnon', style: 'bg-gray-100 text-gray-600' };
    if (ROLE_CONFIG[roleVal]) return ROLE_CONFIG[roleVal];
    const lower = String(roleVal).toLowerCase();
    if (lower === 'admin' || lower === 'administrateur') return ROLE_CONFIG.admin;
    if (lower === 'editor' || lower === 'manager' || lower === 'user' || lower === 'utilisateur') return ROLE_CONFIG.editor;
    if (lower === 'viewer' || lower === 'lecteur' || lower === 'read' || lower === 'compagnon') return ROLE_CONFIG.viewer;
    return { label: roleVal, style: 'bg-gray-100 text-gray-600' };
  };

  // If user is a viewer or companion, render redirect spinner instead of full companions list
  if (isViewer || isCompagnon) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Redirection vers votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ───── Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compagnons</h1>
            <p className="text-sm text-gray-500">
              {filteredCompanions.length} compagnon{filteredCompanions.length !== 1 ? 's' : ''} enregistré{filteredCompanions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-4.5 h-4.5" />
            Ajouter un compagnon
          </button>
        )}
      </div>

      {/* ───── Search Bar ───── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un compagnon..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* ───── Error State ───── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ───── Data Table ───── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          /* Loading state */
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Chargement des compagnons...</p>
            </div>
          </div>
        ) : paginatedCompanions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery ? 'Aucun résultat' : 'Aucun compagnon'}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
              {searchQuery
                ? `Aucun compagnon ne correspond à "${searchQuery}".`
                : 'Commencez par ajouter votre premier compagnon à la plateforme.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un compagnon
              </button>
            )}
          </div>
        ) : (
          /* Table */
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Compagnon
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Contact
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Rôle
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Statut
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Date d'ajout
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCompanions.map((companion) => {
                    const roleDisplay = getRoleDisplay(companion);
                    return (
                      <tr
                        key={companion.id}
                        className="hover:bg-blue-50/30 transition-colors duration-150"
                      >
                        {/* Name with avatar initials or image */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {companion.avatar_url ? (
                              <img
                                src={companion.avatar_url}
                                alt={`${companion.first_name} ${companion.last_name}`}
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                {companion.first_name?.[0]}{companion.last_name?.[0]}
                              </div>
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={() => navigate(`/compagnons/${companion.id}`)}
                                className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors cursor-pointer block"
                              >
                                {companion.first_name} {companion.last_name}
                              </button>
                              {companion.profession && (
                                <p className="text-xs text-gray-500 mt-0.5">{companion.profession}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {companion.email && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {companion.email}
                              </div>
                            )}
                            {companion.phone && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {companion.phone}
                              </div>
                            )}
                            {!companion.email && !companion.phone && (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-6 py-4">
                          {roleDisplay ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleDisplay.style}`}>
                              <ShieldCheck className="w-3 h-3" />
                              {roleDisplay.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(companion.status)}`}
                          >
                            {getStatusLabel(companion.status)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(companion.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/compagnons/${companion.id}`)}
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              aria-label={`Voir profil de ${companion.first_name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEdit(companion)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                aria-label={`Modifier ${companion.first_name}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              deletingId === companion.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(companion.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(companion.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  aria-label={`Supprimer ${companion.first_name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ───── Pagination ───── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <p className="text-sm text-gray-500">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ───── Form Modal ───── */}
      {showForm && (
        <CompanionForm
          companion={editingCompanion}
          initialData={editingCompanion}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingCompanion(null);
          }}
        />
      )}
    </div>
  );
}

export default CompanionsList;
