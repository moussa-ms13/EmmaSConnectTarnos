import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Heart,
  Calendar,
  BookOpen,
  FileText,
  Award,
  Palmtree,
  Settings,
  LogOut,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { fetchCompanions } from '../../services/companionService';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllDocuments } from '../../services/documentService';
import supabase from '../../services/supabaseClient';

/**
 * Sidebar — Fixed vertical navigation for the Emmaüs Connect platform.
 * Desktop: auto-collapses on navigation (icon-only, w-[72px]).
 *           Expands to w-[260px] on mouse hover.
 * Mobile: full drawer via mobileOpen prop.
 * Dynamically renders links based on the user's role (Staff/Admin vs. Compagnon).
 */

function Sidebar({ mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isCompagnon, isViewer, roleName, signOut } = useAuth();

  // ── Desktop collapse state ──────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse whenever the route changes
  useEffect(() => {
    setCollapsed(true);
  }, [location.pathname]);

  // ── Badge counts ────────────────────────────────────────────
  const [companionsCount, setCompanionsCount] = useState(null);
  const [appointmentsCount, setAppointmentsCount] = useState(null);
  const [documentsCount, setDocumentsCount] = useState(null);
  const [loadingBadges, setLoadingBadges] = useState(true);

  const handleLogout = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onClose) onClose();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during logout:', err);
    }
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let isMounted = true;
    async function loadBadgeCounts() {
      setLoadingBadges(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [compRes, aptsRes, docsRes] = await Promise.all([
          fetchCompanions(),
          getAllAppointments(),
          getAllDocuments(),
        ]);

        if (!isMounted) return;

        setCompanionsCount(compRes.data?.length ?? 0);

        if (aptsRes.data) {
          const upcoming = aptsRes.data.filter(
            (a) => !a.appointment_date || a.appointment_date >= today
          );
          setAppointmentsCount(upcoming.length);
        } else {
          setAppointmentsCount(0);
        }

        setDocumentsCount(docsRes.data?.length ?? 0);
      } catch (err) {
        console.error('Error fetching sidebar badge counts:', err);
        if (isMounted) {
          setCompanionsCount(0);
          setAppointmentsCount(0);
          setDocumentsCount(0);
        }
      } finally {
        if (isMounted) setLoadingBadges(false);
      }
    }

    loadBadgeCounts();
    return () => { isMounted = false; };
  }, []);

  // ── Dynamic Navigation based on Role ─────────────────────
  const companionNavItems = [
    { to: `/compagnons/${profile?.id || user?.id || 'demo'}`, label: 'Profile', icon: User },
    { to: '/rendez-vous', label: 'Mes RDV', icon: Calendar },
    { to: '/formations', label: 'Formations', icon: BookOpen },
    { to: '/documents', label: 'Mes Documents', icon: FileText },
    { to: '/realisations', label: 'Mes Réalisations', icon: Award },
    { to: '/conges', label: 'Congés', icon: Palmtree },
  ];

  const staffNavItems = [
    { to: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/compagnons', label: 'Compagnons', icon: Users, badge: loadingBadges ? <Loader2 className="w-3 h-3 animate-spin" /> : companionsCount },
    { to: '/sante', label: 'Santé', icon: Heart },
    { to: '/rendez-vous', label: 'Rendez-vous', icon: Calendar, badge: loadingBadges ? <Loader2 className="w-3 h-3 animate-spin" /> : appointmentsCount },
    { to: '/formations', label: 'Formations', icon: BookOpen },
    { to: '/documents', label: 'Documents', icon: FileText, badge: loadingBadges ? <Loader2 className="w-3 h-3 animate-spin" /> : documentsCount },
    { to: '/realisations', label: 'Réalisations', icon: Award },
    { to: '/conges', label: 'Vacances', icon: Palmtree },
  ];

  const navItems = isCompagnon || isViewer ? companionNavItems : staffNavItems;

  // ── Nav link class helper ─────────────────────────────────
  const getLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  // ── Shared sidebar content ────────────────────────────────
  const sidebarContent = (isDesktop = false) => (
    <>
      {/* ───── Logo & Branding ───── */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          {/* Hide text when collapsed on desktop */}
          <div className={`overflow-hidden transition-all duration-300 ${isDesktop && collapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>
            <h1 className="text-base font-bold tracking-tight leading-tight whitespace-nowrap">Emmaüs Connect</h1>
            <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">Tarnos — 40220</p>
          </div>
        </div>
        {!isDesktop && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ───── Main Navigation ───── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/tableau-de-bord' || to.startsWith('/compagnons/')}
            onClick={() => {
              if (onClose) onClose();
            }}
            className={getLinkClass}
            title={isDesktop && collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span
              className={`flex-1 overflow-hidden transition-all duration-300 whitespace-nowrap ${isDesktop && collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'
                }`}
            >
              {label}
            </span>
            {badge !== undefined && badge !== null && !collapsed && (
              <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded-full min-w-[22px] flex items-center justify-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ───── Account Section ───── */}
      <div className="px-3 pb-5 space-y-0.5 shrink-0">
        <p
          className={`text-[10px] font-semibold tracking-widest text-slate-500 uppercase px-3 mb-1.5 transition-all duration-300 ${isDesktop && collapsed ? 'opacity-0' : 'opacity-100'
            }`}
        >
          Compte
        </p>
        {!isCompagnon && (
          <NavLink
            to="/parametres"
            onClick={() => onClose && onClose()}
            className={getLinkClass}
            title={isDesktop && collapsed ? 'Paramètres' : undefined}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span
              className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isDesktop && collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'
                }`}
            >
              Paramètres
            </span>
          </NavLink>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 hover:bg-white/10 hover:text-white text-left"
          title={isDesktop && collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span
            className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isDesktop && collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'
              }`}
          >
            Déconnexion
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ───── Desktop Sidebar ───── */}
      <aside
        className={`hidden lg:flex h-screen bg-sidebar text-white flex-col shrink-0 transition-all duration-300 overflow-hidden ${collapsed ? 'w-[72px]' : 'w-[260px]'
          }`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        {sidebarContent(true)}
      </aside>

      {/* ───── Mobile Drawer ───── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative w-[260px] h-screen bg-sidebar text-white flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
