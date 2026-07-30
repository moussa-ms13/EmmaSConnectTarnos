import React, { useState } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, Clock, Info, Trash2,
  Check, Filter, Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ALERT
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, unread: false }))
    );
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'UNREAD' && !notif.unread) return false;
    if (filter === 'ALERT' && notif.type !== 'alert') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = (notif.title || '').toLowerCase().includes(q);
      const inDesc = (notif.description || '').toLowerCase().includes(q);
      const inCat = (notif.category || '').toLowerCase().includes(q);
      return inTitle || inDesc || inCat;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;
  const alertCount = notifications.filter((n) => n.type === 'alert').length;

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return {
          icon: AlertTriangle,
          bg: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        };
      case 'check':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        };
      case 'clock':
        return {
          icon: Clock,
          bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        };
      default:
        return {
          icon: Info,
          bg: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* ───── Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Centre de notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Consultez et gérez l'ensemble des alertes et rappels de votre communauté.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marquer tout comme lu
          </button>
        )}
      </div>

      {/* ───── Filters & Search Bar ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 ${
              filter === 'UNREAD'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            Non lues ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ALERT')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 ${
              filter === 'ALERT'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            Urgentes ({alertCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une notification..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* ───── Notifications List ───── */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center shadow-sm">
          <Bell className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-white">
            Aucune notification pour le moment
          </h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Vous n'avez aucune nouvelle alerte ou notification en attente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const iconConfig = getIcon(notif.type);
            const IconComponent = iconConfig.icon;

            return (
              <div
                key={notif.id}
                className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  notif.unread
                    ? 'border-blue-200 dark:border-blue-800/60 shadow-sm bg-blue-50/20 dark:bg-blue-900/10'
                    : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconConfig.bg}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                        {notif.category}
                      </span>
                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium ml-auto">
                        {notif.time}
                      </span>
                    </div>

                    <h3
                      className={`text-sm mt-1.5 ${
                        notif.unread
                          ? 'font-bold text-gray-900 dark:text-white'
                          : 'font-semibold text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.unread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Marquer comme lu"
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-center transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id)}
                    title="Supprimer la notification"
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Notifications;
