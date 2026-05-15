import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { motion } from 'framer-motion';

import { Activity, ArrowUpRight, Clock, Filter, Search, User, FileEdit, Upload, LogIn, Layers } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ACTION_ICONS = {
  LOGIN: LogIn,
  LOGOUT: LogIn,
  PROJECT_CREATED: Layers,
  PROJECT_UPDATED: FileEdit,
  STAGE_CHANGED: Layers,
  FILE_UPLOADED: Upload,
  USER_JOINED: User,
  DEFAULT: Activity,
};

const ACTION_COLORS = {
  LOGIN: 'text-green-400 bg-green-500/10 border-green-500/20',
  LOGOUT: 'text-white/40 bg-white/5 border-white/10',
  PROJECT_CREATED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PROJECT_UPDATED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  STAGE_CHANGED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  FILE_UPLOADED: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  USER_JOINED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  DEFAULT: 'text-white/40 bg-white/5 border-white/10',
};

function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const socket = useSocket();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('activity-created', (newActivity) => {
        setLogs(prev => [newActivity, ...prev].slice(0, 50));
      });

      return () => {
        socket.off('activity-created');
      };
    }
  }, [socket]);


  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      // Use the recent activity from dashboard or a dedicated endpoint
      setLogs(res.data.data?.recentActivity || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    !search ||
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Organization</span>
            </div>
            <h1 className="text-4xl font-black text-premium tracking-tight">Activity Log</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search activity..."
                className="glass-input pl-10 h-11 w-56 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-premium mb-2">No activity yet</h3>
              <p className="text-white/40">Activity from your organization will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((log, idx) => {
                const Icon = ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT;
                const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT;
                return (
                  <motion.div
                    key={log._id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-start gap-4 p-4 glass rounded-xl border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className={`p-2 rounded-lg border flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-premium leading-tight">{log.description || log.action}</p>
                      {log.entityType && (
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-0.5">{log.entityType}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-white/30 uppercase tracking-widest flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(log.createdAt)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ActivityPage;
