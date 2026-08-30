import React, { useState, useEffect } from 'react';
import { Send, X, MessageSquare, AlertCircle, Loader2, CheckCircle2, User, Users } from 'lucide-react';
import { sendMessage } from '../../services/messageService';
import { useAuth } from '../auth/AuthProvider';
import { fetchCompanions } from '../../services/companionService';
import supabase from '../../services/supabaseClient';

/**
 * SendMessageModal — Quick modal to send messages to one or multiple recipients.
 * Dynamically loads ALL profiles + compagnons as recipients.
 * Supports multi-select via checkboxes.
 */
function SendMessageModal({ isOpen, onClose, defaultReceiverId, defaultReceiverName, onMessageSent }) {
  const { user, profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('message');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultReceiverId) {
        setSelectedIds([defaultReceiverId]);
      } else {
        setSelectedIds([]);
      }
      loadRecipients();
    }
  }, [isOpen, defaultReceiverId]);

  /** Load ALL available recipients unconditionally */
  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const list = [];
      const seenIds = new Set();

      // Fetch profiles (staff users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true });

      if (profiles) {
        profiles.forEach((p) => {
          if (p.id !== user?.id && !seenIds.has(p.id)) {
            seenIds.add(p.id);
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
          const targetId = c.user_id || c.id;
          if (!seenIds.has(targetId) && targetId !== user?.id) {
            seenIds.add(targetId);
            list.push({
              id: targetId,
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

  const toggleRecipient = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const filtered = getFilteredRecipients();
    const allIds = filtered.map((r) => r.id);
    setSelectedIds((prev) => {
      const combined = new Set([...prev, ...allIds]);
      return [...combined];
    });
  };

  const deselectAll = () => setSelectedIds([]);

  const getFilteredRecipients = () => {
    if (!searchQuery.trim()) return recipients;
    const q = searchQuery.toLowerCase();
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || selectedIds.length === 0) return;

    setSubmitting(true);
    setError(null);

    const senderName = profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : user?.email?.split('@')[0] || 'Équipe';

    const { error: sendErr } = await sendMessage({
      sender_id: user?.id,
      receiver_ids: selectedIds,
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
      setSelectedIds([]);
      setSearchQuery('');
      if (onMessageSent) onMessageSent();
      onClose();
    }, 1200);
  };

  const filteredRecipients = getFilteredRecipients();
  const staffList = filteredRecipients.filter((r) => r.type === 'staff');
  const compList = filteredRecipients.filter((r) => r.type === 'compagnon');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                <span>Envoyer un message rapide</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                <span>Sélectionnez un ou plusieurs destinataires</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Message envoyé à {selectedIds.length} destinataire(s) !</span>
            </div>
          )}

          {/* Recipients multi-select */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              <span>Destinataires</span> <span className="text-red-500">*</span>
              {selectedIds.length > 0 && (
                <span className="ml-2 text-purple-600 dark:text-purple-400 normal-case">
                  ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})
                </span>
              )}
            </label>

            {defaultReceiverId ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{defaultReceiverName || 'Destinataire sélectionné'}</span>
              </div>
            ) : (
              <>
                {/* Search + Select all */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                  />
                  <button type="button" onClick={selectAll} className="px-2 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-100 transition-colors">
                    <span>Tout</span>
                  </button>
                  <button type="button" onClick={deselectAll} className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 text-[10px] font-bold hover:bg-gray-200 transition-colors">
                    <span>Aucun</span>
                  </button>
                </div>

                {/* Scrollable checklist */}
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl divide-y divide-gray-100 dark:divide-slate-800">
                  {loadingRecipients ? (
                    <div className="p-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Chargement…</span>
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="p-3 text-xs text-gray-400 text-center">
                      <span>Aucun destinataire trouvé</span>
                    </div>
                  ) : (
                    <>
                      {staffList.length > 0 && (
                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <span>Équipe / Staff</span>
                        </div>
                      )}
                      {staffList.map((r) => (
                        <label key={r.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleRecipient(r.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-800 dark:text-slate-200">{r.name}</span>
                        </label>
                      ))}
                      {compList.length > 0 && (
                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <span>Compagnons</span>
                        </div>
                      )}
                      {compList.map((r) => (
                        <label key={r.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleRecipient(r.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs text-gray-800 dark:text-slate-200">{r.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              <span>Type de communication</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('message')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'message'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message standard</span>
              </button>
              <button type="button" onClick={() => setType('alert')}
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
              <span>Contenu du message</span>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim() || selectedIds.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{submitting ? 'Envoi...' : `Envoyer${selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendMessageModal;
