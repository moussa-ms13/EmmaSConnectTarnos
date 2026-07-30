import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Palette, Users, Sliders, Shield } from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import ProfileTab from './ProfileTab';
import AppearanceTab from './AppearanceTab';
import UserManagementTab from './UserManagementTab';
import GeneralTab from './GeneralTab';

/**
 * Settings — Account & Platform Settings Page.
 * Professional tabbed interface styled with signature dark-blue headers
 * and glassmorphic panels matching CompanionProfile.jsx.
 */
function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Admin visibility check (supports default admin in dev/demo)
  const roleName = profile?.roles?.name || profile?.role || 'admin';
  const isAdmin = roleName.toLowerCase() === 'admin';

  const tabs = [
    {
      id: 'profile',
      label: 'Mon Profil',
      icon: User,
      description: 'Informations personnelles et sécurité',
    },
    {
      id: 'appearance',
      label: 'Apparence',
      icon: Palette,
      description: "Mode sombre et thèmes d'affichage",
    },
    ...(isAdmin
      ? [
          {
            id: 'users',
            label: 'Gestion des utilisateurs',
            icon: Users,
            badge: 'Admin',
            description: 'Comptes et droits des encadrants',
          },
        ]
      : []),
    {
      id: 'general',
      label: 'Général',
      icon: Sliders,
      description: 'Notifications et langue',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ═══════════════════════════════════════════════════════
          SIGNATURE DARK-BLUE HEADER BANNER
          ═══════════════════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-8 shadow-xl text-white relative overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1a2f5a 100%)' }}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
              <SettingsIcon className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Paramètres & Configuration
              </h1>
              <p className="text-sm text-blue-200 mt-1 max-w-xl">
                Gérez vos informations de compte, l'apparence générale de la plateforme et vos préférences de notification.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold self-start sm:self-auto shadow-sm">
              <Shield className="w-4 h-4 text-purple-300" />
              <span>Privilèges Administrateur actifs</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          GLASSMORPHIC TAB NAVIGATION BAR
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB CONTENT AREA (GLASSMORPHIC PANELS)
          ═══════════════════════════════════════════════════════ */}
      <div className="pt-2 transition-all duration-200">
        {activeTab === 'profile' && <ProfileTab user={user} profile={profile} />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'users' && isAdmin && <UserManagementTab />}
        {activeTab === 'general' && <GeneralTab />}
      </div>
    </div>
  );
}

export default Settings;
