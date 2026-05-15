import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Layers, Plus, Calendar, Target, X, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

function SprintsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects?limit=50');
      setProjects(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Projects</span>
          </div>
          <h1 className="text-4xl font-black text-premium tracking-tight">Sprint Boards</h1>
          <p className="text-white/40 font-medium mt-2">Select a project to manage its sprint board</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-20 text-center">
            <Layers className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-premium mb-2">No projects yet</h3>
            <p className="text-white/40 mb-6">Create a project first to manage its sprint board.</p>
            <Link to="/projects" className="btn-primary-premium inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Go to Projects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/projects/${project._id}/sprint-board`}
                  className="glass-card p-8 flex flex-col group h-full"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center group-hover:bg-primary/10 transition-all">
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-premium group-hover:text-primary transition-colors mb-1 leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-white/40 text-sm mb-4">Client: {project.clientName}</p>
                  <div className="mt-auto space-y-3">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${project.progressPercent || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sprint Progress</span>
                      <span className="text-xs font-bold text-primary">{project.progressPercent || 0}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SprintsPage;
