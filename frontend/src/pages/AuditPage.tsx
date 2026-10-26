import React, { useEffect, useState } from 'react';
import { History, Search, ShieldCheck, Download, Filter, Lock } from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isChainValid, setIsChainValid] = useState(true);
  const [ledgerStatus, setLedgerStatus] = useState('CRYPTOGRAPHICALLY_VERIFIED_VALID');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchAudit = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditEvents({
        search,
        action: actionFilter,
      });
      setEvents(res.events || []);
      setIsChainValid(res.isChainValid);
      setLedgerStatus(res.ledgerIntegrityStatus);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [search, actionFilter]);

  const handleExportAudit = () => {
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CipherOps_Audit_Ledger_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <History className="h-5 w-5 text-cyan-400" />
            <span>TAMPER-EVIDENT AUDIT & GOVERNANCE LEDGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically hash-chained audit log recording all access, queries, edits, and custody events.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center space-x-2 rounded-lg border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-3.5 py-1.5 text-xs text-slate-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Trail (JSON)</span>
        </button>
      </div>

      {/* Cryptographic Ledger Health Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-graphite-900/90 p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-emerald-300">
                LEDGER STATUS: {ledgerStatus}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All {events.length} ledger entries cryptographically chained via SHA-256 rolling previousHash digest.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Lock className="h-3.5 w-3.5 text-cyan-400" />
          <span>Append-Only Immutability Protocol</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-graphite-800 bg-graphite-900/80 p-3 shadow-md">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit entries by user, target resource (e.g. Case:CAS-2026-0812), details..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN_SUCCESS">Login Success</option>
          <option value="LOGIN_FAILURE">Login Failure</option>
          <option value="RECORD_ACCESS">Record Access</option>
          <option value="RECORD_CREATE">Record Create</option>
          <option value="RECORD_UPDATE">Record Update</option>
          <option value="CUSTODY_TRANSFER">Custody Transfer</option>
          <option value="AI_SEARCH_QUERY">AI Search Query</option>
          <option value="EXPORT_JOB">Export Job</option>
          <option value="RELATIONSHIP_REVIEW">Relationship Review</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Verifying Cryptographic Ledger Hashes...
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No audit events matched the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Badge</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Activity Description</th>
                  <th className="py-3 px-4">Cryptographic Hash Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs font-mono">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-graphite-850 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-200 font-bold block">{evt.userName || 'System'}</span>
                      <span className="text-[10px] text-cyan-400 block">{evt.userBadge || 'SYSTEM'}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-graphite-800 text-cyan-300 border border-graphite-700 px-2 py-0.5 text-[10px] font-bold">
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-200">
                      {evt.targetResource}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs font-sans text-xs">
                      {evt.details}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] text-emerald-400 font-mono block">
                        {evt.recordHash.slice(0, 16)}...
                      </span>
                      <span className="text-[9px] text-slate-600 block">
                        Prev: {evt.previousHash.slice(0, 12)}...
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
