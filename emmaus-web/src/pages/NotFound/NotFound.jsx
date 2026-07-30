import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
        <AlertCircle className="w-10 h-10" />
      </div>

      <h1 className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight">
        404
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-200 mt-4">
        Page introuvable
      </h2>

      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
        La page que vous recherchez n'existe pas, a été déplacée ou est temporairement inaccessible.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Page précédente
        </button>

        <button
          type="button"
          onClick={() => navigate('/tableau-de-bord')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Home className="w-4 h-4" />
          Tableau de bord
        </button>
      </div>
    </div>
  );
}

export default NotFound;
