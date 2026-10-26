import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Files, Upload, Search, Filter, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { Document } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const navigate = useNavigate();

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Investigation Report');
  const [caseId, setCaseId] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({
        search,
        documentType: typeFilter,
      });
      setDocuments(res.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    api.getCases().then(res => setCases(res.cases || []));
  }, [search, typeFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('documentType', docType);
      if (caseId) formData.append('caseId', caseId);
      if (rawText) formData.append('extractedText', rawText);
      if (selectedFile) formData.append('file', selectedFile);

      await api.uploadDocument(formData);
      setUploadModalOpen(false);
      setDocTitle('');
      setRawText('');
      setSelectedFile(null);
      fetchDocs();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Files className="h-5 w-5 text-cyan-400" />
            <span>DOCUMENT REPOSITORY & EVIDENCE ARCHIVE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            OCR-scanned filings, forensic certificates, court orders, and SHA-256 verified evidentiary records.
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Upload className="h-4 w-4" />
          <span>Upload & Ingest Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-graphite-800 bg-graphite-900/80 p-3 shadow-md">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search document number, title, or full OCR content..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Document Types</option>
          <option value="FIR Report">FIR Report</option>
          <option value="Forensic Report">Forensic Report</option>
          <option value="Witness Statement">Witness Statement</option>
          <option value="Investigation Report">Investigation Report</option>
          <option value="Court Order">Court Order</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Document Indexes & Integrity Hashes...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            No matching documents found in repository.
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => navigate(`/documents/${doc.id}`)}
              className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">{doc.documentNumber}</span>
                  <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {doc.documentType}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">
                  {doc.title}
                </h3>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {doc.extractedText || 'No OCR extracted content available.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-graphite-800/80 text-[10px] font-mono flex items-center justify-between text-slate-500">
                <span className="text-emerald-400 font-semibold">SHA-256 VALID</span>
                <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-all flex items-center">
                  <span>Inspect</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono flex items-center space-x-2">
                <Upload className="h-4 w-4 text-cyan-400" />
                <span>UPLOAD & INGEST DOCUMENT</span>
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="e.g. Ballistics Striation Report — Grand Horizon"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Document Type *</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="FIR Report">FIR Report</option>
                    <option value="Forensic Report">Forensic Report</option>
                    <option value="Witness Statement">Witness Statement</option>
                    <option value="Investigation Report">Investigation Report</option>
                    <option value="Court Order">Court Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Associated Case</label>
                  <select
                    value={caseId}
                    onChange={e => setCaseId(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Unassigned (General Filing)</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} — {c.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Upload File (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Text Content / Scanned OCR Transcript
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste scanned transcript or report text for full-text and semantic vector indexing..."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Process & Index File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
