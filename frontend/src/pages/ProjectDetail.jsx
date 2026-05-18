import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import {
  formatStage,
  formatStatus,
  formatPriority,
  getStatusColor,
  getPriorityColor,
  formatDate,
  getStageStatusColor
} from '../utils/formatters';
import { STAGE_ORDER } from '../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Calendar, 
  Layout, 
  Users, 
  Activity, 
  ChevronLeft, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  X
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { toast } from 'sonner';

function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const socket = useSocket();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', userType: 'DEVELOPER' });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    moduleWorkedOn: '',
    tasksCompleted: '',
    pendingTasks: '',
    hoursWorked: 8,
    issuesBlockers: '',
    notes: ''
  });

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Real-time synchronization
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-project', id);
      
      socket.on('project-updated', (updatedProject) => {
        if (updatedProject._id === id || updatedProject.id === id) {
          setProject(prev => ({ ...prev, ...updatedProject }));
          toast.info('Project data updated in real-time');
        }
      });

      socket.on('stage-updated', ({ stage }) => {
        fetchProject();
        toast.info(`Stage ${formatStage(stage.stageType)} updated`);
      });

      socket.on('log-created', (newLog) => {
        if (activeTab === 'daily-log') {
          setDailyLogs(prev => [newLog, ...prev]);
        }
        toast.info('New daily log submitted by team member');
      });

      return () => {
        socket.off('project-updated');
        socket.off('stage-updated');
        socket.off('log-created');
      };
    }
  }, [socket, id, activeTab]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data);
    } catch (err) {
      console.error('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLogs = async () => {
    try {
      const res = await api.get(`/projects/${id}/daily-logs`);
      setDailyLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch daily logs');
    }
  };

  useEffect(() => {
    if (activeTab === 'daily-log') {
      fetchDailyLogs();
    }
  }, [activeTab, id]);

  const handleApproveStage = async (stageType) => {
    try {
      await api.post(`/projects/${id}/stages/${stageType}/approve`, {});
      toast.success('Stage approved successfully');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve stage');
    }
  };

  const handleRejectStage = async (stageType) => {
    const notes = prompt('Enter rejection notes:');
    if (!notes) return;
    try {
      await api.post(`/projects/${id}/stages/${stageType}/reject`, { rejectionNotes: notes });
      toast.success('Stage rejected');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to reject stage');
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/daily-logs`, {
        ...logForm,
        date: new Date(logForm.date).toISOString()
      });
      setShowLogForm(false);
      setLogForm({
        date: new Date().toISOString().split('T')[0],
        moduleWorkedOn: '',
        tasksCompleted: '',
        pendingTasks: '',
        hoursWorked: 8,
        issuesBlockers: '',
        notes: ''
      });
      fetchDailyLogs();
      toast.success('Daily log submitted');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit log');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, newMember);
      setShowAddMember(false);
      setNewMember({ name: '', email: '', userType: 'DEVELOPER' });
      fetchProject();
      toast.success('Team member added');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add member');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!project) return <NotFound />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'stages', label: 'Lifecycle', icon: Activity },
    { id: 'daily-log', label: 'Daily Logs', icon: Clock },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link to="/projects" className="p-2 sm:p-2.5 glass rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white flex-shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 truncate">Project Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-premium tracking-tight truncate">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to={`/projects/${id}/sprint-board`}
              className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 text-sm sm:text-base"
            >
              <Layout className="w-5 h-5 flex-shrink-0" /> Sprint Board
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 p-1.5 glass rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tabId
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-premium mb-4 sm:mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" /> Project Description
                  </h3>
                  <p className="text-white/60 leading-relaxed text-base sm:text-lg">{project.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold text-premium mb-6">Execution Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Current Phase</span>
                        <span className="text-primary font-black uppercase text-xs">{formatStage(project.currentStage)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Overall Progress</span>
                        <span className="text-premium font-black text-xs">{project.progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${project.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold text-premium mb-6">Key Attributes</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Priority</span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getPriorityStyle(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Client</span>
                        <span className="text-premium font-bold truncate max-w-[180px]">{project.clientName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-premium mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" /> Timeline
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl glass border border-white/5 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-white/20" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">Start Date</p>
                        <p className="text-premium font-bold truncate">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl glass border border-white/5 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-orange-500/20" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">Deadline</p>
                        <p className="text-premium font-bold truncate">{formatDate(project.deadline)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stages' && (
            <motion.div
              key="stages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {project.stages?.map((stage, index) => {
                const isCurrent = project.currentStage === stage.stageType;
                return (
                  <div 
                    key={stage._id}
                    className={`glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-l-4 ${
                      isCurrent ? 'border-primary' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        stage.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/20'
                      }`}>
                        {stage.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <Activity className="w-6 h-6 flex-shrink-0" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-premium truncate">{formatStage(stage.stageType)}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                            Status: <span className="text-white/60">{stage.status}</span>
                          </span>
                          {stage.completedAt && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                              Completed: <span className="text-white/60">{formatDate(stage.completedAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCurrent && stage.status === 'IN_PROGRESS' && ['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
                      <div className="flex gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <button 
                          onClick={() => handleRejectStage(stage.stageType)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 glass text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApproveStage(stage.stageType)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 bg-primary text-xs font-bold text-white hover:bg-primary/90 rounded-lg transition-all"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'daily-log' && (
            <motion.div
              key="daily-log"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl sm:text-2xl font-black text-premium">Daily Performance Logs</h3>
                <button 
                  onClick={() => setShowLogForm(true)}
                  className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2.5"
                >
                  <Plus className="w-5 h-5 flex-shrink-0" /> New Log Entry
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dailyLogs.length > 0 ? dailyLogs.map((log) => (
                  <div key={log._id} className="glass-card p-6 flex flex-col md:flex-row gap-6">
                    <div className="md:w-48 flex-shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{formatDate(log.date)}</p>
                      <h4 className="text-lg font-bold text-premium mt-1">{log.moduleWorkedOn}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-white/20" />
                        <span className="text-xs font-bold text-white/40">{log.hoursWorked} Hours</span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 md:border-l md:border-white/5 md:pl-6 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Accomplishments</p>
                        <p className="text-sm text-white/70 leading-relaxed">{log.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Pending / Blockers</p>
                        <p className="text-sm text-white/70 leading-relaxed">{log.pendingTasks}</p>
                        {log.issuesBlockers && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                            {log.issuesBlockers}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="glass-card p-12 sm:p-20 text-center">
                    <Activity className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm sm:text-base">No logs submitted yet for this project.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl sm:text-2xl font-black text-premium">Team Assembly</h3>
                {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
                  <button 
                    onClick={() => setShowAddMember(true)}
                    className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2.5"
                  >
                    <Plus className="w-5 h-5 flex-shrink-0" /> Assign Member
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.assignedUserIds?.map((member) => (
                  <div key={member._id} className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                      {member.fullName?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg font-bold text-premium truncate">{member.fullName}</h4>
                      <p className="text-xs text-white/40 truncate">{member.email}</p>
                      <div className="mt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-white/30 inline-block">
                          {member.userType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Daily Log Modal */}
      <AnimatePresence>
        {showLogForm && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-black text-premium">Submit Work Log</h3>
                <button onClick={() => setShowLogForm(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleLogSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Date</label>
                      <input 
                        type="date" 
                        required 
                        className="glass-input w-full h-12 text-sm font-bold" 
                        value={logForm.date} 
                        onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Hours</label>
                      <input 
                        type="number" 
                        required 
                        className="glass-input w-full h-12 text-sm font-bold" 
                        value={logForm.hoursWorked} 
                        onChange={(e) => setLogForm({...logForm, hoursWorked: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Module / Feature</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Authentication, Dashboard API"
                      className="glass-input w-full h-12 text-sm" 
                      value={logForm.moduleWorkedOn} 
                      onChange={(e) => setLogForm({...logForm, moduleWorkedOn: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Completed Tasks</label>
                    <textarea 
                      required 
                      placeholder="Describe everything accomplished today..."
                      className="glass-input w-full min-h-[100px] py-4 text-sm resize-none" 
                      value={logForm.tasksCompleted} 
                      onChange={(e) => setLogForm({...logForm, tasksCompleted: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Pending / Next Steps</label>
                    <textarea 
                      required 
                      placeholder="What is planned for tomorrow?"
                      className="glass-input w-full min-h-[100px] py-4 text-sm resize-none" 
                      value={logForm.pendingTasks} 
                      onChange={(e) => setLogForm({...logForm, pendingTasks: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Blockers (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Any blockers or open questions?"
                      className="glass-input w-full h-12 text-sm" 
                      value={logForm.issuesBlockers} 
                      onChange={(e) => setLogForm({...logForm, issuesBlockers: e.target.value})}
                    />
                  </div>
                </div>
                <div className="px-6 sm:px-8 py-5 border-t border-white/5 flex gap-4 bg-[#111827]/50 flex-shrink-0">
                  <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 h-12 sm:h-14 rounded-xl font-bold text-white/40 hover:bg-white/5 text-sm sm:text-base">Cancel</button>
                  <button type="submit" className="flex-[2] h-12 sm:h-14 btn-primary-premium text-sm sm:text-base">Submit Log Entry</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-black text-premium">Assign Member</h3>
                <button onClick={() => setShowAddMember(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sarah Connor"
                      className="glass-input w-full h-12 text-sm font-bold" 
                      value={newMember.name} 
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="sarah@company.com"
                      className="glass-input w-full h-12 text-sm" 
                      value={newMember.email} 
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Role Type</label>
                    <select 
                      className="glass-input w-full h-12 text-sm font-bold bg-no-repeat bg-[right_1rem_center]" 
                      value={newMember.userType} 
                      onChange={(e) => setNewMember({...newMember, userType: e.target.value})}
                    >
                      <option value="DEVELOPER">Developer</option>
                      <option value="TESTER">Tester</option>
                      <option value="UI_UX_DESIGNER">UI/UX Designer</option>
                      <option value="DEPLOYMENT_MANAGER">Deployment Manager</option>
                      <option value="PROJECT_COORDINATOR">Project Coordinator</option>
                    </select>
                  </div>
                </div>
                <div className="px-6 sm:px-8 py-5 border-t border-white/5 bg-[#111827]/50 flex-shrink-0">
                  <button type="submit" className="w-full h-12 sm:h-14 btn-primary-premium text-sm sm:text-base">Add to Project</button>
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

function DetailSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-white/5 rounded-2xl"></div>
        <div className="h-14 w-64 bg-white/5 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl"></div>
          <div className="h-96 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function NotFound() {
  return (
    <DashboardLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="w-16 h-16 text-white/10 mb-6" />
        <h2 className="text-2xl sm:text-3xl font-black text-premium mb-2">Project Not Found</h2>
        <p className="text-white/40 mb-8 max-w-md text-sm sm:text-base">The project you are looking for does not exist or has been removed.</p>
        <Link to="/projects" className="btn-primary-premium px-8 py-3.5">Back to Workspace</Link>
      </div>
    </DashboardLayout>
  );
}

export default ProjectDetail;