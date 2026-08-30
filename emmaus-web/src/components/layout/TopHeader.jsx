import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Search, User, LogOut, MessageSquare, AlertCircle, Plus, Check, X, Menu, ChevronDown, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getUnreadMessages, markMessageAsRead } from '../../services/messageService';
import { getNotificationCount } from '../../services/notificationService';
import { signOut } from '../../services/authService';
import SendMessageModal from './SendMessageModal';

/**
 * TopHeader — Top navigation bar for the authenticated area.
 * Updated to match pixel-perfect reference:
 * Left: "Tableau de bord" and dynamic French date greeting (e.g. "Bonjour Sophie — samedi 28 juin 2026")
 * Right: Notification bell with red dot badge and User avatar initials pill with interactive dropdown.
 */
function TopHeader({ onMenuClick = () => {} }) {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [readingMessage, setReadingMessage] = useState(null);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const emailName = user?.email ? user.email.split('@')[0] : 'Utilisateur';
  const displayName =
    (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) ||
    user?.user_metadata?.name ||
    emailName;

  const firstName = profile?.first_name || displayName.split(' ')[0] || 'Utilisateur';
  const lastInitial = profile?.last_name ? `${profile.last_name.charAt(0)}.` : '';
  const initials = (
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
      : displayName.slice(0, 2)
  ).toUpperCase();

  // Format today's date in French: e.g. "samedi 28 juin 2026"
  const todayFrench = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Dynamic header titles according to route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'Tableau de bord',
        subtitle: `Bonjour ${firstName} — ${todayFrench}`,
      };
    }
    if (path.startsWith('/compagnons')) {
      return {
        title: 'Compagnons',
        subtitle: 'Gestion et suivi des compagnons',
      };
    }
    if (path.startsWith('/sante')) {
      return {
        title: 'Santé',
        subtitle: 'Dossiers médicaux et consultations',
      };
    }
    if (path.startsWith('/rendez-vous')) {
      return {
        title: 'Rendez-vous',
        subtitle: 'Calendrier des consultations',
      };
    }
    if (path.startsWith('/formations')) {
      return {
        title: 'Formations',
        subtitle: 'Parcours et formations',
      };
    }
    if (path.startsWith('/documents')) {
      return {
        title: 'Documents',
        subtitle: 'Documentation et dossiers',
      };
    }
    if (path.startsWith('/realisations')) {
      return {
        title: 'Réalisations',
        subtitle: 'Accomplissements et succès',
      };
    }
    if (path.startsWith('/conges')) {
      return {
        title: 'Congés',
        subtitle: 'Gestion des congés',
      };
    }
    if (path.startsWith('/parametres')) {
      return {
        title: 'Paramètres',
        subtitle: 'Préférences du compte',
      };
    }
    return {
      title: 'Tableau de bord',
      subtitle: `Bonjour ${firstName} — ${todayFrench}`,
    };
  };

  const headerInfo = getHeaderInfo();

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showDropdown || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, showProfileMenu]);

  async function loadNotifications() {
    const { data } = await getUnreadMessages(user?.id);
    if (data) {
      setMessages(data);
    }
    // Also load pending DB notification count
    const count = await getNotificationCount(isAdmin, user?.id);
    setNotifCount(count);
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    await markMessageAsRead(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /** Open the read-message modal */
  const handleOpenMessage = async (msg) => {
    setReadingMessage(msg);
    setShowDropdown(false);
    // Mark as read immediately
    if (msg.id) {
      await markMessageAsRead(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    }
  };

  const badgeCount = messages.length + notifCount || 0;

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-20 px-6 sm:px-8 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 z-20 relative">
      {/* ───── Left: Hamburger (mobile) + Dynamic Title & Date Subtitle ───── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* ───── Right: Notifications Bell & User Avatar Pill ───── */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Notification Bell with red badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2.5 rounded-full text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications et messages"
          >
            <Bell className="w-5 h-5" />
            {badgeCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                {badgeCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/70">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {badgeCount > 0 ? `${badgeCount} nouvelle(s)` : 'Aucune nouvelle'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau message
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                {messages.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      <span>Aucune notification</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      <span>Vous êtes à jour !</span>
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderDisplay = m.sender
                      ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim()
                      : m.sender_name || 'Équipe Emmaüs Connect';
                    return (
                    <div
                      key={m.id}
                      onClick={() => handleOpenMessage({ ...m, senderDisplay })}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            m.type === 'alert'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {m.type === 'alert' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {senderDisplay}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                            {m.content}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(m.id, e)}
                        className="p-1 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shrink-0"
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar pill with interactive dropdown */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 hidden sm:inline-block">
              {firstName} {lastInitial}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:inline-block" />
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150 py-1.5">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {firstName} {profile?.last_name || ''}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {user?.email || 'Coordinateur Emmaüs Connect'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/parametres');
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Paramètres
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Send Message Modal */}
      <SendMessageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onMessageSent={loadNotifications}
      />

      {/* ───── Read Message Modal ───── */}
      {readingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  readingMessage.type === 'alert'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                }`}>
                  {readingMessage.type === 'alert' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {readingMessage.type === 'alert' ? 'Alerte' : 'Message'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    De {readingMessage.senderDisplay || readingMessage.sender_name || 'Équipe'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReadingMessage(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Reçu le {readingMessage.created_at
                  ? new Date(readingMessage.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {readingMessage.content}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Marqué comme lu</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setReadingMessage(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopHeader;
