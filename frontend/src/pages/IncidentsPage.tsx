import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Plus, Search, MapPin, Calendar, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const navigate = useNavigate();

  // Create form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cyber Attack');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [locationId, setLocationId] = useState('');
  const [caseId, setCaseId] = useState('');

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIncidents({
        search,
        category: categoryFilter,
      });
      setIncidents(res.incidents);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    api.getLocations().then(res => {
      setLocations(res.locations);
      if (res.locations.length > 0) setLocationId(res.locations[0].id);
    });
    api.getCases().then(res => {
      setCases(res.cases);
      if (res.cases.length > 0) setCaseId(res.cases[0].id);
    });
  }, [search, categoryFilter]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIncident({
        title,
        category,
        description,
        severity,
        locationId,
        caseId: caseId || undefined,
      });
      setCreateModalOpen(false);
      fetchIncidents();
    } catch (err: any) {
      alert(`Error creating incident: ${err.message}`);
    }
  };

  const getSeverityBadge = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'critical':
        return 'bg-red-950 text-red-300 border-red-800 font-bold';
      case 'high':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'medium':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Flame className="h-5 w-5 text-red-400" />
            <span>INCIDENT LOG & OCCURRENCE BLOTTER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Geotagged crime incidents, timestamps, and evidence collection ties.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/map')}
            className="rounded-lg border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-3 py-1.5 text-xs text-slate-200 transition-colors"
          >
            Open on Map
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
          >
            <Plus className="h-4 w-4" />
            <span>Log Incident</span>
          </button>
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
            placeholder="Search incident number, title, modus operandi..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Cyber Attack">Cyber Attack</option>
          <option value="Financial Fraud">Financial Fraud</option>
          <option value="Armed Robbery">Armed Robbery</option>
          <option value="Cargo Theft">Cargo Theft</option>
          <option value="Counterfeiting">Counterfeiting</option>
          <option value="Vehicle Evasion">Vehicle Evasion</option>
        </select>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Geotagged Incident Logs...
          </div>
        ) : incidents.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-slate-400">
            No incident records match the filter criteria.
          </div>
        ) : (
          incidents.map(inc => (
            <div
              key={inc.id}
              className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-4 shadow-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-red-400">{inc.incidentNumber}</span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-mono ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity} Severity
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{inc.title}</h3>
                <span className="inline-block text-[10px] rounded bg-graphite-800 text-cyan-300 font-mono px-2 py-0.5 my-1.5 border border-graphite-700">
                  {inc.category}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{inc.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-graphite-800/80 space-y-1.5 text-[11px]">
                {inc.location && (
                  <div className="flex items-center space-x-1.5 text-slate-300 truncate">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{inc.location.locationName} ({inc.location.jurisdiction})</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                  <span>Occurred: {new Date(inc.occurredAt).toLocaleString()}</span>
                  {inc.case && (
                    <button
                      onClick={() => navigate(`/cases/${inc.case!.id}`)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {inc.case.caseNumber} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono">RECORD NEW CRIME INCIDENT</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cyber intrusion attempt on sub-station"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Cyber Attack">Cyber Attack</option>
                    <option value="Financial Fraud">Financial Fraud</option>
                    <option value="Armed Robbery">Armed Robbery</option>
                    <option value="Cargo Theft">Cargo Theft</option>
                    <option value="Counterfeiting">Counterfeiting</option>
                    <option value="Vehicle Evasion">Vehicle Evasion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location *</label>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.locationName} ({loc.formattedAddress.slice(0, 32)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Linked Case (Optional)</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">None / Standalone Blotter</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} — {c.title.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Official incident details, time of occurrence, reporting party."
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
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
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
