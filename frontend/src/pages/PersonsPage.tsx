import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Filter, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';
import { Person } from '../types';

export const PersonsPage: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // Create form
  const [fullName, setFullName] = useState('');
  const [aliases, setAliases] = useState('');
  const [primaryRole, setPrimaryRole] = useState('PERSON_OF_INTEREST');
  const [gender, setGender] = useState('Male');
  const [currentAddress, setCurrentAddress] = useState('');
  const [sourceOfInfo, setSourceOfInfo] = useState('Official Investigative Intake');

  const fetchPersons = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPersons({
        search,
        role: roleFilter,
      });
      setPersons(res.persons);
    } catch (err) {
      console.error('Failed to load persons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [search, roleFilter]);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPerson({
        fullName,
        aliases: aliases ? aliases.split(',').map(a => a.trim()) : [],
        primaryLegalRole: primaryRole,
        gender,
        currentAddress,
        sourceOfInfo,
      });
      setCreateModalOpen(false);
      fetchPersons();
      navigate(`/persons/${res.person.id}`);
    } catch (err: any) {
      alert(`Error creating person record: ${err.message}`);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CONVICTED':
        return 'bg-red-950 text-red-300 border-red-800/60 font-bold';
      case 'ACCUSED':
        return 'bg-amber-950 text-amber-300 border-amber-800/60 font-bold';
      case 'SUSPECT':
        return 'bg-purple-950 text-purple-300 border-purple-800/60';
      case 'WITNESS':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800/60';
      case 'COMPLAINANT':
        return 'bg-blue-950 text-blue-300 border-blue-800/60';
      case 'VICTIM':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>PERSON RECORDS & PARTIES REGISTRY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly classified records distinguishing accused, suspects, witnesses, victims, and complainants.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Person Record</span>
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
            placeholder="Search by name, record ID (e.g. PER-2026-0001), alias, or address..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Legal Roles</option>
          <option value="ACCUSED">Accused</option>
          <option value="SUSPECT">Suspect</option>
          <option value="CONVICTED">Convicted</option>
          <option value="WITNESS">Witness</option>
          <option value="COMPLAINANT">Complainant</option>
          <option value="VICTIM">Victim</option>
          <option value="PERSON_OF_INTEREST">Person of Interest</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Person Registry & Legal Classifications...
          </div>
        ) : persons.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching person records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Full Name & Aliases</th>
                  <th className="py-3 px-4">Primary Legal Role</th>
                  <th className="py-3 px-4">Associated Cases</th>
                  <th className="py-3 px-4">Current Address</th>
                  <th className="py-3 px-4">Status & Provenance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs">
                {persons.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/persons/${p.id}`)}
                    className="hover:bg-graphite-850 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-cyan-300 font-bold">
                      {p.recordNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100 group-hover:text-cyan-200">{p.fullName}</p>
                      {p.aliases?.length > 0 && (
                        <p className="text-[11px] text-slate-400">Aliases: {p.aliases.join(', ')}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono ${getRoleBadge(p.primaryLegalRole)}`}>
                        {p.primaryLegalRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      {p.associatedCasesCount || 0} case(s)
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {p.currentAddress || 'Not Recorded'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold text-[10px] font-mono block">
                        VERIFIED RECORD
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-xs">{p.sourceOfInfo}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-all">
                        <span>Profile</span>
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

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono">NEW PERSON RECORD INGESTION</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sharma"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Known Aliases (Comma-separated)</label>
                <input
                  type="text"
                  value={aliases}
                  onChange={e => setAliases(e.target.value)}
                  placeholder="e.g. RC, Sharmaji"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Primary Legal Role *</label>
                  <select
                    value={primaryRole}
                    onChange={e => setPrimaryRole(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ACCUSED">Accused</option>
                    <option value="SUSPECT">Suspect</option>
                    <option value="WITNESS">Witness</option>
                    <option value="COMPLAINANT">Complainant</option>
                    <option value="VICTIM">Victim</option>
                    <option value="PERSON_OF_INTEREST">Person of Interest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Not Disclosed">Not Disclosed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Documented Address</label>
                <input
                  type="text"
                  value={currentAddress}
                  onChange={e => setCurrentAddress(e.target.value)}
                  placeholder="Street address, city"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Source of Information *</label>
                <input
                  type="text"
                  required
                  value={sourceOfInfo}
                  onChange={e => setSourceOfInfo(e.target.value)}
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
                  Register Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
