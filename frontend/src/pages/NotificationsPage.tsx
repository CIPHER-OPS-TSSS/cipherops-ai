import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleMarkRead = async (id: string, linkUrl?: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
      if (linkUrl) navigate(linkUrl);
    } catch (e: any) {
      // ignore
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center space-x-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            <span>NOTIFICATION & DISPATCH CENTER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational alerts, AI candidate link discoveries, and custody transfer receipts.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium font-mono"
        >
          Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-cyan-400 font-mono animate-pulse">
            Loading Notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-graphite-800 bg-graphite-900/60 p-12 text-center text-xs text-slate-400">
            No pending notifications. All alerts acknowledged.
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id, notif.linkUrl)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                notif.isRead
                  ? 'border-graphite-800 bg-graphite-900/50 hover:bg-graphite-850'
                  : 'border-cyan-500/40 bg-graphite-900 shadow-lg shadow-cyan-950/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {notif.category?.replace(/_/g, ' ')}
                  </span>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{notif.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
              </div>

              {notif.linkUrl && (
                <span className="text-xs font-semibold text-cyan-400 flex items-center space-x-1 whitespace-nowrap mt-1">
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
