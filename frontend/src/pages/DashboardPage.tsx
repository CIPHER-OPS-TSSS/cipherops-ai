import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Package,
  Files,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs font-mono text-cyan-400">Loading Intelligence Dashboard Data...</p>
        </div>
      </div>
    );
  }

  const { summary, charts, recentActivity } = stats;

  const summaryCards = [
    { label: 'Total Registered Cases', value: summary.totalCases, icon: FolderOpen, to: '/cases', color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { label: 'Active Investigations', value: summary.openCases, icon: Activity, to: '/cases?status=UNDER_INVESTIGATION', color: 'text-amber-400', border: 'border-amber-500/30' },
    { label: 'Closed & Resolved Cases', value: summary.closedCases, icon: CheckCircle2, to: '/cases?status=CLOSED', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'Pending Reviews', value: summary.pendingReviews, icon: Clock, to: '/cases?status=UNDER_REVIEW', color: 'text-purple-400', border: 'border-purple-500/30' },
    { label: 'Registered Incidents', value: summary.totalIncidents, icon: Flame, to: '/incidents', color: 'text-red-400', border: 'border-red-500/30' },
    { label: 'Evidence Items Logged', value: summary.totalEvidence, icon: Package, to: '/evidence', color: 'text-blue-400', border: 'border-blue-500/30' },
    { label: 'Indexed Documents', value: summary.totalDocuments, icon: Files, to: '/documents', color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { label: 'Tracked Person Records', value: summary.totalPersons, icon: Users, to: '/persons', color: 'text-teal-400', border: 'border-teal-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-graphite-800 bg-graphite-900/60 p-5 backdrop-blur">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
              CIPHEROPS CENTRAL INTELLIGENCE CONSOLE
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time criminal records repository, multi-case relationship analytics, and decision-support intelligence.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/ai-assistant')}
            className="flex items-center space-x-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-graphite-950 transition-colors shadow-md shadow-cyan-900/40"
          >
            <span>Launch AI Case Assistant</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/map')}
            className="flex items-center space-x-2 rounded-lg border border-graphite-700 bg-graphite-800 hover:bg-graphite-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>Interactive Map</span>
          </button>
        </div>
      </div>

      {/* 8 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => navigate(card.to)}
            className={`rounded-xl border ${card.border} bg-graphite-900/80 p-4 text-left transition-all hover:bg-graphite-850 hover:scale-[1.02] shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</p>
            <div className="mt-2 flex items-center text-[10px] text-slate-500 font-mono">
              <span>Click to view filtered records →</span>
            </div>
          </button>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases Over Time */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 font-mono">CASES REGISTERED OVER TIME (2026)</h2>
              <p className="text-xs text-slate-400">Monthly progression across metropolitan divisions</p>
            </div>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.casesOverTime}>
                <defs>
                  <linearGradient id="caseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#caseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Category */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 font-mono">INCIDENTS BY CLASSIFICATION CATEGORY</h2>
              <p className="text-xs text-slate-400">Distribution of documented crime occurrences</p>
            </div>
            <Flame className="h-4 w-4 text-red-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.incidentsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by Status */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 font-mono">CASE INVESTIGATION STATUS BREAKDOWN</h2>
              <p className="text-xs text-slate-400">Current workflow states across active docket</p>
            </div>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.casesByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={9} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investigator Workload */}
        <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 font-mono">ASSIGNED CASE WORKLOAD BY OFFICER</h2>
              <p className="text-xs text-slate-400">Active docket allocation for lead investigators</p>
            </div>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.investigatorWorkload}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="cases" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Authorized Activity Stream */}
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200 font-mono">
              RECENT AUTHORIZED INVESTIGATIVE ACTIVITY (AUDIT LOG STREAM)
            </h2>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium font-mono"
          >
            View Complete Tamper-Evident Ledger →
          </button>
        </div>

        <div className="space-y-2">
          {recentActivity.map((act: any) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3 rounded-lg border border-graphite-800 bg-graphite-950/40 text-xs"
            >
              <div className="flex items-center space-x-3 truncate">
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded">
                  {act.action}
                </span>
                <span className="font-semibold text-slate-200">{act.userName}:</span>
                <span className="text-slate-400 truncate">{act.details}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap ml-4">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
