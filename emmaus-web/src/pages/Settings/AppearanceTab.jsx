import React, { useState, useEffect } from 'react';
import { Moon, Sun, Check } from 'lucide-react';

/**
 * AppearanceTab — Apparence settings tab.
 * Implements class-based dark mode with localStorage persistence and glassmorphic styling.
 */
function AppearanceTab() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check current state on mount
    const savedTheme = localStorage.getItem('theme');
    const hasDarkClass = document.documentElement.classList.contains('dark');
    if (savedTheme === 'dark' || (!savedTheme && hasDarkClass)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSetTheme = (newDark) => {
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ───── Theme Toggle Glassmorphic Card ───── */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-gray-200/80 dark:border-slate-800/80 p-7 shadow-lg transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-sm">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Mode sombre (Dark Mode)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Optimisez l'affichage pour réduire la fatigue oculaire dans les environnements peu éclairés.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => handleSetTheme(!isDark)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
            }`}
            aria-label="Basculer le mode sombre"
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ───── Visual Theme Selector Cards ───── */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-4">
            Sélectionner un thème d'affichage
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Preview Card */}
            <div
              onClick={() => handleSetTheme(false)}
              className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                !isDark
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-slate-800/80 shadow-md'
                  : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Thème Clair
                </span>
                {!isDark && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="h-16 rounded-xl bg-white border border-gray-200 p-2 space-y-1 shadow-inner">
                <div className="h-2 w-3/4 rounded bg-gray-200" />
                <div className="h-2 w-1/2 rounded bg-gray-100" />
              </div>
            </div>

            {/* Dark Mode Preview Card */}
            <div
              onClick={() => handleSetTheme(true)}
              className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                isDark
                  ? 'border-indigo-600 bg-indigo-900/20 dark:bg-slate-800 shadow-md'
                  : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Thème Sombre
                </span>
                {isDark && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="h-16 rounded-xl bg-slate-900 border border-slate-700 p-2 space-y-1 shadow-inner">
                <div className="h-2 w-3/4 rounded bg-slate-700" />
                <div className="h-2 w-1/2 rounded bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceTab;
