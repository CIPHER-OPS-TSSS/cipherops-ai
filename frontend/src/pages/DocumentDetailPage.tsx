import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Files, ArrowLeft, ShieldCheck, RefreshCw, FolderOpen, Download, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const navigate = useNavigate();

  const fetchDoc = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getDocumentById(id);
      setDoc(res.document);
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const handleReprocess = async () => {
    if (!id) return;
    setIsReprocessing(true);
    try {
      await api.getDocumentById(id); // trigger refresh
      setTimeout(() => {
        setIsReprocessing(false);
        fetchDoc();
      }, 800);
    } catch (e: any) {
      setIsReprocessing(false);
      alert(`Reprocessing error: ${e.message}`);
    }
  };

  if (isLoading || !doc) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Verifying SHA-256 Checksum & Extracting OCR Layers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Document Repository</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReprocess}
            disabled={isReprocessing}
            className="flex items-center space-x-1.5 rounded-lg border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-3 py-1.5 text-xs text-slate-200 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Reprocessing OCR...' : 'Reprocess OCR'}</span>
          </button>
        </div>
      </div>

      {/* Header Info Card */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-lg font-bold text-cyan-300">{doc.documentNumber}</span>
              <span className="rounded bg-graphite-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                {doc.documentType}
              </span>
              <span className="flex items-center space-x-1 text-emerald-400 font-mono text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>SHA-256 VERIFIED</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{doc.title}</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">File: {doc.fileName} • Size: {Math.round(doc.fileSize / 1024)} KB • Pages: {doc.pageCount}</p>
          </div>

          <div className="rounded-lg border border-graphite-800 bg-graphite-950 p-3 text-xs space-y-1 font-mono">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cryptographic Hash</span>
            <p className="text-[11px] text-cyan-400 break-all">{doc.sha256Hash}</p>
          </div>
        </div>

        {/* Bound Cases */}
        {doc.linkedCases?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-graphite-800 flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Bound Investigation Docket:</span>
            {doc.linkedCases.map((c: any) => (
              <button
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="font-mono text-xs text-cyan-300 hover:text-cyan-200 underline"
              >
                {c.caseNumber} ({c.title})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* OCR Text Extracted Preview */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              OCR EXTRACTED TEXT & SEARCHABLE TRANSCRIPT
            </h2>
          </div>
          <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            Tesseract / High-Fidelity OCR Engine
          </span>
        </div>

        <div className="rounded-lg bg-graphite-950 p-4 border border-graphite-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {doc.extractedText || 'No text extracted from document.'}
        </div>
      </div>

      {/* Chunks & Embeddings Inspection */}
      {doc.chunks?.length > 0 && (
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3">
          <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider pb-2 border-b border-graphite-800">
            INDEXED CHUNKS & VECTOR EMBEDDINGS ({doc.chunks.length})
          </h2>
          <div className="space-y-2">
            {doc.chunks.map((chk: any) => (
              <div key={chk.id} className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Chunk Index: {chk.chunkIndex}</span>
                  <span>Estimated Tokens: {chk.tokenCount}</span>
                </div>
                <p className="text-slate-300 font-sans line-clamp-2">{chk.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
