import React, { useState } from 'react';
import { User, Lock, Mail, Shield, Save, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { sendPasswordReset } from '../../services/authService';
import supabase from '../../services/supabaseClient';

/**
 * ProfileTab — Mon Profil settings tab.
 * Styled with glassmorphic panels and signature Emmaüs Connect design tokens.
 */
function ProfileTab({ user, profile, onProfileUpdated }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(null);

  const roleName = profile?.roles?.name || profile?.role || 'user';
  const email = user?.email || 'utilisateur@emmaus-connect.org';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        .eq('id', user?.id || profile?.id);

      if (updErr) {
        throw updErr;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 6000);
    } catch (err) {
      console.error('Error sending reset email:', err);
      alert('Erreur lors de l\'envoi de l\'email de réinitialisation.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ───── Personal Information Form Card ───── */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-gray-200/80 dark:border-slate-800/80 p-7 shadow-lg transition-colors">
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Informations personnelles
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Mettez à jour vos informations de compte encadrant ou coordinateur.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            {roleName}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Vos informations ont été mises à jour avec succès.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Sophie"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Renaud"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Adresse email professionnelle
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/60 text-sm text-gray-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
              L'adresse email est reliée à votre compte d'authentification Supabase.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {/* ───── Security & Password Reset Card ───── */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-gray-200/80 dark:border-slate-800/80 p-7 shadow-lg transition-colors">
        <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 dark:border-slate-800 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Sécurité et mot de passe
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Gérez l'accès à votre compte et réinitialisez votre mot de passe par email.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Réinitialiser le mot de passe
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Un email contenant un lien sécurisé sera envoyé à <strong>{email}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetSent}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              resetSent
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'
            }`}
          >
            {resetSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Email envoyé !
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Réinitialiser mon mot de passe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileTab;
