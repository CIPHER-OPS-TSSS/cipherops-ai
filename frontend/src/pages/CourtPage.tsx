import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Search, Calendar, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const CourtPage: React.FC = () => {
  const [proceedings, setProceedings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProceedings() {
      setIsLoading(true);
      try {
        const res = await api.getCourtProceedings();
        setProceedings(res.courtProceedings || []);
      } catch (err) {
        console.error('Failed to load court proceedings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProceedings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <Scale className="h-5 w-5 text-cyan-400" />
          <span>COURT PROCEEDINGS & JUDICIAL DOCKET TRACKER</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Judicial hearings, magistrate remands, bail matters, and statutory prosecution tracking.
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Judicial Blotters & Case Information Systems...
          </div>
        ) : proceedings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No active judicial proceedings recorded.
          </div>
        ) : (
          proceedings.map(cp => (
            <div
              key={cp.id}
              className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-graphite-800">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-sm font-bold text-purple-400">
                    {cp.proceedingNumber}
                  </span>
                  <span className="text-slate-200 font-bold text-xs">{cp.courtName}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="text-slate-400">
                    Hearing Date: <strong className="text-cyan-300">{new Date(cp.hearingDate).toLocaleDateString()}</strong>
                  </span>
                  {cp.nextHearingDate && (
                    <span className="text-amber-400">
                      Next: {new Date(cp.nextHearingDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2 space-y-1.5">
                  <p className="text-slate-400 font-medium">Matter Description:</p>
                  <p className="text-slate-200 leading-relaxed bg-graphite-950 p-3 rounded border border-graphite-800">
                    {cp.matterDescription}
                  </p>
                  {cp.legalOutcome && (
                    <div className="mt-2 p-2.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 font-mono text-xs">
                      <strong>Judicial Order / Outcome:</strong> {cp.legalOutcome}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-graphite-950 p-3 border border-graphite-800 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Presiding Judge</span>
                    <span className="text-slate-200 font-semibold">{cp.presidingJudge}</span>
                  </div>
                  {cp.case && (
                    <div className="pt-2 border-t border-graphite-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Bound Investigation</span>
                      <button
                        onClick={() => navigate(`/cases/${cp.case.id}`)}
                        className="font-mono text-cyan-400 hover:underline font-bold text-xs block truncate"
                      >
                        {cp.case.caseNumber} →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
