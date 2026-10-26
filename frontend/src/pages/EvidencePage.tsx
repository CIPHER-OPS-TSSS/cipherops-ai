import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Filter, ArrowRight, ShieldCheck, QrCode, X } from 'lucide-react';
import { api } from '../services/api';
import { EvidenceItem } from '../types';

export const EvidencePage: React.FC = () => {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const navigate = useNavigate();

  // Create form state
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState('Digital');
  const [description, setDescription] = useState('');
  const [collectionLocation, setCollectionLocation] = useState('Crime Scene');
  const [storageLocation, setStorageLocation] = useState('Central Forensics Vault');
  const [custodianName, setCustodianName] = useState('Inspector Kabir Sharma');
  const [sealReference, setSealReference] = useState('');

  const fetchEvidence = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvidence({
        search,
        category: categoryFilter,
      });
      setEvidence(res.evidence);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
    api.getCases().then(res => {
      setCases(res.cases || []);
      if (res.cases?.length > 0) setCaseId(res.cases[0].id);
    });
  }, [search, categoryFilter]);

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEvidence({
        caseId,
        category,
        description,
        collectionLocation,
        storageLocation,
        currentCustodianName: custodianName,
        sealReference: sealReference || undefined,
      });
      setCreateModalOpen(false);
      fetchEvidence();
      navigate(`/evidence/${res.evidence.id}`);
    } catch (err: any) {
      alert(`Error logging evidence: ${err.message}`);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'digital':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40';
      case 'ballistics':
        return 'text-red-400 bg-red-950/60 border-red-800/40';
      case 'forensic':
        return 'text-purple-400 bg-purple-950/60 border-purple-800/40';
      default:
        return 'text-amber-400 bg-amber-950/60 border-amber-800/40';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Package className="h-5 w-5 text-cyan-400" />
            <span>EVIDENCE INVENTORY & PROPERTY LEDGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically tracked physical and digital exhibits with immutable chain-of-custody logs.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>Log New Evidence</span>
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
            placeholder="Search by Evidence Number, Barcode (e.g. BAR-CYBER-81201), description..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Digital">Digital</option>
          <option value="Ballistics">Ballistics</option>
          <option value="Forensic">Forensic</option>
          <option value="Physical">Physical</option>
          <option value="Documentary">Documentary</option>
        </select>
      </div>

      {/* Evidence Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Evidence Locker & Custody Chains...
          </div>
        ) : evidence.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching evidence items found in inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Exhibit # & Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Storage Location</th>
                  <th className="py-3 px-4">Current Custodian</th>
                  <th className="py-3 px-4">Custody Events</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs">
                {evidence.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/evidence/${e.id}`)}
                    className="hover:bg-graphite-850 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                        {e.evidenceNumber}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 block">{e.barcode}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-semibold ${getCategoryColor(e.category)}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-200 font-medium truncate">{e.description}</p>
                      {e.case && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Case: {e.case.caseNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {e.storageLocation}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-200 font-medium">
                      {e.currentCustodianName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-graphite-700">
                        {e.custodyEventCount || 1} Event(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-all">
                        <span>Custody Trail</span>
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

      {/* Log Evidence Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono flex items-center space-x-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                <span>LOG EXHIBIT & INITIAL CUSTODY</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Associated Case *</label>
                  <select
                    value={caseId}
                    onChange={e => setCaseId(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} — {c.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Digital">Digital</option>
                    <option value="Ballistics">Ballistics</option>
                    <option value="Forensic">Forensic</option>
                    <option value="Physical">Physical</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exhibit Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Exact description, serial numbers, physical markings, and make/model."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Collection Location *</label>
                  <input
                    type="text"
                    required
                    value={collectionLocation}
                    onChange={e => setCollectionLocation(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Storage Locker / Vault *</label>
                  <input
                    type="text"
                    required
                    value={storageLocation}
                    onChange={e => setStorageLocation(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Receiving Custodian Name *</label>
                  <input
                    type="text"
                    required
                    value={custodianName}
                    onChange={e => setCustodianName(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Seal Reference (Optional)</label>
                  <input
                    type="text"
                    value={sealReference}
                    onChange={e => setSealReference(e.target.value)}
                    placeholder="e.g. SEAL-SFSL-2026-091"
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Log Evidence Exhibit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
