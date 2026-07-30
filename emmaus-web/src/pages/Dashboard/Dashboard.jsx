import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, BookOpen, MessageSquare, TrendingUp, ArrowUpRight,
  ArrowRight, Clock, Plus, Activity, CheckCircle2, AlertCircle,
  UserPlus, Eye, Loader2, ChevronLeft, ChevronRight, UserCheck, Check,
} from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import {
  getDashboardStats,
  getRecentCompanions,
  getUpcomingAppointments,
} from '../../services/dashboardService';
import { fetchCompanions } from '../../services/companionService';
import { getAllAppointments } from '../../services/appointmentService';

/**
 * Dashboard — Main Tableau de bord for Emmaüs Connect.
 * High-fidelity pixel-perfect implementation matching reference design:
 * 1. Top Row: 4 KPI Cards (Total, Actifs, RDV, Formations) with dynamic metrics and loading indicators
 * 2. Middle Row: Planning hebdomadaire & Notifications list
 * 3. Bottom Row: Dynamic Répartition (custom conic-gradient doughnut), Activité hebdomadaire, & Compagnons récents
 */
/**
 * Helper to calculate current week's Monday-Sunday and French formatted header.
 */
function getWeekRangeAndDays(offsetWeeks = 0) {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + offsetWeeks * 7);

  const dayOfWeek = targetDate.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonthStr = monday.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonthStr = sunday.toLocaleDateString('fr-FR', { month: 'long' });
  const endYear = sunday.getFullYear();

  const weekHeader =
    startMonthStr === endMonthStr
      ? `Semaine du ${startDay} au ${endDay} ${endMonthStr} ${endYear}`
      : `Semaine du ${startDay} ${startMonthStr} au ${endDay} ${endMonthStr} ${endYear}`;

  const dayNamesFr = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const days = dayNamesFr.map((name, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateNum = String(d.getDate()).padStart(2, '0');
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    return {
      name,
      date: dateNum,
      fullDate: d.toISOString().split('T')[0],
      active: isToday && offsetWeeks === 0,
    };
  });

  return { weekHeader, days, monday, sunday };
}

