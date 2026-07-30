import React, { useState } from 'react';
import { Send, X, MessageSquare, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { sendMessage } from '../../services/messageService';
import { useAuth } from '../auth/AuthProvider';

/**
 * SendMessageModal — Quick modal to send short messages or alerts between staff and companions.
 */
function SendMessageModal({ isOpen, onClose, defaultReceiverId, defaultReceiverName, onMessageSent }) {
  const { user } = useAuth();
  const [receiverName, setReceiverName] = useState(defaultReceiverName || 'Ahmed Benali (Compagnon)');
  const [content, setContent] = useState('');
  const [type, setType] = useState('message');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error: sendErr } = await sendMessage({
      sender_id: user?.id || 'demo-admin-id',
      receiver_id: defaultReceiverId || 'demo-companion-id',
      content: content.trim(),
      type,
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
      if (onMessageSent) onMessageSent();
      onClose();
    }, 1200);
  };

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
              Message envoyé avec succès !
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Destinataire
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Nom ou email du destinataire..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
            />
          </div>

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
                Message standard
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
                Alerte prioritaire
              </button>
            </div>
          </div>

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
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendMessageModal;
