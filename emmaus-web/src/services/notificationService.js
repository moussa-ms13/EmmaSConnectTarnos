import supabase from './supabaseClient';

/**
 * notificationService — Generates role-specific notification objects from the
 * vacations and appointments tables.
 *
 * Admin receives:  New pending leave requests + new pending appointment requests.
 * Viewer receives: Status changes on their own vacations/appointments.
 */

/**
 * Build a notification object from a vacation row.
 */
function vacationToNotif(vac, type) {
  const name =
    vac.requester
      ? `${vac.requester.first_name || ''} ${vac.requester.last_name || ''}`.trim()
      : 'Un utilisateur';

  const start = vac.start_date
    ? new Date(vac.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';

  if (type === 'admin_pending') {
    return {
      id: `vac-${vac.id}`,
      type: 'clock',
      category: 'Congés',
      unread: true,
      title: `Nouvelle demande de congé — ${name}`,
      description: `Du ${start}. En attente de validation.`,
      time: vac.created_at
        ? new Date(vac.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : '—',
    };
  }

  // user status change
  const statusLabel = vac.status === 'Approuvé' ? 'approuvée ✅' : 'refusée ❌';
  return {
    id: `vac-${vac.id}`,
    type: vac.status === 'Approuvé' ? 'check' : 'alert',
    category: 'Congés',
    unread: true,
    title: `Votre demande de congé a été ${statusLabel}`,
    description: `Période du ${start}.`,
    time: vac.updated_at
      ? new Date(vac.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '—',
  };
}

/**
 * Build a notification object from an appointment row.
 */
function appointmentToNotif(apt, type) {
  const compName =
    apt.compagnons
      ? `${apt.compagnons.first_name || ''} ${apt.compagnons.last_name || ''}`.trim()
      : 'Un compagnon';

  const aptDate = apt.appointment_date
    ? new Date(apt.appointment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';

  if (type === 'admin_pending') {
    return {
      id: `apt-${apt.id}`,
      type: 'clock',
      category: 'Rendez-vous',
      unread: true,
      title: `Nouvelle demande de RDV — ${compName}`,
      description: `${apt.specialty || 'Consultation'} le ${aptDate}. En attente de confirmation.`,
      time: apt.created_at
        ? new Date(apt.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : '—',
    };
  }

  return {
    id: `apt-${apt.id}`,
    type: apt.status === 'Confirmé' ? 'check' : 'alert',
    category: 'Rendez-vous',
    unread: true,
    title: `Votre RDV a été ${apt.status === 'Confirmé' ? 'confirmé ✅' : 'annulé ❌'}`,
    description: `${apt.specialty || 'Consultation'} le ${aptDate}.`,
    time: apt.updated_at
      ? new Date(apt.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '—',
  };
}

/**
 * Fetch notifications for Admin users.
 * Returns pending vacation requests + pending appointment requests.
 *
 * @returns {Promise<{ data: array, error: object | null }>}
 */
export async function fetchAdminNotifications() {
  try {
    const [vacRes, aptRes] = await Promise.all([
      supabase
        .from('vacations')
        .select('*, requester:profiles!requested_by(id, first_name, last_name)')
        .eq('status', 'En attente')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('appointments')
        .select('*, compagnons(id, first_name, last_name)')
        .eq('status', 'En attente')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const vacNotifs = (vacRes.data || []).map((v) => vacationToNotif(v, 'admin_pending'));
    const aptNotifs = (aptRes.data || []).map((a) => appointmentToNotif(a, 'admin_pending'));

    // Merge and sort by time descending (most recent first)
    const all = [...vacNotifs, ...aptNotifs].sort((a, b) =>
      (b.time || '').localeCompare(a.time || '')
    );

    return { data: all, error: null };
  } catch (err) {
    console.error('[notificationService] fetchAdminNotifications error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch notifications for Viewer/User users.
 * Returns their own approved/refused vacations and confirmed/cancelled appointments.
 *
 * @param {string} userId - The authenticated user's UUID
 * @returns {Promise<{ data: array, error: object | null }>}
 */
export async function fetchUserNotifications(userId) {
  if (!userId) return { data: [], error: null };

  try {
    const [vacRes, aptRes] = await Promise.all([
      supabase
        .from('vacations')
        .select('*')
        .eq('requested_by', userId)
        .in('status', ['Approuvé', 'Refusé'])
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('appointments')
        .select('*, compagnons(id, first_name, last_name)')
        .in('status', ['Confirmé', 'Annulé'])
        .order('updated_at', { ascending: false })
        .limit(15),
    ]);

    const vacNotifs = (vacRes.data || []).map((v) => vacationToNotif(v, 'user_status'));
    const aptNotifs = (aptRes.data || []).map((a) => appointmentToNotif(a, 'user_status'));

    const all = [...vacNotifs, ...aptNotifs].sort((a, b) =>
      (b.time || '').localeCompare(a.time || '')
    );

    return { data: all, error: null };
  } catch (err) {
    console.error('[notificationService] fetchUserNotifications error:', err);
    return { data: [], error: err };
  }
}

/**
 * Get a count of unread notifications (pending items for admin, status changes for user).
 * Lightweight: only fetches counts, not full rows.
 *
 * @param {boolean} isAdmin
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getNotificationCount(isAdmin, userId) {
  try {
    // Count unread rows from the notifications table
    let notifTableCount = 0;
    if (userId) {
      const notifRes = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('is_read', false);
      notifTableCount = notifRes.count || 0;
    }

    if (isAdmin) {
      const [vacRes, aptRes] = await Promise.all([
        supabase
          .from('vacations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'En attente'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'En attente'),
      ]);
      return (vacRes.count || 0) + (aptRes.count || 0) + notifTableCount;
    } else {
      if (!userId) return notifTableCount;
      const vacRes = await supabase
        .from('vacations')
        .select('id', { count: 'exact', head: true })
        .eq('requested_by', userId)
        .in('status', ['Approuvé', 'Refusé']);
      return (vacRes.count || 0) + notifTableCount;
    }
  } catch {
    return 0;
  }
}

/**
 * Fetch all notifications from the notifications table for a user.
 * Used by the bell dropdown and /notifications page.
 */
export async function fetchNotificationsForUser(userId) {
  if (!userId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    return { data: data || [], error };
  } catch (err) {
    console.error('[notificationService] fetchNotificationsForUser error:', err);
    return { data: [], error: err };
  }
}

/**
 * Mark a notification as read in the notifications table.
 */
export async function markNotificationAsRead(notifId) {
  if (!notifId) return { error: null };
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

