import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ShieldCheck, LogOut, ChevronDown, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types';
import { api } from '../../services/api';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { user, demoRole, switchDemoRole, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await api.getNotifications();
        setUnreadNotifications(res.unreadCount);
      } catch (e) {
        // keep fallback
      }
    }
    checkNotifications();
  }, [location.pathname]);

  const rolesList: { role: RoleType; label: string }[] = [
    { role: 'SYSTEM_ADMINISTRATOR', label: '1. System Administrator' },
    { role: 'INVESTIGATION_SUPERVISOR', label: '2. Investigation Supervisor' },
    { role: 'INVESTIGATOR', label: '3. Investigator' },
    { role: 'RECORDS_OFFICER', label: '4. Records Officer' },
    { role: 'FORENSIC_ANALYST', label: '5. Forensic Analyst' },
    { role: 'READ_ONLY_AUDITOR', label: '6. Read-Only Auditor' },
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-graphite-800 bg-graphite-900/95 px-6 backdrop-blur z-10">
      {/* Search trigger */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-3 rounded-lg border border-graphite-800 bg-graphite-950/80 px-3.5 py-1.5 text-xs text-slate-400 hover:border-cyan-500/40 hover:text-slate-200 transition-all shadow-inner w-72"
        >
          <Search className="h-3.5 w-3.5 text-cyan-400" />
          <span className="flex-1 text-left">Search FIRs, Cases, Persons, Docs...</span>
          <kbd className="rounded bg-graphite-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-graphite-700">
            ⌘K
          </kbd>
        </button>

        {/* Security mode badge */}
        <div className="hidden lg:flex items-center space-x-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>AIR-GAPPED AUDIT ACTIVE</span>
        </div>
      </div>

      {/* Action utilities */}
      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-950/60 transition-all"
            title="Switch Simulated Role"
          >
            <span className="text-slate-400 text-[11px]">Role:</span>
            <span className="font-semibold">{user?.role?.replace(/_/g, ' ') || demoRole}</span>
            <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-graphite-700 bg-graphite-900 py-1.5 shadow-2xl z-50">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Switch Role Profile
              </p>
              {rolesList.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchDemoRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                    (user?.role || demoRole) === r.role
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-graphite-800'
                  }`}
                >
                  <span>{r.label}</span>
                  {(user?.role || demoRole) === r.role && <span className="text-cyan-400 text-[10px]">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-lg border border-graphite-800 bg-graphite-950/60 p-2 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-graphite-950">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center space-x-2 border-l border-graphite-800 pl-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Investigator'}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.badgeNumber || 'BADGE-INV-302'}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-graphite-800 bg-graphite-950/60 p-2 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