function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [recentCompanions, setRecentCompanions] = useState([]);
  const [companionBreakdown, setCompanionBreakdown] = useState({
    total: 0,
    active: 0,
    paused: 0,
    inactive: 0,
    medical: 0,
    activePercent: 0,
  });
  const [appointmentsThisWeek, setAppointmentsThisWeek] = useState(0);
  const [appointmentsList, setAppointmentsList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsRes, compRes, aptsRes, recentRes] = await Promise.all([
          getDashboardStats(),
          fetchCompanions(),
          getAllAppointments(),
          getRecentCompanions(),
        ]);

        if (!isMounted) return;

        if (statsRes.data) {
          setStats(statsRes.data);
        }

        // Compute companions total and breakdown by status
        if (compRes.data && compRes.data.length > 0) {
          const total = compRes.data.length;
          let active = 0, paused = 0, inactive = 0, medical = 0;
          compRes.data.forEach((c) => {
            const st = (c.status || '').toLowerCase();
            if (st.includes('pause')) paused++;
            else if (st.includes('inactif') || st.includes('archiv')) inactive++;
            else if (st.includes('médical') || st.includes('sante')) medical++;
            else active++;
          });
          const activePercent = Math.round((active / (total || 1)) * 100);
          setCompanionBreakdown({
            total,
            active,
            paused,
            inactive,
            medical,
            activePercent,
          });
        }

        // Compute appointments this week and save full list for calendar
        if (aptsRes.data) {
          setAppointmentsList(aptsRes.data);
          const now = new Date();
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(now.getDate() + 7);
          const upcoming = aptsRes.data.filter((a) => {
            if (!a.appointment_date) return true;
            const d = new Date(a.appointment_date);
            return d >= now && d <= oneWeekFromNow;
          });
          setAppointmentsThisWeek(upcoming.length || 0);
        } else {
          setAppointmentsList([]);
          setAppointmentsThisWeek(0);
        }

        // Format recent companions list dynamically
        if (recentRes.data && recentRes.data.length > 0) {
          const formattedRecent = recentRes.data.map((c, idx) => {
            const fn = c.first_name || c.name || 'Compagnon';
            const ln = c.last_name || '';
            const initials = `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase();
            const dateStr = c.created_at
              ? new Date(c.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Récemment';

            const status = c.status || 'Actif';
            const colors = [
              'bg-blue-50 text-blue-600',
              'bg-emerald-50 text-emerald-600',
              'bg-amber-50 text-amber-600',
              'bg-purple-50 text-purple-600',
              'bg-rose-50 text-rose-600',
            ];
            const badgeColorMap = {
              'Actif': { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
              'En pause': { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
              'Suivi médical': { badge: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
              'Inactif': { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
            };
            const bColor = badgeColorMap[status] || badgeColorMap['Actif'];

            return {
              id: c.id || idx,
              name: `${fn} ${ln}`.trim(),
              date: dateStr,
              initials: initials || 'EC',
              avatarBg: colors[idx % colors.length],
              status,
              badgeColor: bColor.badge,
              dotColor: bColor.dot,
            };
          });
          setRecentCompanions(formattedRecent);
        }
      } catch (err) {
        console.error('Error loading dashboard dynamic data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Conic Gradient Doughnut string dynamically from real breakdown
  const totalC = companionBreakdown.total || 1;
  const actPct = Math.round((companionBreakdown.active / totalC) * 100);
  const pausePct = actPct + Math.round((companionBreakdown.paused / totalC) * 100);
  const inactPct = pausePct + Math.round((companionBreakdown.inactive / totalC) * 100);
  const doughnutStyle = {
    background: `conic-gradient(#2563eb 0% ${actPct}%, #f59e0b ${actPct}% ${pausePct}%, #94a3b8 ${pausePct}% ${inactPct}%, #8b5cf6 ${inactPct}% 100%)`,
  };

  // Dynamically calculate current week header and Monday-Sunday days based on weekOffset
  const { weekHeader, days: daysOfWeek } = React.useMemo(
    () => getWeekRangeAndDays(weekOffset),
    [weekOffset]
  );

  // Map real appointments data from appointmentService to the calendar grid
  const scheduleEvents = React.useMemo(() => {
    const eventsByDay = { LUN: [], MAR: [], MER: [], JEU: [], VEN: [], SAM: [], DIM: [] };
    const colors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-indigo-600',
    ];

    appointmentsList.forEach((apt, idx) => {
      if (!apt.appointment_date) return;
      const aptDate = new Date(apt.appointment_date);
      const dateStr = aptDate.toISOString().split('T')[0];

      const matchedDay = daysOfWeek.find((d) => d.fullDate === dateStr);
      if (matchedDay) {
        const timeStr = aptDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const comp = apt.compagnons;
        const compName = comp
          ? `${comp.first_name || ''} ${comp.last_name || ''}`.trim()
          : apt.companion_name || 'Rendez-vous';
        const spec = apt.specialty || apt.title || 'Consultation';

        eventsByDay[matchedDay.name].push({
          id: apt.id || idx,
          time: timeStr,
          title: `${compName} — ${spec}`,
          color: colors[idx % colors.length],
          text: 'text-white',
        });
      }
    });

    return eventsByDay;
  }, [appointmentsList, daysOfWeek]);

  const notificationsList = [];
  const displayedRecentCompanions = recentCompanions;

  const activityData = React.useMemo(() => {
    const counts = [
      { day: 'Lun', sessions: 0, rdv: 0 },
      { day: 'Mar', sessions: 0, rdv: 0 },
      { day: 'Mer', sessions: 0, rdv: 0 },
      { day: 'Jeu', sessions: 0, rdv: 0 },
      { day: 'Ven', sessions: 0, rdv: 0 },
      { day: 'Sam', sessions: 0, rdv: 0 },
      { day: 'Dim', sessions: 0, rdv: 0 },
    ];

    appointmentsList.forEach((apt) => {
      if (!apt.appointment_date) return;
      const d = new Date(apt.appointment_date);
      let dayIdx = d.getDay(); // 0 is Dimanche
      dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; // 0 is Lundi
      if (counts[dayIdx]) {
        counts[dayIdx].rdv += 1;
        counts[dayIdx].sessions += 1;
      }
    });

    return counts;
  }, [appointmentsList]);

  const hasActivityData = activityData.some((item) => item.rdv > 0 || item.sessions > 0);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => navigate('/compagnons')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              TOTAL COMPAGNONS
            </p>
            {loading ? (
              <div className="my-1 py-1">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5">
                {companionBreakdown.total || 0}
              </p>
            )}
            <p className="text-xs font-medium text-gray-400 dark:text-slate-400 mt-2">
              {stats?.trends?.companions || 'Base compagnons'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/compagnons')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              COMPAGNONS ACTIFS
            </p>
            {loading ? (
              <div className="my-1 py-1">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5">
                {companionBreakdown.active || 0}
              </p>
            )}
            <p className="text-xs font-medium text-gray-400 dark:text-slate-400 mt-2">
              {companionBreakdown.total > 0 ? `${companionBreakdown.activePercent}% du total` : '0% du total'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/rendez-vous')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              RDV CETTE SEMAINE
            </p>
            {loading ? (
              <div className="my-1 py-1">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5">
                {appointmentsThisWeek || 0}
              </p>
            )}
            <p className="text-xs font-medium text-gray-400 dark:text-slate-400 mt-2">
              {stats?.trends?.appointments || 'Semaine en cours'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/formations')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              FORMATIONS COMPLÉTÉES
            </p>
            {loading ? (
              <div className="my-1 py-1">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5">
                {stats?.activeFormations ?? 0}
              </p>
            )}
            <p className="text-xs font-medium text-gray-400 dark:text-slate-400 mt-2">
              {stats?.trends?.formations || 'Formations suivies'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {weekHeader}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Planning des activités</p>
            </div>
            <div className="flex items-center gap-2">
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors mr-1"
                >
                  Aujourd'hui
                </button>
              )}
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                title="Semaine précédente"
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                title="Semaine suivante"
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800 pb-4 text-center">
            {daysOfWeek.map((day) => (
              <div key={day.name} className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {day.name}
                </span>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${day.active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-700 dark:text-slate-300'}`}>
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          {Object.values(scheduleEvents).every((evs) => evs.length === 0) ? (
            <div className="py-10 text-center text-gray-400 dark:text-slate-500 text-xs">
              Aucune activité ou rendez-vous planifié pour cette semaine
            </div>
          ) : (
            <div className="grid grid-cols-7 pt-4 min-h-[90px] gap-2 items-start">
              {daysOfWeek.map((day) => {
                const events = scheduleEvents[day.name] || [];
                return (
                  <div key={day.name} className="space-y-2">
                    {events.map((ev, i) => (
                      <div key={i} className={`${ev.color} ${ev.text} p-2 rounded-xl text-left shadow-sm hover:opacity-90 transition-opacity cursor-pointer`}>
                        <p className="text-[10px] font-bold opacity-90 leading-tight">{ev.time}</p>
                        <p className="text-xs font-semibold truncate leading-tight mt-0.5">{ev.title}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
              {notificationsList.length > 0 ? `${notificationsList.length} nouvelles` : '0 nouvelle'}
            </span>
          </div>
          <div className="space-y-4 my-2 flex-1">
            {notificationsList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 dark:text-slate-500 text-xs">
                Aucune notification pour le moment
              </div>
            ) : (
              notificationsList.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.iconColor}`}>
                    {notif.type === 'alert' && <AlertCircle className="w-3.5 h-3.5" />}
                    {notif.type === 'check' && <Check className="w-3.5 h-3.5" />}
                    {notif.type === 'clock' && <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{notif.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{notif.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <span onClick={() => navigate('/notifications')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer block">Voir toutes les notifications &gt;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Répartition des compagnons</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? 'Chargement...' : `${companionBreakdown.total} compagnons au total`}
            </p>
          </div>
          {companionBreakdown.total === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs my-auto">
              Aucune donnée disponible
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 my-6">
              <div className="w-36 h-36 rounded-full relative flex items-center justify-center shrink-0 shadow-inner" style={doughnutStyle}>
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full shadow-sm" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-medium text-gray-600 dark:text-slate-300">Actifs</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : companionBreakdown.active}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium text-gray-600 dark:text-slate-300">En pause</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : companionBreakdown.paused}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="font-medium text-gray-600 dark:text-slate-300">Inactifs</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : companionBreakdown.inactive}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="font-medium text-gray-600 dark:text-slate-300">Suivi médical</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : companionBreakdown.medical}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Activité hebdomadaire</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sessions &amp; rendez-vous</p>
          </div>
          {!hasActivityData ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs my-auto">
              Aucune donnée disponible
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid grid-cols-7 gap-2 items-end h-32 pb-2 border-b border-gray-100 dark:border-slate-800">
                {activityData.map((item) => (
                  <div key={item.day} className="flex items-end justify-center gap-1 h-full">
                    <div className="w-2 sm:w-2.5 bg-blue-600 rounded-t-sm transition-all duration-300 hover:opacity-80" style={{ height: `${Math.min(100, item.sessions * 20)}%` }} />
                    <div className="w-2 sm:w-2.5 bg-blue-300 dark:bg-blue-500/50 rounded-t-sm transition-all duration-300 hover:opacity-80" style={{ height: `${Math.min(100, item.rdv * 20)}%` }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-medium mt-2">
                {activityData.map((item) => <span key={item.day}>{item.day}</span>)}
              </div>
            </div>
          )}
          <div className="flex items-center gap-5 mt-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" /><span className="text-xs font-medium text-gray-600 dark:text-slate-300">Sessions</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300 dark:bg-blue-500/50 shrink-0" /><span className="text-xs font-medium text-gray-600 dark:text-slate-300">RDV</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Compagnons récents</h3>
            <span onClick={() => navigate('/compagnons')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Voir tout &gt;</span>
          </div>
          <div className="space-y-3.5 flex-1">
            {loading ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-800" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 bg-gray-200 dark:bg-slate-800 rounded" />
                        <div className="h-2.5 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-12 bg-gray-200 dark:bg-slate-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : displayedRecentCompanions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 dark:text-slate-500 text-xs">
                Aucun compagnon pour le moment
              </div>
            ) : (
              displayedRecentCompanions.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => navigate('/compagnons')}
                  className="flex items-center justify-between py-1 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${comp.avatarBg}`}
                    >
                      {comp.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {comp.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{comp.date}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${comp.badgeColor}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${comp.dotColor}`} />
                    {comp.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div /> {/* spacing placeholder */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
