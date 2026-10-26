import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bot,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

export const AISearchPage: React.FC = () => {
  const [query, setQuery] = useState('Find records related to RTGS gateway breach and foreign C2 server');
  const [documentType, setDocumentType] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.searchAi(query, documentType || undefined);
      setResults(res.results || []);
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    'Find records related to RTGS gateway breach and foreign C2 server',
    'Show documents mentioning counterfeit vehicle chassis die punches',
    'Find witness depositions concerning night optical cable sabotage',
    'Search for reports describing pseudoephedrine air cargo seizure',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
          <Sparkles className="h-6 w-6 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          AI-POWERED HYBRID DOCUMENT SEARCH
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
          Natural language semantic search combining PostgreSQL Full-Text Search, vector similarity, and metadata filtering.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="rounded-xl border border-graphite-700 bg-graphite-900/90 p-4 shadow-2xl space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask or search across all FIRs, forensic exhibits, witness statements, and court orders..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-3 pl-11 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
          >
            {isLoading ? 'Searching...' : 'Search AI'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Filter Type:</span>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              className="rounded border border-graphite-700 bg-graphite-950 py-1 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Document Classes</option>
              <option value="FIR Report">FIR Report</option>
              <option value="Forensic Report">Forensic Report</option>
              <option value="Witness Statement">Witness Statement</option>
              <option value="Investigation Report">Investigation Report</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Strict Permission Boundary Enforced</span>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="pt-2 border-t border-graphite-800 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1 flex items-center">
            Suggested Queries:
          </span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(q)}
              className="rounded bg-graphite-950 border border-graphite-800 hover:border-cyan-500/40 px-2 py-0.5 text-[11px] text-slate-300 transition-colors"
            >
              "{q.slice(0, 36)}..."
            </button>
          ))}
        </div>
      </form>

      {/* Results View */}
      <div className="space-y-4">
        {isLoading && (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Executing hybrid vector ranking and relevance computation...
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="rounded-xl border border-graphite-800 bg-graphite-900/60 p-12 text-center text-xs text-slate-400">
            No supporting records matched query parameters.
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>Showing {results.length} ranked document matches</span>
              <span>Hybrid Score: FTS + Semantic Embeddings</span>
            </div>

            {results.map(r => (
              <div
                key={r.documentId}
                onClick={() => navigate(`/documents/${r.documentId}`)}
                className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl hover:border-cyan-500/40 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-300">{r.documentNumber}</span>
                    <span className="rounded bg-graphite-800 px-2 py-0.2 text-[10px] font-mono text-slate-300">
                      {r.documentType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Page {r.pageNumber}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-mono">Relevance Match:</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {Math.round(r.relevanceScore * 100)}%
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-200 transition-colors">
                  {r.title}
                </h3>

                <div className="rounded bg-graphite-950 p-3 border border-graphite-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {r.excerpt}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>File: {r.fileName}</span>
                  <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-all flex items-center space-x-1">
                    <span>Inspect Original Document</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
