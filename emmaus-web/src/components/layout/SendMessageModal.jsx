import React, { useState, useEffect } from 'react';
import { Send, X, MessageSquare, AlertCircle, Loader2, CheckCircle2, User } from 'lucide-react';
import { sendMessage } from '../../services/messageService';
import { useAuth } from '../auth/AuthProvider';
import { fetchCompanions } from '../../services/companionService';
import supabase from '../../services/supabaseClient';

/**
 * SendMessageModal — Quick modal to send short messages or alerts.
 * Dynamically loads recipients from profiles + compagnons tables.
 */
function SendMessageModal({ isOpen, onClose, defaultReceiverId, defaultReceiverName, onMessageSent }) {
  const { user, profile } = useAuth();
  const [receiverId, setReceiverId] = useState(defaultReceiverId || '');
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('message');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !defaultReceiverId) {
      loadRecipients();
    }
    if (isOpen && defaultReceiverId) {
      setReceiverId(defaultReceiverId);
    }
  }, [isOpen, defaultReceiverId]);

  /** Load all available recipients (profiles + compagnons) */
  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const list = [];

      // Fetch profiles (staff users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true });

      if (profiles) {
        profiles.forEach((p) => {
          if (p.id !== user?.id) {
            list.push({
              id: p.id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.id.slice(0, 8),
              type: 'staff',
            });
          }
        });
      }

      // Fetch compagnons
      const { data: comps } = await fetchCompanions();
      if (comps) {
        comps.forEach((c) => {
          // Avoid duplicates (some compagnons may also be in profiles)
          if (!list.find((r) => r.id === c.id)) {
            list.push({
              id: c.id,
              name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Compagnon',
              type: 'compagnon',
            });
          }
        });
      }

      setRecipients(list);
    } catch (err) {
      console.error('[SendMessageModal] loadRecipients error:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !receiverId) return;

    setSubmitting(true);
    setError(null);

    const senderName = profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : user?.email?.split('@')[0] || 'Équipe';

    const { error: sendErr } = await sendMessage({
      sender_id: user?.id || 'demo-admin-id',
      receiver_id: receiverId,
      content: content.trim(),
      type,
      sender_name: senderName,
    });

    setSubmitting(false);

    if (sendErr) {
      setError(sendErr.message || "Erreur lors de l'envoi du message.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setContent('');
      setReceiverId('');
      if (onMessageSent) onMessageSent();
      onClose();
    }, 1200);
  };

  const selectedRecipientName = defaultReceiverName
    || recipients.find((r) => r.id === receiverId)?.name
    || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Envoyer un message rapide
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Communication interne avec le compagnon ou l'équipe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Message envoyé avec succès !</span>
            </div>
          )}

          {/* Recipient selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Destinataire <span className="text-red-500">*</span>
            </label>
            {defaultReceiverId ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{defaultReceiverName || 'Destinataire sélectionné'}</span>
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  required
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-purple-500 transition-all"
                >
                  <option value="">
                    {loadingRecipients ? 'Chargement…' : 'Sélectionner un destinataire'}
                  </option>
                  {recipients.filter((r) => r.type === 'staff').length > 0 && (
                    <optgroup label="Équipe / Staff">
                      {recipients.filter((r) => r.type === 'staff').map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {recipients.filter((r) => r.type === 'compagnon').length > 0 && (
                    <optgroup label="Compagnons">
                      {recipients.filter((r) => r.type === 'compagnon').map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Message type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Type de communication
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('message')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'message'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message standard</span>
              </button>

              <button
                type="button"
                onClick={() => setType('alert')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'alert'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Alerte prioritaire</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Contenu du message
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez ici vos notes ou questions rapides..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            >
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim() || !receiverId}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{submitting ? 'Envoi...' : 'Envoyer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendMessageModal;
