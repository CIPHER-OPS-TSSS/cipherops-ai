import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderOpen, User, Package, FileText, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    cases: any[];
    persons: any[];
    evidence: any[];
    documents: any[];
  }>({
    cases: [],
    persons: [],
    evidence: [],
    documents: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ cases: [], persons: [], evidence: [], documents: [] });
    }
  }, [isOpen]);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered by parent state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search execution
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ cases: [], persons: [], evidence: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [casesRes, personsRes, evidenceRes, docsRes] = await Promise.all([
          api.getCases({ search: query }),
          api.getPersons({ search: query }),
          api.getEvidence({ search: query }),
          api.getDocuments({ search: query }),
        ]);

        setResults({
          cases: casesRes.cases.slice(0, 4),
          persons: personsRes.persons.slice(0, 4),
          evidence: evidenceRes.evidence.slice(0, 4),
          documents: docsRes.documents.slice(0, 4),
        });
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.cases.length + results.persons.length + results.evidence.length + results.documents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-graphite-800 bg-graphite-950/60">
          <Search className="h-5 w-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cases, persons, evidence barcodes, document excerpts..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 rounded bg-graphite-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-graphite-700">
            ESC
          </kbd>
        </div>

        {/* Results View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-xs text-cyan-400 font-mono animate-pulse">
              Scanning official record indexes & verified registries...
            </div>
          )}

          {!isLoading && query.length >= 2 && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}". Try searching by FIR number, person name, or evidence barcode.
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-xs text-slate-500">
              Type at least 2 characters to search across official records.
            </div>
          )}

          {/* Cases */}
          {results.cases.length > 0 && (
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase text-cyan-400 mb-2 flex items-center space-x-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Cases ({results.cases.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.cases.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      navigate(`/cases/${c.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-graphite-800 bg-graphite-950/40 hover:bg-graphite-800/80 hover:border-cyan-500/30 text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">{c.caseNumber}</span>
                        {c.firNumber && (
                          <span className="text-[10px] rounded bg-graphite-800 px-1.5 py-0.2 text-slate-400 font-mono">
                            {c.firNumber}
                          </span>
                        )}
                        <span className="text-[10px] rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 px-1.5 py-0.2">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate mt-0.5">{c.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Persons */}
          {results.persons.length > 0 && (
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase text-amber-400 mb-2 flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Persons ({results.persons.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.persons.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate(`/persons/${p.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-graphite-800 bg-graphite-950/40 hover:bg-graphite-800/80 hover:border-amber-500/30 text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-100">{p.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-400">({p.recordNumber})</span>
                        <span className="text-[10px] rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 px-1.5 py-0.2">
                          {p.primaryLegalRole}
                        </span>
                      </div>
                      {p.aliases?.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Aliases: {p.aliases.join(', ')}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {results.evidence.length > 0 && (
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase text-purple-400 mb-2 flex items-center space-x-1.5">
                <Package className="h-3.5 w-3.5" />
                <span>Evidence ({results.evidence.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.evidence.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onClose();
                      navigate(`/evidence/${e.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-graphite-800 bg-graphite-950/40 hover:bg-graphite-800/80 hover:border-purple-500/30 text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-purple-300">{e.evidenceNumber}</span>
                        <span className="font-mono text-[10px] rounded bg-graphite-800 px-1.5 py-0.2 text-slate-400">
                          {e.barcode}
                        </span>
                        <span className="text-[10px] text-slate-400">Category: {e.category}</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">{e.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase text-blue-400 mb-2 flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Documents ({results.documents.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.documents.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onClose();
                      navigate(`/documents/${d.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-graphite-800 bg-graphite-950/40 hover:bg-graphite-800/80 hover:border-blue-500/30 text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-300">{d.documentNumber}</span>
                        <span className="text-[10px] text-slate-400">{d.documentType}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate mt-0.5">{d.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-graphite-950/80 border-t border-graphite-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Use <strong>↑</strong> and <strong>↓</strong> to navigate, <strong>Enter</strong> to open</span>
          <span className="font-mono text-cyan-500">CIPHEROPS AIR-GAPPED SEARCH</span>
        </div>
      </div>
    </div>
  );
};
