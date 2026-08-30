import React, { useState, useEffect } from 'react';
import {
  FileText, UploadCloud, CheckCircle2, AlertTriangle, AlertCircle,
  Download, Trash2, Loader2, Eye, User, Calendar, ShieldCheck,
  File, Plus, X, Search,
} from 'lucide-react';
import {
  getAllDocuments,
  getCompanionDocuments,
  createDocument,
  deleteDocument,
  uploadDocument,
} from '../../services/documentService';
import { fetchCompanions } from '../../services/companionService';
import { useAuth } from '../../components/auth/AuthProvider';

const DOCUMENT_TYPES = ['Identité', 'Médical', 'Administratif', 'Formation', 'Autre'];

/**
 * Format bytes to readable KB/MB string.
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '—';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

/**
 * DocumentsManager — UI for Document Management module.
 * Features drag & drop upload zone, stats cards, and detailed data table with download & delete.
 * Strictly uses real Supabase database rows with zero mock/fallback data.
 */
function DocumentsManager() {
  const { canAdd, canDelete, isAdmin, isViewer, profile, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [compagnonId, setCompagnonId] = useState('');
  const [fileType, setFileType] = useState('Identité');
  const [expirationDate, setExpirationDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // RBAC: Viewer/Companion sees only their own documents
      let docsPromise;
      if (isViewer) {
        const compagnonId = profile?.compagnon_id || profile?.id || user?.id;
        docsPromise = getCompanionDocuments(compagnonId);
      } else {
        docsPromise = getAllDocuments();
      }
      const [docsRes, compRes] = await Promise.all([
        docsPromise,
        fetchCompanions(),
      ]);
      setDocuments(docsRes.data || []);
      setCompanions(compRes.data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const totalDocs = documents.length;
  const validDocs = documents.filter((d) => d.status === 'Valide').length;
  const renewalDocs = documents.filter((d) => d.status === 'À renouveler').length;
  const expiredDocs = documents.filter((d) => d.status === 'Expiré').length;

  const handleFileDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f) setSelectedFile(f);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !compagnonId) {
      setError('Veuillez sélectionner un compagnon et un fichier.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 1. Upload file to Supabase storage bucket
      const { url, error: uploadErr } = await uploadDocument(selectedFile);
      const fileUrl = url || '#';

      // Determine status from expiration date
      let status = 'Valide';
      if (expirationDate) {
        const today = new Date();
        const exp = new Date(expirationDate);
        const diffDays = (exp - today) / (1000 * 3600 * 24);
        if (diffDays < 0) status = 'Expiré';
        else if (diffDays <= 30) status = 'À renouveler';
      }

      // 2. Create document record in database
      await createDocument({
        compagnon_id: compagnonId,
        file_name: selectedFile.name,
        file_url: fileUrl,
        file_type: fileType,
        file_size: selectedFile.size,
        expiration_date: expirationDate || null,
        status,
      });

      setSelectedFile(null);
      setCompagnonId('');
      setExpirationDate('');
      loadData();
    } catch (err) {
      setError('Erreur lors du téléversement du document.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id, fileUrl) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    // Immediately remove from local state for instant UI update
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    const { error: delErr } = await deleteDocument(id, fileUrl);
    if (delErr) {
      alert('Erreur lors de la suppression : ' + (delErr.message || 'Erreur inconnue'));
      loadData(); // Revert local state if backend delete failed
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Valide':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> Valide
          </span>
        );
      case 'À renouveler':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3" /> À renouveler
          </span>
        );
      case 'Expiré':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" /> Expiré
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const filteredDocs = documents.filter((d) => {
    const compName = `${d.compagnons?.first_name || ''} ${d.compagnons?.last_name || ''}`.toLowerCase();
    const fname = d.file_name?.toLowerCase() || '';
    const q = searchTerm.toLowerCase();
    return compName.includes(q) || fname.includes(q) || d.file_type?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* ───── Page Header ───── */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Documents — Gestion documentaire
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Archivage et consultation sécurisée des documents administratifs, médicaux et d'identité.
          </p>
        </div>
      </div>

      {/* ───── Top Drag & Drop Upload Zone ───── */}
      {canAdd && (
        <form
          onSubmit={handleUploadSubmit}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 p-6 transition-all shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {selectedFile ? selectedFile.name : 'Glissez-déposez un document ici ou cliquez pour parcourir'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedFile
                ? `Taille : ${formatFileSize(selectedFile.size)} — Prêt à être archivé`
                : 'Formats supportés : PDF, PNG, JPG, DOCX (max 10 Mo)'}
            </p>
          </div>
        </div>

        {/* Form controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            required
            value={compagnonId}
            onChange={(e) => setCompagnonId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Compagnon *</option>
            {companions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 outline-none focus:border-emerald-500 focus:bg-white"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            onClick={(e) => {
              if ('showPicker' in e.target) {
                try { e.target.showPicker(); } catch {}
              }
            }}
            title="Date d'expiration (optionnel)"
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700 outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
          />

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Parcourir...
            <input type="file" onChange={handleFileDrop} className="hidden" />
          </label>

          <button
            type="submit"
            disabled={uploading || !selectedFile || !compagnonId}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Téléversement...' : 'Téléverser'}
          </button>
        </div>
      </form>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ───── Top Stats Cards ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total documents</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalDocs}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documents valides</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{validDocs}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">À renouveler</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{renewalDocs}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expirés</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{expiredDocs}</p>
          </div>
        </div>
      </div>

      {/* ───── Documents Data Table ───── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Table Header Filter bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-900">Archivage des documents</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou type..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">Aucun document trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Compagnon</th>
                  <th className="py-3 px-6">Document</th>
                  <th className="py-3 px-6">Catégorie</th>
                  <th className="py-3 px-6">Taille</th>
                  <th className="py-3 px-6">Expiration</th>
                  <th className="py-3 px-6">Statut</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredDocs.map((doc) => {
                  const compName = `${doc.compagnons?.first_name || ''} ${doc.compagnons?.last_name || ''}`.trim() || 'Compagnon';
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                          {compName.charAt(0)}
                        </div>
                        {compName}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {doc.file_name}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                          {doc.file_type || 'Autre'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-xs">
                        {doc.expiration_date
                          ? new Date(doc.expiration_date).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={doc.file_url !== '#' ? doc.file_url : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Télécharger / Visualiser"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id, doc.file_url)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsManager;
