import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleType } from '../types';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('investigator@cipherops.gov.in');
  const [password, setPassword] = useState('investigator123');
  const [mfaCode, setMfaCode] = useState('849201');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts: { role: RoleType; name: string; email: string; badge: string; desc: string }[] = [
    { role: 'SYSTEM_ADMINISTRATOR', name: 'Vikramaditya Rathore', email: 'admin@cipherops.gov.in', badge: 'BADGE-ADM-001', desc: 'Full System Administration & Security Policies' },
    { role: 'INVESTIGATION_SUPERVISOR', name: 'Dr. Sunita Deshmukh', email: 'supervisor@cipherops.gov.in', badge: 'BADGE-SUP-108', desc: 'Case Assignment, Priority Escalation & Approvals' },
    { role: 'INVESTIGATOR', name: 'Inspector Kabir Sharma', email: 'investigator@cipherops.gov.in', badge: 'BADGE-INV-302', desc: 'Lead Case Investigation, Dossiers & Evidence Logging' },
    { role: 'RECORDS_OFFICER', name: 'Rajesh K. Varma', email: 'records@cipherops.gov.in', badge: 'BADGE-REC-504', desc: 'Document Ingestion, OCR & Archival Classification' },
    { role: 'FORENSIC_ANALYST', name: 'Dr. Meera Nambiar', email: 'forensic@cipherops.gov.in', badge: 'BADGE-FOR-612', desc: 'Ballistics, Digital Forensics & Custody Verification' },
    { role: 'READ_ONLY_AUDITOR', name: 'Justice (Retd.) P. C. Thomas', email: 'auditor@cipherops.gov.in', badge: 'BADGE-AUD-991', desc: 'Oversight, Custody Audit & Governance Review' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ identifier, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc: typeof demoAccounts[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      await login({ role: acc.role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-graphite-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-950/50 mb-4">
          <Shield className="h-8 w-8 text-cyan-400" />
        </div>
        <h1 className="font-mono text-2xl font-bold tracking-wider text-slate-100">
          CIPHER<span className="text-cyan-400">OPS</span> AI
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Intelligent Criminal Records & Investigation Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-6 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Badge Number or Official Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  placeholder="e.g. BADGE-INV-302 or email"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Security Passcode</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">MFA Verification Code</label>
                <span className="text-[10px] text-cyan-400 font-mono">TOTP Active</span>
              </div>
              <input
                type="text"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                maxLength={6}
                placeholder="6-digit token"
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-2 px-3 text-xs font-mono text-center tracking-widest text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 px-4 text-xs font-semibold text-graphite-950 transition-colors shadow-lg shadow-cyan-900/30"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Access Platform'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 border-t border-graphite-800 pt-4">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Instant 1-Click Role Login (Demo Modes):
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {demoAccounts.map(acc => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="flex items-center justify-between p-2 rounded-lg border border-graphite-800 bg-graphite-950/50 hover:bg-graphite-800 hover:border-cyan-500/30 text-left transition-all group"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {acc.badge} • {acc.role.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
