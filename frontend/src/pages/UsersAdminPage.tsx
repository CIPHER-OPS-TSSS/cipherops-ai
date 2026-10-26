import React, { useEffect, useState } from 'react';
import { UserCheck, Shield, Key, Edit, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { RoleType } from '../types';

export const UsersAdminPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>('INVESTIGATOR');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.updateUserRole(editingUser.id, selectedRole);
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) {
      alert(`Error updating role: ${e.message}`);
    }
  };

  const roles = [
    { name: 'SYSTEM_ADMINISTRATOR', label: '1. System Administrator', desc: 'Full administration, user management, policy rules' },
    { name: 'INVESTIGATION_SUPERVISOR', label: '2. Investigation Supervisor', desc: 'Case dockets, investigator assignments, approvals' },
    { name: 'INVESTIGATOR', label: '3. Investigator', desc: 'Primary investigation, person linking, evidence intake' },
    { name: 'RECORDS_OFFICER', label: '4. Records Officer', desc: 'Document ingestion, classification, OCR indexer' },
    { name: 'FORENSIC_ANALYST', label: '5. Forensic Analyst', desc: 'Exhibits, ballistics, evidence custody verification' },
    { name: 'READ_ONLY_AUDITOR', label: '6. Read-Only Auditor', desc: 'Judicial oversight, audit trail verification, exports' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
          <UserCheck className="h-5 w-5 text-cyan-400" />
          <span>USER ADMINISTRATION & ROLE-BASED ACCESS CONTROL</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Authorized personnel accounts, security clearance levels, and operational privilege boundaries.
        </p>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Querying Security Clearance Roster...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-800 bg-graphite-950/60 text-[11px] font-mono font-semibold uppercase text-slate-400">
                  <th className="py-3 px-4">Badge / Account</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department Division</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60 text-xs font-sans">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-graphite-850 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-cyan-300 block">{u.badgeNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{u.email}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {u.fullName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {u.department}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">
                        ACTIVE • MFA {u.mfaEnabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedRole(u.role);
                        }}
                        className="rounded border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-2.5 py-1 text-xs text-slate-200 transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Modify Role</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Descriptions Matrix */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase text-slate-400 pb-2 border-b border-graphite-800">
          OFFICIAL ROLE PRIVILEGE MATRICES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {roles.map(r => (
            <div key={r.name} className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="font-bold text-slate-100 block">{r.label}</span>
              <p className="text-slate-400 text-[11px]">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-graphite-700 bg-graphite-900 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-800">
              <h3 className="text-xs font-bold text-slate-100 font-mono">
                MODIFY SECURITY ROLE: {editingUser.fullName}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Security Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-graphite-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-graphite-950"
                >
                  Apply Role Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
