import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ArrowRight, ShieldCheck, Scale } from 'lucide-react';
import { api } from '../services/api';

export const FIRRegistryPage: React.FC = () => {
  const [firs, setFirs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFirs() {
      setIsLoading(true);
      try {
        const res = await api.getFirRegistry();
        setFirs(res.firRecords);
      } catch (err) {
        console.error('Failed to load FIR registry:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFirs();
  }, []);

  const filtered = firs.filter(f => {
    const q = search.toLowerCase();
    return (
      f.firNumber.toLowerCase().includes(q) ||
      f.caseNumber.toLowerCase().includes(q) ||
      f.title.toLowerCase().includes(q) ||
      f.policeStation.toLowerCase().includes(q) ||
      f.statutorySections.some((s: string) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <span>CENTRAL FIR REGISTRY (SECTION 154 Cr.P.C.)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official chronological register of First Information Reports lodged across police jurisdictions.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/80 p-3 shadow-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search FIR number, police station, statutory IPC/IT sections, or case title..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* FIR Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Police Station FIR Blotters...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching FIR records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">FIR Number</th>
                  <th className="py-3 px-4">Bound Case Dossier</th>
                  <th className="py-3 px-4">Station & Jurisdiction</th>
                  <th className="py-3 px-4">Statutory Sections</th>
                  <th className="py-3 px-4">Lodged Date</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs">
                {filtered.map(f => (
                  <tr
                    key={f.id}
                    onClick={() => navigate(`/cases/${f.id}`)}
                    className="hover:bg-graphite-850 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                        {f.firNumber}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Cognizable Offence</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-mono text-xs text-slate-200 font-bold">{f.caseNumber}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{f.title}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-slate-300 font-medium">{f.policeStation}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{f.jurisdiction}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {f.statutorySections?.slice(0, 2).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded bg-graphite-800 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300 border border-graphite-700 whitespace-nowrap"
                          >
                            {s}
                          </span>
                        ))}
                        {f.statutorySections?.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{f.statutorySections.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {new Date(f.reportedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {f.assignedInvestigator}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-all">
                        <span>Case Dossier</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
