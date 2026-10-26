import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Users,
  MapPin,
  Share2,
  Search,
  Bot,
  Files,
  Package,
  Car,
  Building2,
  Scale,
  CheckSquare,
  Bell,
  Download,
  AlertTriangle,
  History,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavSection {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const navigation: NavSection[] = [
    {
      title: 'CORE PLATFORM',
      items: [
        { to: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        { to: '/cases', label: 'Case Directory', icon: FolderOpen },
        { to: '/fir', label: 'FIR Registry', icon: FileText },
        { to: '/persons', label: 'Person Records', icon: Users },
        { to: '/incidents', label: 'Incident Records', icon: Flame },
      ],
    },
    {
      title: 'INTELLIGENCE & AI',
      items: [
        { to: '/map', label: 'Real-World Map', icon: MapPin },
        { to: '/graph', label: 'Relationship Graph', icon: Share2 },
        { to: '/ai-search', label: 'AI Document Search', icon: Search },
        { to: '/ai-assistant', label: 'AI Case Assistant', icon: Bot, badge: 'PRO' },
      ],
    },
    {
      title: 'REGISTRIES & ASSETS',
      items: [
        { to: '/documents', label: 'Document Repository', icon: Files },
        { to: '/evidence', label: 'Evidence & Custody', icon: Package },
        { to: '/vehicles', label: 'Vehicle Registry', icon: Car },
        { to: '/organizations', label: 'Organizations', icon: Building2 },
        { to: '/court', label: 'Court Proceedings', icon: Scale },
      ],
    },
    {
      title: 'OPERATIONS & WORKFLOW',
      items: [
        { to: '/tasks', label: 'Investigation Tasks', icon: CheckSquare },
        { to: '/notifications', label: 'Notification Center', icon: Bell },
        { to: '/reports', label: 'Reports & Exports', icon: Download },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { to: '/data-quality', label: 'Data Quality Engine', icon: AlertTriangle },
        { to: '/audit', label: 'Tamper-Evident Audit', icon: History },
        { to: '/admin/users', label: 'User & Permissions', icon: UserCheck },
        { to: '/settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-graphite-800 bg-graphite-900 transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-graphite-800 px-4">
        <NavLink to="/dashboard" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950">
            <Shield className="h-6 w-6 text-cyan-400" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-mono text-base font-bold tracking-wider text-slate-100">
                CIPHER<span className="text-cyan-400">OPS</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Intelligence AI
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-slate-400 hover:bg-graphite-800 hover:text-slate-200 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navigation.map(sec => (
          <div key={sec.title}>
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                {sec.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {sec.items.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400 font-semibold'
                          : 'text-slate-300 hover:bg-graphite-800 hover:text-slate-100'
                      } ${collapsed ? 'justify-center px-2' : 'justify-between'}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && item.badge && (
                      <span className="rounded bg-cyan-950 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer User Info */}
      <div className="border-t border-graphite-800 p-3 bg-graphite-950/60">
        {!collapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-graphite-800 border border-cyan-500/20 text-xs font-bold text-cyan-300">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Investigator'}</p>
              <p className="text-[10px] text-cyan-400 font-mono truncate">{user?.badgeNumber || 'BADGE-302'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite-800 border border-cyan-500/20 text-xs font-bold text-cyan-300">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
