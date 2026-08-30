import supabase from './supabaseClient';

/**
 * messageService — Handles communications, messages, and notifications
 * between staff members and companions.
 */

const DEMO_MESSAGES = [
  {
    id: 'msg-1',
    sender_id: 'demo-admin-id',
    receiver_id: 'current-user',
    content: 'Votre demande de congé pour août a été validée par la coordination.',
    is_read: false,
    type: 'alert',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    sender_name: 'Coordination Emmaüs Connect',
  },
  {
    id: 'msg-2',
    sender_id: 'demo-companion-id',
    receiver_id: 'current-user',
    content: 'Bonjour Sophie, mon rendez-vous de mardi est confirmé. Merci !',
    is_read: false,
    type: 'message',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    sender_name: 'Ahmed Benali (Compagnon)',
  },
  {
    id: 'msg-3',
    sender_id: 'demo-admin-id',
    receiver_id: 'current-user',
    content: 'Rappel : Réunion débriefing plannings à 14h00 en salle 2.',
    is_read: true,
    type: 'alert',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    sender_name: 'Sophie Renaud',
  },
];

/**
 * Fetch messages for the specified user (both sent and received).
 * @param {string} userId
 * @returns {Promise<{ data: array, error: object | null }>}
 */
export async function getUserMessages(userId) {
  try {
    if (!userId) {
      return { data: DEMO_MESSAGES, error: null };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(first_name, last_name)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { data: DEMO_MESSAGES, error: error || null };
    }

    return { data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in getUserMessages:', err);
    return { data: DEMO_MESSAGES, error: null };
  }
}

/**
 * Fetch unread messages for a specific receiver.
 * @param {string} userId
 * @returns {Promise<{ data: array, error: object | null }>}
 */
export async function getUnreadMessages(userId) {
  try {
    if (!userId) {
      const unreadDemo = DEMO_MESSAGES.filter((m) => !m.is_read);
      return { data: unreadDemo, error: null };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(first_name, last_name)')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const unreadDemo = DEMO_MESSAGES.filter((m) => !m.is_read);
      return { data: unreadDemo, error: null };
    }

    return { data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in getUnreadMessages:', err);
    return { data: DEMO_MESSAGES.filter((m) => !m.is_read), error: null };
  }
}

/**
 * Send a new message or alert.
 * @param {object} payload - { sender_id, receiver_id, content, type }
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function sendMessage(payload) {
  try {
    const messageData = {
      sender_id: payload.sender_id,
      receiver_id: payload.receiver_id,
      content: payload.content,
      type: payload.type || 'message',
      is_read: false,
      sender_name: payload.sender_name || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('⚠️ Error inserting message:', error.message);
      // Fallback in demo mode
      return {
        data: { ...messageData, id: `msg-${Date.now()}` },
        error: null,
      };
    }

    // Immediately dispatch notification row to notifications table for recipient
    try {
      const notifData = {
        user_id: payload.receiver_id,
        receiver_id: payload.receiver_id,
        sender_id: payload.sender_id,
        type: payload.type || 'message',
        title: payload.sender_name
          ? `Message de ${payload.sender_name}`
          : (payload.type === 'alert' ? 'Alerte prioritaire' : 'Nouveau message'),
        content: payload.content,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      await supabase
        .from('notifications')
        .insert([notifData]);
    } catch (notifErr) {
      console.warn('⚠️ Could not insert notification row:', notifErr?.message || notifErr);
    }

    return { data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in sendMessage:', err);
    return {
      data: {
        id: `msg-${Date.now()}`,
        ...payload,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

/**
 * Mark a message as read.
 * @param {string} messageId
 * @returns {Promise<{ error: object | null }>}
 */
export async function markMessageAsRead(messageId) {
  try {
    if (messageId && messageId.startsWith('msg-')) {
      // Local demo message
      return { error: null };
    }

    const [msgRes, notifRes] = await Promise.all([
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId),
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', messageId),
    ]);

    return { error: msgRes.error || notifRes.error || null };
  } catch (err) {
    console.error('❌ Error in markMessageAsRead:', err);
    return { error: err };
  }
}
