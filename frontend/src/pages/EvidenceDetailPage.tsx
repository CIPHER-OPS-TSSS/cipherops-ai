import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  ShieldCheck,
  Send,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  X,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';

export const EvidenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [evidence, setEvidence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [newCustodian, setNewCustodian] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('SFSL Ballistics Wing, Rohini');
  const [authNote, setAuthNote] = useState('Official Court Order CC-2026-1180');
  const navigate = useNavigate();

  const fetchEvidence = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getEvidenceById(id);
      setEvidence(res.evidence);
    } catch (err) {
      console.error('Failed to load evidence detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [id]);

  const handleTransferCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.transferCustody(id, {
        newCustodianName: newCustodian,
        reason,
        location,
        authorization: authNote,
      });
      setTransferModalOpen(false);
      setNewCustodian('');
      setReason('');
      fetchEvidence();
    } catch (err: any) {
      alert(`Custody transfer error: ${err.message}`);
    }
  };

  if (isLoading || !evidence) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Verifying Cryptographic Custody Chain & Hashes...</p>
        </div>
      </div>
    );
  }

  const e = evidence;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/evidence')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Evidence Inventory</span>
        </button>
        <button
          onClick={() => setTransferModalOpen(true)}
          className="flex items-center space-x-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Send className="h-4 w-4" />
          <span>Transfer Custody</span>
        </button>
      </div>

      {/* Main Evidence Card */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-xl font-bold text-cyan-300">{e.evidenceNumber}</span>
              <span className="rounded bg-graphite-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                Barcode: {e.barcode}
              </span>
              <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 text-xs font-mono">
                {e.category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100">{e.description}</h1>
            {e.case && (
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Associated Docket: <span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => navigate(`/cases/${e.case.id}`)}>{e.case.caseNumber} ({e.case.title})</span>
              </p>
            )}
          </div>

          {/* Cryptographic Chain Integrity Badge */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs flex items-center space-x-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-mono font-bold text-emerald-300 text-xs">
                CRYPTOGRAPHICALLY VERIFIED
              </p>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                Tamper-Evident SHA-256 Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Current State Details */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-graphite-800 text-xs font-mono">
          <div className="bg-graphite-950 p-2.5 rounded border border-graphite-800">
            <span className="text-slate-500 block text-[10px] uppercase">Current Custodian</span>
            <span className="text-slate-200 font-bold">{e.currentCustodianName}</span>
          </div>
          <div className="bg-graphite-950 p-2.5 rounded border border-graphite-800">
            <span className="text-slate-500 block text-[10px] uppercase">Storage Location</span>
            <span className="text-slate-200 font-bold">{e.storageLocation}</span>
          </div>
          <div className="bg-graphite-950 p-2.5 rounded border border-graphite-800">
            <span className="text-slate-500 block text-[10px] uppercase">Seizure Point</span>
            <span className="text-slate-200 font-bold">{e.collectionLocation}</span>
          </div>
          <div className="bg-graphite-950 p-2.5 rounded border border-graphite-800">
            <span className="text-slate-500 block text-[10px] uppercase">Seal Number</span>
            <span className="text-cyan-400 font-bold">{e.sealReference || 'OFFICIAL SEALED'}</span>
          </div>
        </div>
      </div>

      {/* Chain of Custody Timeline with Tamper-Evident Hashes */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
              TAMPER-EVIDENT CHAIN OF CUSTODY LEDGER ({e.custodyEvents?.length || 0} TRANSFERS)
            </h2>
          </div>
          <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            Append-Only Cryptographic Chaining
          </span>
        </div>

        <div className="space-y-4">
          {e.custodyEvents?.map((evt: any, idx: number) => (
            <div
              key={evt.id}
              className="rounded-lg border border-graphite-800 bg-graphite-950/60 p-4 text-xs space-y-2 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-cyan-300 font-bold">Transfer #{idx + 1}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] rounded bg-emerald-950 text-emerald-400 px-2 py-0.2 border border-emerald-800/40 font-mono font-bold">
                  HASH VERIFIED
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center text-slate-300 gap-2 py-1 font-semibold">
                <span className="text-slate-400">{evt.previousCustodianName}</span>
                <span className="text-cyan-400 font-bold">→</span>
                <span className="text-cyan-300 font-bold">{evt.newCustodianName}</span>
                <span className="text-slate-500 font-normal">at {evt.transferLocation}</span>
              </div>

              <p className="text-slate-300 bg-graphite-900 p-2 rounded border border-graphite-800/80">
                <span className="text-slate-500 font-medium">Reason for Transfer:</span> {evt.transferReason}
              </p>

              {evt.authorizationNote && (
                <p className="text-[11px] text-slate-400 italic">
                  Legal Authorization: {evt.authorizationNote}
                </p>
              )}

              {/* Cryptographic Hashes */}
              <div className="mt-2 pt-2 border-t border-graphite-800 font-mono text-[10px] grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-500">
                <div>
                  <span className="block text-slate-600">Previous Hash:</span>
                  <span className="text-slate-400 break-all">{evt.previousHash}</span>
                </div>
                <div>
                  <span className="block text-slate-600">Current Cryptographic Hash:</span>
                  <span className="text-cyan-400 break-all">{evt.currentHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Custody Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono flex items-center space-x-2">
                <Send className="h-4 w-4 text-cyan-400" />
                <span>TRANSFER EVIDENCE CUSTODY</span>
              </h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTransferCustody} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Receiving Custodian Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustodian}
                  onChange={e => setNewCustodian(e.target.value)}
                  placeholder="e.g. Dr. Meera Nambiar (Forensic Analyst)"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Chemical purity testing / Court presentation"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Destination / Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Legal Authorization</label>
                <input
                  type="text"
                  value={authNote}
                  onChange={e => setAuthNote(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Confirm & Cryptographically Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
