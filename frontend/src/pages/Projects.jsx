import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Briefcase,
  Calendar,
  Users,
  Layout,
  Clock,
  X
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  formatStage,
  formatStatus,
  formatPriority,
  getStatusColor,
  getPriorityColor
} from '../utils/formatters';

function Projects() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === 'true');
  const [form, setForm] = useState({
    name: '',
    clientName: '',
    description: '',
    priority: 'MEDIUM',
    startDate: '',
    deadline: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      const response = await api.get(`/projects?${params}`);
      setProjects(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };
      await api.post('/projects', payload);
      setShowCreate(false);
      setForm({
        name: '',
        clientName: '',
        description: '',
        priority: 'MEDIUM',
        startDate: '',
        deadline: '',
      });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create project');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Workspaces</span>
            </div>
            <h1 className="text-4xl font-black text-premium tracking-tight">Projects</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="glass-input pl-10 h-12 w-64 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="glass p-3 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-white">
              <Filter className="w-5 h-5" />
            </button>
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary-premium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> New Project
              </button>
            )}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Briefcase className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-xl font-bold text-premium mb-2">No projects found</h3>
            <p className="text-white/40 max-w-xs mx-auto">Try adjusting your search or create a new project to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={project._id}
              >
                <Link
                  to={`/projects/${project._id}`}
                  className="glass-card p-8 flex flex-col h-full group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getPriorityStyle(project.priority)}`}>
                      {formatPriority(project.priority)}
                    </span>
                    <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                      <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-primary" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-premium group-hover:text-primary transition-colors mb-2 leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-white/40 text-sm font-medium mb-6 line-clamp-2">Client: {project.clientName}</p>

                  <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Status</span>
                        <div className="text-xs font-bold text-premium">{formatStatus(project.status)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Progress</span>
                        <div className="text-xs font-bold text-primary">{project.progressPercent}%</div>
                      </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" 
                        style={{ width: `${project.progressPercent}%` }} 
                      />
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          {formatStage(project.currentStage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)]"
            >
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-premium">Create Project</h3>
                  <p className="text-white/40 text-sm font-medium">Set up a new workspace for your team</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Phoenix SaaS"
                      className="glass-input w-full h-12 text-sm font-bold"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Client Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Acme Corp"
                      className="glass-input w-full h-12 text-sm font-bold"
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Project Overview</label>
                  <textarea
                    required
                    placeholder="Describe the project goals and scope..."
                    className="glass-input w-full min-h-[100px] py-4 text-sm font-medium resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Priority</label>
                    <select
                      className="glass-input w-full h-12 text-sm font-bold appearance-none"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Start Date</label>
                    <input
                      type="date"
                      required
                      className="glass-input w-full h-12 text-sm font-bold"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Deadline</label>
                    <input
                      type="date"
                      required
                      className="glass-input w-full h-12 text-sm font-bold"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 h-14 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] h-14 btn-primary-premium flex items-center justify-center gap-2"
                  >
                    Initialize Workspace <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function getPriorityStyle(priority) {
  const styles = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return styles[priority] || styles.MEDIUM;
}

export default Projects;