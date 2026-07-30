import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Mail, Shield, Lock, User, Loader2, X, CheckCircle2,
  Calendar, Search,
} from 'lucide-react';
import { fetchAllProfiles, registerNewUser } from '../../services/authService';

/**
 * UserManagementTab — Gestion des utilisateurs tab (Admin only).
 * Strictly uses real Supabase database rows with zero mock/fallback data.
 */
function UserManagementTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for New User Modal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('user');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await fetchAllProfiles();
    setProfiles(data || []);
    setLoading(false);
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    if (!firstName || !lastName || !email || !password) {
      setModalError('Veuillez remplir tous les champs obligatoires.');
      setSubmitting(false);
      return;
    }

    const res = await registerNewUser({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      role_name: roleName,
    });

    setSubmitting(false);

    if (res.error) {
      setModalError(res.error.message || "Erreur lors de la création de l'utilisateur.");
      return;
    }

    setSuccessMsg(`L'utilisateur ${firstName} ${lastName} (${roleName.toUpperCase()}) a été créé avec succès.`);
    setTimeout(() => setSuccessMsg(''), 5000);

    // Close modal & reset fields
    setIsModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRoleName('user');

    // Refresh user table
    loadUsers();
  };

  const filteredUsers = profiles.filter((u) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const query = search.toLowerCase();
    return fullName.includes(query) || emailStr.includes(query);
  });

  const getRoleBadge = (role) => {
    const name = role?.name || role || 'user';
    if (name === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          <Shield className="w-3 h-3" />
          Administrateur
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        <User className="w-3 h-3" />
        Encadrant / Utilisateur
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ───── Top Bar: Title & New User Button ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Utilisateurs de la plateforme ({profiles.length})
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Gérez les comptes encadrants et coordonnateurs avec leurs autorisations d'accès.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ───── Search Input ───── */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-500 transition-all"
        />
      </div>

      {/* ───── User Data Table ───── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des profils...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Aucun utilisateur ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Utilisateur</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Rôle</th>
                  <th className="py-3.5 px-6">Date d'inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {filteredUsers.map((u) => {
                  const first = u.first_name || '';
                  const last = u.last_name || '';
                  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'EC';
                  const dateFormatted = u.created_at
                    ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Récemment';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {first} {last}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                              ID: {u.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-slate-300">
                        {u.email || '—'}
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(u.roles || u.role_id)}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-slate-400 text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {dateFormatted}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───── Glassmorphic Modal: "+ Nouvel Utilisateur" ───── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Créer un compte utilisateur
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Ajouter un nouvel encadrant ou administrateur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ex: Thomas"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ex: Martin"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Adresse email professionnelle
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: thomas.martin@emmaus-connect.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Mot de passe temporaire
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ex: Emmaus2026!"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  L'utilisateur pourra changer ce mot de passe à la première connexion.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Rôle (Autorisations d'accès)
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setRoleName('user')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      roleName === 'user'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold'
                        : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" />
                      <span>Standard (User)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">
                      Gestion des compagnons, démarches et plannings
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleName('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      roleName === 'admin'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold'
                        : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4" />
                      <span>Administrateur</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">
                      Accès complet, y compris la gestion des utilisateurs
                    </p>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {submitting ? 'Création en cours...' : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementTab;
