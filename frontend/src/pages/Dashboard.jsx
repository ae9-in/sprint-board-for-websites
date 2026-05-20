import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';

import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  ArrowUpRight,
  Plus,
  Rocket,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { Link } from 'react-router-dom';

const chartData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 60 },
  { name: 'Thu', value: 55 },
  { name: 'Fri', value: 80 },
  { name: 'Sat', value: 70 },
  { name: 'Sun', value: 95 },
];

function Dashboard() {
  const { user, organization } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      const endpoint = user?.role === 'SUPER_ADMIN' ? '/dashboard/admin' : '/dashboard/user';
      const response = await api.get(endpoint);
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: async () => {
      const response = await api.get('/projects?limit=3');
      return response.data.data || [];
    },
    enabled: !!user,
  });

  // Real-time synchronization
  useEffect(() => {
    if (socket) {
      const handleActivity = (newActivity) => {
        // Optimistically update dashboard stats and activity feed
        queryClient.setQueryData(['dashboard-stats', user?.role], (old) => {
          if (!old) return old;
          if (!newActivity || !newActivity.action) return old;
          return {
            ...old,
            recentActivity: [newActivity, ...(old.recentActivity || [])].slice(0, 10)
          };
        });

        // Invalidate queries to fetch real-time updated numbers and projects
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-projects'] });
      };

      socket.on('activity-created', handleActivity);
      socket.on('project-created', handleActivity);
      socket.on('project-updated', handleActivity);
      socket.on('project-deleted', handleActivity);
      socket.on('stage-updated', handleActivity);
      socket.on('task-created', handleActivity);
      socket.on('task-updated', handleActivity);
      socket.on('task-deleted', handleActivity);

      return () => {
        socket.off('activity-created', handleActivity);
        socket.off('project-created', handleActivity);
        socket.off('project-updated', handleActivity);
        socket.off('project-deleted', handleActivity);
        socket.off('stage-updated', handleActivity);
        socket.off('task-created', handleActivity);
        socket.off('task-updated', handleActivity);
        socket.off('task-deleted', handleActivity);
      };
    }
  }, [socket, user?.role, queryClient]);

  const isLoading = statsLoading || projectsLoading;

  if (isLoading) return <DashboardSkeleton />;

  const recentActivity = stats?.recentActivity || [
    { title: "Project Sync Complete", time: "2m ago", type: "sprint" },
    { title: "New Requirements Uploaded", time: "1h ago", type: "docs" },
    { title: "QA Testing Initialized", time: "3h ago", type: "task" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 sm:space-y-10">
        {/* Welcome Hero */}
        <section className="relative glass-card p-6 sm:p-10 overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none hidden sm:block">
            <Rocket className="w-40 h-40 text-primary rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-black text-premium mb-3 sm:mb-4 leading-tight"
            >
              Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!
            </motion.h2>
            <p className="text-white/50 text-base sm:text-lg font-medium leading-relaxed mb-6 sm:mb-8">
              You're currently leading <span className="text-primary font-bold">{organization?.name}</span>. 
              Team velocity is up <span className="text-green-400">12%</span> this week. Keep up the momentum!
            </p>
            
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
                <Link to="/projects?new=true" className="btn-primary-premium flex items-center justify-center gap-2 text-sm sm:text-base px-5 py-3">
                  <Plus className="w-5 h-5 flex-shrink-0" /> New Project
                </Link>
              )}
              <Link to="/sprints" className="glass px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-sm sm:text-base">
                Active Sprints <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {user?.role === 'SUPER_ADMIN' ? (
            <>
              <StatCard 
                label="Total Projects" 
                value={stats?.totalProjects} 
                icon={<Rocket className="w-5 h-5 flex-shrink-0" />} 
                trend="+3 this week"
                color="blue"
              />
              <StatCard 
                label="Delayed Sprints" 
                value={stats?.delayedProjects} 
                icon={<Clock className="w-5 h-5 flex-shrink-0" />} 
                trend="Check deadlines"
                color="red"
                warning={stats?.delayedProjects > 0}
              />
              <StatCard 
                label="Pending Approvals" 
                value={stats?.pendingApprovals} 
                icon={<AlertCircle className="w-5 h-5 flex-shrink-0" />} 
                trend="Requires action"
                color="orange"
              />
              <StatCard 
                label="Missing Logs" 
                value={stats?.dailyLogsMissingToday} 
                icon={<FileCheck className="w-5 h-5 flex-shrink-0" />} 
                trend="Expected today"
                color="emerald"
              />
            </>
          ) : (
            <>
              <StatCard 
                label="My Projects" 
                value={stats?.assignedProjects} 
                icon={<Rocket className="w-5 h-5 flex-shrink-0" />} 
                trend="Active"
                color="blue"
              />
              <StatCard 
                label="Open Tasks" 
                value={stats?.pendingTasks} 
                icon={<Clock className="w-5 h-5 flex-shrink-0" />} 
                trend="Due soon"
                color="orange"
              />
              <StatCard 
                label="Daily Logs" 
                value={stats?.dailyLogsPending} 
                icon={<Activity className="w-5 h-5 flex-shrink-0" />} 
                trend={stats?.dailyLogsPending > 0 ? "Pending" : "Completed"}
                color="red"
                warning={stats?.dailyLogsPending > 0}
              />
              <StatCard 
                label="Tests Assigned" 
                value={stats?.testingAssignments} 
                icon={<AlertCircle className="w-5 h-5 flex-shrink-0" />} 
                trend="QA Pipeline"
                color="cyan"
              />
            </>
          )}
        </section>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Chart Section */}
          <section className={`${['SUPER_ADMIN', 'ADMIN'].includes(user?.role) ? 'lg:col-span-2' : 'lg:col-span-3'} glass-card p-6 sm:p-8`}>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-10">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-premium">Team Velocity</h3>
                <p className="text-white/40 text-xs sm:text-sm">Sprint performance over the last 7 days</p>
              </div>
              <select className="glass bg-[#0F172A] sm:bg-transparent text-xs font-bold px-3 sm:px-4 py-2 rounded-lg border-white/10 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            
            <div className="h-[220px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563EB" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Activity Pulse - Only for Admins */}
          {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
            <section className="glass-card p-6 sm:p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-premium">Activity Pulse</h3>
                <Link to="/activity" className="text-primary text-xs font-bold hover:underline">See All</Link>
              </div>
              
              <div className="space-y-6 flex-1">
                {recentActivity.map((activity, idx) => (
                  <ActivityItem 
                    key={idx}
                    title={activity.title || activity.description}
                    time={activity.time || "Recently"}
                    type={activity.type || activity.action}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Recent Projects Grid */}
        <section>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-premium">Recent Projects</h3>
            <Link to="/projects" className="text-primary font-bold text-sm sm:text-base flex items-center gap-2 hover:underline">
              View Workspace <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.length > 0 ? projects.map(p => (
              <ProjectCard 
                key={p._id}
                id={p._id}
                name={p.name} 
                status={p.status} 
                progress={p.progressPercent} 
                team={p.assignedUserIds?.length || 0}
                tag={p.currentStage}
              />
            )) : (
              <div className="col-span-full glass-card p-12 text-center">
                <p className="text-white/40">
                  {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) 
                    ? "No projects found. Create one to get started!" 
                    : "No projects found. Contact your administrator to get assigned to a project."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


function StatCard({ label, value, icon, trend, color, warning }) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          {icon}
        </div>
        {warning && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-widest truncate">{label}</p>
        <h4 className="text-2xl sm:text-3xl font-black text-premium">{value || 0}</h4>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors[color]}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function ProjectCard({ id, name, status, progress, team, tag }) {
  return (
    <Link to={`/projects/${id}`} className="glass-card p-5 sm:p-6 group cursor-pointer">
      <div className="flex justify-between items-start mb-6 gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block truncate">{tag}</span>
          <h4 className="text-lg sm:text-xl font-bold text-premium group-hover:text-primary transition-colors truncate">{name}</h4>
        </div>
        <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all flex-shrink-0">
          <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
          <span className="text-white/40 uppercase tracking-widest text-[10px]">Progress</span>
          <span className="text-premium">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-accent relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>
        
        <div className="pt-4 flex justify-between items-center border-t border-white/5 gap-2">
          <div className="flex -space-x-2">
            {[...Array(Math.min(team, 3))].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111827] bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            {team > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#111827] bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white/40">
                +{team - 3}
              </div>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg glass border border-white/5 flex-shrink-0 ${
            status === 'In Progress' ? 'text-blue-400' : status === 'Testing' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {status}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ title, time, type }) {
  return (
    <div className="flex gap-4 group cursor-pointer items-start">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
          <Activity className="w-4 h-4 text-white/30 group-hover:text-primary" />
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-white/5 last:hidden" />
      </div>
      <div className="min-w-0 flex-1">
        <h5 className="text-sm font-bold text-premium group-hover:text-primary transition-colors leading-snug">{title}</h5>
        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">{time}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl"></div>
          <div className="h-96 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;