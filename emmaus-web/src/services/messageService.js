import supabase from './supabaseClient';

/**
 * messageService — Handles communications, messages, and notifications
 * between staff members and companions.
 * NO mock/demo data. Real Supabase only.
 */

/**
 * Fetch messages for the specified user (both sent and received).
 * Uses sender_name column directly — no FK join to profiles.
 */
export async function getUserMessages(userId) {
  if (!userId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (err) {
    console.error('[messageService] getUserMessages error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch unread messages for a specific receiver.
 */
export async function getUnreadMessages(userId) {
  if (!userId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (err) {
    console.error('[messageService] getUnreadMessages error:', err);
    return { data: [], error: err };
  }
}

/**
 * Send a message to ONE or MULTIPLE recipients.
 * @param {object} payload - { sender_id, receiver_ids (array), content, type, sender_name }
 * If receiver_id (string) is provided instead of receiver_ids, wraps it.
 */
export async function sendMessage(payload) {
  const receiverIds = payload.receiver_ids
    || (payload.receiver_id ? [payload.receiver_id] : []);

  if (receiverIds.length === 0) {
    return { data: null, error: new Error('Aucun destinataire sélectionné.') };
  }

  const results = [];
  const errors = [];

  for (const rid of receiverIds) {
    try {
      const messageData = {
        sender_id: payload.sender_id,
        receiver_id: rid,
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
        console.warn(`[messageService] insert message for ${rid}:`, error.message);
        errors.push(error);
      } else {
        results.push(data);
      }

      // Dispatch notification row for recipient
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: rid,
            receiver_id: rid,
            sender_id: payload.sender_id,
            type: payload.type || 'message',
            title: payload.sender_name
              ? `Message de ${payload.sender_name}`
              : (payload.type === 'alert' ? 'Alerte prioritaire' : 'Nouveau message'),
            content: payload.content,
            is_read: false,
          }]);
      } catch (notifErr) {
        console.warn('[messageService] notification insert failed:', notifErr?.message);
      }
    } catch (err) {
      console.error(`[messageService] sendMessage to ${rid}:`, err);
      errors.push(err);
    }
  }

  return {
    data: results.length > 0 ? results : null,
    error: errors.length > 0 ? errors[0] : null,
  };
}

/**
 * Mark a message as read. Also marks corresponding notification.
 */
export async function markMessageAsRead(messageId) {
  if (!messageId) return { error: null };

  try {
    const [msgRes] = await Promise.all([
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId),
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', messageId)
        .then(() => {}) // ignore notifications error silently
        .catch(() => {}),
    ]);

    return { error: msgRes.error || null };
  } catch (err) {
    console.error('[messageService] markMessageAsRead error:', err);
    return { error: err };
  }
}
