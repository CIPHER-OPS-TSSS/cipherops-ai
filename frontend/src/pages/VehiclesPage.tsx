import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true);
      try {
        const res = await api.getVehicles(search);
        setVehicles(res.vehicles || []);
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicles();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Car className="h-5 w-5 text-cyan-400" />
            <span>VEHICLE REGISTRY & FLEET INTELLIGENCE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered vehicle plates, altered chassis identifiers, and case-linked transport units.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-graphite-800 bg-graphite-900/80 p-3 shadow-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search license plate number (e.g. DL-03-CC-9901), make, model, owner..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying RTO & Transport Blotters...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No matching vehicle records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Registration #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Registered Owner</th>
                  <th className="py-3 px-4">Associated Case</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs font-sans">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-graphite-850 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-cyan-300">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {v.vehicleType}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {v.make} {v.model}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {v.color}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {v.registeredOwner || 'Unverified'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-cyan-400">
                      {v.case ? (
                        <button
                          onClick={() => navigate(`/cases/${v.case.id}`)}
                          className="hover:underline font-bold"
                        >
                          {v.case.caseNumber}
                        </button>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                        {v.verificationStatus}
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
