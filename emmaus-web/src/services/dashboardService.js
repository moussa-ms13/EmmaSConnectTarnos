import supabase from './supabaseClient';

/**
 * dashboardService — Aggregates KPIs, recent activities, and metrics for the Dashboard.
 * Strictly queries Supabase tables with zero mock/fallback data.
 */

/**
 * Fetch aggregated dashboard statistics and KPIs.
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function getDashboardStats() {
  try {
    // 1. Total companions
    const { count: companionsCount } = await supabase
      .from('compagnons')
      .select('*', { count: 'exact', head: true });

    // 2. Upcoming appointments (date >= today)
    const today = new Date().toISOString().split('T')[0];
    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today);

    // 3. Formations
    const { count: formationsCount } = await supabase
      .from('formations')
      .select('*', { count: 'exact', head: true });

    // 4. Unread messages
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    const data = {
      totalCompanions: companionsCount || 0,
      upcomingAppointments: appointmentsCount || 0,
      activeFormations: formationsCount || 0,
      unreadMessages: unreadCount || 0,
      trends: null,
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      data: {
        totalCompanions: 0,
        upcomingAppointments: 0,
        activeFormations: 0,
        unreadMessages: 0,
        trends: null,
      },
      error,
    };
  }
}

/**
 * Fetch last 5 recently registered companions.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getRecentCompanions() {
  try {
    const { data, error } = await supabase
      .from('compagnons')
      .select('id, first_name, last_name, avatar_url, profession, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data) {
      return { data: [], error: error || null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recent companions:', error);
    return { data: [], error };
  }
}

/**
 * Fetch next 5 upcoming appointments with companion details.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getUpcomingAppointments() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('id, title, appointment_date, appointment_time, status, type, compagnons(id, first_name, last_name)')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .limit(5);

    if (error || !data) {
      return { data: [], error: error || null };
    }

    const formatted = data.map((item) => ({
      ...item,
      companion_name: item.compagnons
        ? `${item.compagnons.first_name || ''} ${item.compagnons.last_name || ''}`.trim()
        : 'Compagnon non spécifié',
    }));

    return { data: formatted, error: null };
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return { data: [], error };
  }
}

