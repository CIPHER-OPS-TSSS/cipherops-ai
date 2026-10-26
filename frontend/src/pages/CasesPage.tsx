import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Search, Filter, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // Create Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPoliceStation, setNewPoliceStation] = useState('Central District Special Police');
  const [newJurisdiction, setNewJurisdiction] = useState('Central District');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newFirNumber, setNewFirNumber] = useState('');
  const [newSections, setNewSections] = useState('IPC 420, IT Act 66');

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCases({
        search,
        status: statusFilter,
        priority: priorityFilter,
      });
      setCases(res.cases);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, priorityFilter]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCase({
        title: newTitle,
        description: newDescription,
        policeStation: newPoliceStation,
        jurisdiction: newJurisdiction,
        priority: newPriority,
        firNumber: newFirNumber || undefined,
        statutorySections: newSections.split(',').map(s => s.trim()),
      });
      setCreateModalOpen(false);
      fetchCases();
      navigate(`/cases/${res.case.id}`);
    } catch (err: any) {
      alert(`Error creating case: ${err.message}`);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-800/50';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-800/50';
      case 'MEDIUM':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-cyan-400" />
            <span>CASE & INVESTIGATION DIRECTORY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered investigative dockets, FIR bindings, and active proceedings.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Case</span>
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
            placeholder="Filter by Case Number, Title, FIR Number, Station..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="UNDER_INVESTIGATION">Under Investigation</option>
          <option value="AWAITING_FORENSIC_RESULTS">Awaiting Forensic Results</option>
          <option value="PENDING_COURT_PROCEEDINGS">Pending Court Proceedings</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Case Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Case Repository & Relation Cache...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching case records found. Adjust your search criteria or register a new case.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Case / FIR</th>
                  <th className="py-3 px-4">Case Title & Scope</th>
                  <th className="py-3 px-4">Station / Jurisdiction</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lead Investigator</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs">
                {cases.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-graphite-850 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                        {c.caseNumber}
                      </div>
                      {c.firNumber ? (
                        <span className="font-mono text-[10px] text-slate-400 block">{c.firNumber}</span>
                      ) : (
                        <span className="text-[10px] text-slate-600 block">No FIR bound</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-200 truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.description}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-slate-300 truncate">{c.policeStation}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.jurisdiction}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-graphite-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono border border-graphite-700">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">
                        {c.assignedInvestigator?.fullName || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-all">
                        <span>Dossier</span>
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

      {/* Create Case Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center space-x-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                <span>REGISTER NEW CASE RECORD</span>
              </h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Operation Cybershield Breach"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FIR Number (Optional)</label>
                <input
                  type="text"
                  value={newFirNumber}
                  onChange={e => setNewFirNumber(e.target.value)}
                  placeholder="e.g. FIR/2026/0499"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Police Station *</label>
                  <input
                    type="text"
                    required
                    value={newPoliceStation}
                    onChange={e => setNewPoliceStation(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Jurisdiction *</label>
                  <input
                    type="text"
                    required
                    value={newJurisdiction}
                    onChange={e => setNewJurisdiction(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Statutory Sections</label>
                  <input
                    type="text"
                    value={newSections}
                    onChange={e => setNewSections(e.target.value)}
                    placeholder="e.g. IPC 420, IT Act 66"
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Scope & Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Summary of allegations, modus operandi, and investigative lead."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-graphite-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950 shadow-md shadow-cyan-900/40"
                >
                  Save & File Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
