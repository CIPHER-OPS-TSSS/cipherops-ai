import React, { useEffect, useState } from 'react';
import { Building2, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadOrgs() {
      setIsLoading(true);
      try {
        const res = await api.getOrganizations(search);
        setOrgs(res.organizations || []);
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrgs();
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          <span>ORGANIZATION & CORPORATE ENTITY REGISTRY</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Corporate entities, financial institutions, logistics carriers, and trade bodies cited in investigations.
        </p>
      </div>

      <div className="rounded-xl border border-graphite-800 bg-graphite-900/80 p-3 shadow-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company name, registration number, or sector..."
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Corporate Registrar & Investigation Links...
          </div>
        ) : orgs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            No matching organization records found.
          </div>
        ) : (
          orgs.map(org => (
            <div
              key={org.id}
              className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] rounded bg-graphite-800 text-cyan-300 px-2 py-0.5 border border-graphite-700">
                  {org.orgType}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {org.verificationStatus}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">{org.name}</h3>
                {org.registrationNumber && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Reg: {org.registrationNumber}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-300 bg-graphite-950 p-2.5 rounded border border-graphite-800">
                {org.registeredAddress || 'Address on official record'}
              </p>

              <div className="pt-2 border-t border-graphite-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Associated Dockets:</span>
                <span className="font-bold text-slate-200">{org.associatedCasesCount} case(s)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
