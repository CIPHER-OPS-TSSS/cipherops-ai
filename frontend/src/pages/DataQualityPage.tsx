import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, User, Files, MapPin, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const DataQualityPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDataQualityMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load data quality metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleReviewDuplicate = async (item: any, decision: string) => {
    try {
      await api.reviewDuplicateCandidate({
        candidateAId: item.candidateA.id,
        candidateBId: item.candidateB.id,
        decision,
        reviewNotes: reviewNote || 'Verified as distinct individual entities during human review.',
      });
      alert(`Review Decision recorded: Records kept distinct per legal safeguards.`);
      fetchMetrics();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Auditing Data Quality & Integrity Constraints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <span>DATA QUALITY & RECORD INTEGRITY ENGINE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Proactive anomaly detection, duplicate identification, and evidentiary hygiene monitoring.
        </p>
      </div>

      {/* Health Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-graphite-900/90 p-4 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">System Health Score</span>
          <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{metrics.healthScore}%</p>
          <p className="text-[10px] text-emerald-500 font-mono mt-1">OPTIMAL GOVERNANCE</p>
        </div>

        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Unlinked Documents</span>
          <p className="text-3xl font-bold text-slate-200 font-mono mt-1">{metrics.unlinkedDocumentsCount}</p>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Stand-alone files</p>
        </div>

        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Unverified Locations</span>
          <p className="text-3xl font-bold text-amber-400 font-mono mt-1">{metrics.unverifiedLocationsCount}</p>
          <p className="text-[10px] text-amber-500 font-mono mt-1">Approximate geofence</p>
        </div>

        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Candidate Duplicates</span>
          <p className="text-3xl font-bold text-purple-400 font-mono mt-1">{metrics.potentialDuplicatePersons?.length || 0}</p>
          <p className="text-[10px] text-purple-400 font-mono mt-1">Awaiting human review</p>
        </div>
      </div>

      {/* Mandatory Safeguard Banner */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-xs text-cyan-200 flex items-start space-x-3">
        <ShieldAlert className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-cyan-300">MANDATORY EVIDENTIARY SAFEGUARD:</p>
          <p className="mt-0.5 leading-relaxed text-slate-300">
            Algorithm similarity scores are investigative indicators only. The system <strong>never automatically merges</strong> person records, deletes evidence, or alters legal statuses based solely on a data quality score.
          </p>
        </div>
      </div>

      {/* Potential Duplicate Person Review */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 font-mono pb-2 border-b border-graphite-800">
          SUSPECT DUPLICATE PERSON CANDIDATE REVIEWS
        </h2>

        {metrics.potentialDuplicatePersons?.map((dup: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl border border-graphite-800 bg-graphite-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-400">Candidate Comparison #{idx + 1}</span>
              <span className="font-mono text-[11px] text-cyan-400">
                Similarity Index: <strong>{Math.round(dup.similarityScore * 100)}%</strong>
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-graphite-900 p-2.5 rounded border border-graphite-800">
              <span className="text-slate-500 font-medium">Match Rationale:</span> {dup.matchReason}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-graphite-900 border border-graphite-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-mono font-bold">RECORD A: {dup.candidateA?.recordNumber}</span>
                <p className="font-bold text-slate-100">{dup.candidateA?.fullName}</p>
                <p className="text-slate-400 text-[11px]">Role: {dup.candidateA?.primaryLegalRole}</p>
                <p className="text-slate-400 text-[11px]">Address: {dup.candidateA?.currentAddress}</p>
              </div>

              <div className="p-3 rounded bg-graphite-900 border border-graphite-800 space-y-1">
                <span className="text-[10px] text-purple-400 font-mono font-bold">RECORD B: {dup.candidateB?.recordNumber}</span>
                <p className="font-bold text-slate-100">{dup.candidateB?.fullName}</p>
                <p className="text-slate-400 text-[11px]">Role: {dup.candidateB?.primaryLegalRole}</p>
                <p className="text-slate-400 text-[11px]">Address: {dup.candidateB?.currentAddress}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-graphite-850">
              <input
                type="text"
                placeholder="Supervisor review notes / justification..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full sm:w-auto flex-1 rounded bg-graphite-900 border border-graphite-800 px-3 py-1 text-xs text-slate-200 focus:outline-none"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReviewDuplicate(dup, 'CONFIRMED_DISTINCT')}
                  className="rounded bg-emerald-950 border border-emerald-800 text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-900"
                >
                  Verify Distinct (No Merge)
                </button>
                <button
                  onClick={() => handleReviewDuplicate(dup, 'CROSS_REFERENCE_LINKED')}
                  className="rounded bg-cyan-950 border border-cyan-800 text-cyan-300 px-3 py-1 text-xs font-semibold hover:bg-cyan-900"
                >
                  Cross-Reference (Keep Distinct)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
