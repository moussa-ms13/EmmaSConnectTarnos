import React, { useState, useEffect } from 'react';
import { Bell, Mail, Globe, Save, CheckCircle2 } from 'lucide-react';

/**
 * GeneralTab — Général settings tab.
 * Manages email/push notification preferences and interface language selection with localStorage persistence.
 */
function GeneralTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [language, setLanguage] = useState('fr-FR');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage if saved previously
    const savedPrefs = localStorage.getItem('emmaus_general_prefs');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (typeof parsed.emailNotifs === 'boolean') setEmailNotifs(parsed.emailNotifs);
        if (typeof parsed.pushNotifs === 'boolean') setPushNotifs(parsed.pushNotifs);
        if (parsed.language) setLanguage(parsed.language);
      } catch (e) {
        console.error('Error parsing general prefs:', e);
      }
    }
  }, []);

  const handleSavePrefs = (e) => {
    e.preventDefault();
    const prefs = {
      emailNotifs,
      pushNotifs,
      language,
    };
    localStorage.setItem('emmaus_general_prefs', JSON.stringify(prefs));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ───── Notifications Preferences Card ───── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Préférences de notification
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Choisissez les alertes et communications automatiques que vous souhaitez recevoir.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePrefs} className="space-y-6">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Vos préférences générales ont été enregistrées.
            </div>
          )}

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications par email
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Recevoir un email pour les demandes de congés à valider et les nouveaux rendez-vous.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailNotifs ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800" />

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications push (Navigateur)
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Afficher des notifications en temps réel dans votre navigateur pendant la session.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPushNotifs(!pushNotifs)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pushNotifs ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  pushNotifs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800" />

          {/* ───── Language Selection ───── */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Langue de l'interface
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Sélectionnez la langue d'affichage pour l'ensemble du tableau de bord.
                </p>
              </div>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full sm:max-w-xs mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            >
              <option value="fr-FR">Français (France) — Défaut</option>
              <option value="en-US">English (United States)</option>
              <option value="es-ES">Español (España)</option>
              <option value="ar-MA">العربية (Maroc / Maghreb)</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all"
            >
              <Save className="w-4 h-4" />
              Enregistrer les préférences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GeneralTab;
