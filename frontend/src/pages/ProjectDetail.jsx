import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from '../contexts/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Rocket,
  X
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { toast } from 'sonner';

function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', userType: 'DEVELOPER' });
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
  const [showEditDeployment, setShowEditDeployment] = useState(false);
  const [deploymentForm, setDeploymentForm] = useState({
    gitLink: '',
    vercelBackendLink: '',
    vercelFrontendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: ''
  });
  const [orgMembers, setOrgMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Link Upload & Workspace Feature States
  const [showFileForm, setShowFileForm] = useState(false);
  const [fileForm, setFileForm] = useState({ fileName: '', googleDriveLink: '', linkedEntityType: 'REQUIREMENT' });

  const [showTestingForm, setShowTestingForm] = useState(false);
  const [testingForm, setTestingForm] = useState({ testCaseId: '', moduleTested: '', bugDescription: '', reproductionSteps: '', severity: 'MEDIUM', googleDriveLink: '' });

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ issueTitle: '', description: '', severity: 'MEDIUM', googleDriveLink: '' });

  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureForm, setFeatureForm] = useState({ title: '', description: '', googleDriveLink: '' });

  // Use React Query for lightning fast cached fetching
  const { data: project, isLoading: loading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['project-files', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/files`);
      return response.data.data || [];
    },
    enabled: !!id && activeTab === 'files',
  });

  const { data: testingReports = [] } = useQuery({
    queryKey: ['project-testing', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/testing-reports`);
      return response.data.data || [];
    },
    enabled: !!id && activeTab === 'testing',
  });

  const { data: maintenanceLogs = [] } = useQuery({
    queryKey: ['project-maintenance', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/maintenance-logs`);
      return response.data.data || [];
    },
    enabled: !!id && activeTab === 'maintenance',
  });

  const { data: featureRequests = [] } = useQuery({
    queryKey: ['project-features', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/feature-requests`);
      return response.data.data || [];
    },
    enabled: !!id && activeTab === 'features',
  });

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['project-daily-logs', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/daily-logs`);
      return response.data.data || [];
    },
    enabled: !!id && activeTab === 'daily-log',
  });

  const handleAddFile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${id}/files`, fileForm);
      queryClient.setQueryData(['project-files', id], prev => [res.data.data, ...(prev || [])]);
      setFileForm({ fileName: '', googleDriveLink: '', linkedEntityType: 'REQUIREMENT' });
      setShowFileForm(false);
      toast.success('Document uploaded successfully! 🚀');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload document');
    }
  };

  const handleAddTestingReport = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${id}/testing-reports`, testingForm);
      queryClient.setQueryData(['project-testing', id], prev => [res.data.data, ...(prev || [])]);
      setTestingForm({ testCaseId: '', moduleTested: '', bugDescription: '', reproductionSteps: '', severity: 'MEDIUM', googleDriveLink: '' });
      setShowTestingForm(false);
      toast.success('Testing report uploaded successfully! 🎯');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload testing report');
    }
  };

  const handleAddMaintenanceLog = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${id}/maintenance-logs`, maintenanceForm);
      queryClient.setQueryData(['project-maintenance', id], prev => [res.data.data, ...(prev || [])]);
      setMaintenanceForm({ issueTitle: '', description: '', severity: 'MEDIUM', googleDriveLink: '' });
      setShowMaintenanceForm(false);
      toast.success('Maintenance issue logged successfully! 🔧');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to log maintenance issue');
    }
  };

  const handleResolveMaintenance = async (logId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'OPEN' ? 'RESOLVED' : 'CLOSED';
      const res = await api.patch(`/projects/${id}/maintenance-logs/${logId}`, { status: nextStatus, resolutionNotes: 'Resolved by ' + user?.fullName });
      queryClient.setQueryData(['project-maintenance', id], prev => prev?.map(log => log._id === logId ? res.data.data : log));
      toast.success(`Maintenance log marked as ${nextStatus}! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update maintenance log');
    }
  };

  const handleAddFeatureRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${id}/feature-requests`, featureForm);
      queryClient.setQueryData(['project-features', id], prev => [res.data.data, ...(prev || [])]);
      setFeatureForm({ title: '', description: '', googleDriveLink: '' });
      setShowFeatureForm(false);
      toast.success('Feature enhancement request added successfully! 🚀');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add feature request');
    }
  };

  const fetchOrgMembers = async () => {
    try {
      const res = await api.get('/auth/members');
      setOrgMembers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch organization members', err);
    }
  };

  useEffect(() => {
    if (showAddMember) {
      fetchOrgMembers();
      setSelectedMemberId('');
      setNewMember({ name: '', email: '', userType: 'DEVELOPER' });
    }
  }, [showAddMember]);

  useEffect(() => {
    if (project) {
      setDeploymentForm({
        gitLink: project.gitLink || '',
        vercelBackendLink: project.vercelBackendLink || '',
        vercelFrontendLink: project.vercelFrontendLink || '',
        envDriveLink: project.envDriveLink || '',
        walkthroughVideoUrl: project.walkthroughVideoUrl || ''
      });
    }
  }, [project]);

  // Real-time synchronization
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-project', id);
      
      socket.on('project-updated', (updatedProject) => {
        if (updatedProject._id === id || updatedProject.id === id) {
          queryClient.setQueryData(['project', id], prev => prev ? ({ ...prev, ...updatedProject }) : updatedProject);
          toast.info('Project data updated in real-time');
        }
      });

      socket.on('stage-updated', ({ stage }) => {
        queryClient.invalidateQueries(['project', id]);
        toast.info(`Stage ${formatStage(stage.stageType)} updated`);
      });

      socket.on('log-created', (newLog) => {
        queryClient.setQueryData(['project-daily-logs', id], prev => [newLog, ...(prev || [])]);
        toast.info('New daily log submitted by team member');
      });

      return () => {
        socket.off('project-updated');
        socket.off('stage-updated');
        socket.off('log-created');
      };
    }
  }, [socket, id, queryClient]);

  const handleApproveStage = async (stageType) => {
    try {
      await api.post(`/projects/${id}/stages/${stageType}/approve`, {});
      toast.success('Stage approved successfully');
      queryClient.invalidateQueries(['project', id]);
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
      queryClient.invalidateQueries(['project', id]);
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
      queryClient.invalidateQueries(['project-daily-logs', id]);
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
      queryClient.invalidateQueries(['project', id]);
      toast.success('Team member added');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add member');
    }
  };

  const handleUpdateDeployment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`/projects/${id}`, deploymentForm);
      queryClient.setQueryData(['project', id], response.data.data);
      setShowEditDeployment(false);
      toast.success('Deployment details updated successfully! 🚀');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update deployment details');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!project) return <NotFound />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'stages', label: 'Lifecycle', icon: Activity },
    { id: 'daily-log', label: 'Daily Logs', icon: Clock },
    { id: 'files', label: 'Files & Docs', icon: FileText },
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
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-12">
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

                {/* Deployment Details Card */}
                <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10" />

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-premium flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-primary flex-shrink-0" /> Deployment & Environments
                    </h3>
                    {user?.role && (
                      <button
                        onClick={() => setShowEditDeployment(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 hover:underline transition-all flex items-center gap-1"
                      >
                        Edit Details
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Repository Link</span>
                        {project.gitLink ? (
                          <a
                            href={project.gitLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 truncate"
                          >
                            GitHub Repository <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-white/30 italic">Not configured</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Vercel Frontend Link</span>
                        {project.vercelFrontendLink ? (
                          <a
                            href={project.vercelFrontendLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 truncate"
                          >
                            Production Website <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-white/30 italic">Not configured</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Vercel Backend Link</span>
                        {project.vercelBackendLink ? (
                          <a
                            href={project.vercelBackendLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 truncate"
                          >
                            API Server / Backend <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-white/30 italic">Not configured</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">.env Google Drive Link</span>
                        {project.envDriveLink ? (
                          <a
                            href={project.envDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 truncate"
                          >
                            Google Drive Configuration Folder <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-white/30 italic">Not configured</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Walkthrough Video Link</span>
                        {project.walkthroughVideoUrl ? (
                          <a
                            href={project.walkthroughVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 truncate"
                          >
                            Watch Walkthrough Video <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-white/30 italic">Not configured</span>
                        )}
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
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              {project.stages?.map((stage, index) => {
                const isCurrent = project.currentStage === stage.stageType;
                const isApprovedOrCompleted = ['APPROVED', 'COMPLETED'].includes(stage.status);
                return (
                  <div 
                    key={stage._id}
                    className={`glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-l-4 ${
                      isCurrent ? 'border-primary' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isApprovedOrCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'
                      }`}>
                        {isApprovedOrCompleted ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <Activity className="w-6 h-6 flex-shrink-0" />}
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
                    {!isApprovedOrCompleted && ['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
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
            </div>
          )}

          {activeTab === 'daily-log' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl sm:text-2xl font-black text-premium">Files & Documents</h3>
                <button 
                  onClick={() => setShowFileForm(!showFileForm)}
                  className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2.5 px-5"
                >
                  <Plus className="w-5 h-5 flex-shrink-0" /> {showFileForm ? 'Close Form' : 'Upload Document Link'}
                </button>
              </div>

              {showFileForm && (
                <form onSubmit={handleAddFile} className="glass-card p-6 space-y-4 max-w-xl">
                  <h4 className="text-lg font-bold text-premium">Upload Document (Google Drive Link)</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Requirement Specification Document"
                      className="glass-input w-full h-11 text-sm font-semibold"
                      value={fileForm.fileName}
                      onChange={(e) => setFileForm({ ...fileForm, fileName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Google Drive Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      className="glass-input w-full h-11 text-sm font-semibold"
                      value={fileForm.googleDriveLink}
                      onChange={(e) => setFileForm({ ...fileForm, googleDriveLink: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-primary-premium w-full py-3 mt-2 text-sm">
                    Submit Link
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {files.length > 0 ? files.map(file => (
                  <div key={file._id} className="glass-card p-6 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-start mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                          <FileText className="w-6 h-6 flex-shrink-0" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-premium truncate mb-1">{file.fileName}</h4>
                      <p className="text-xs text-white/30 mb-4">Shared by {file.uploadedBy?.fullName || 'Team'}</p>
                    </div>
                    <a
                      href={file.storageKey}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary-premium flex items-center justify-center gap-2 py-2.5 text-xs"
                    >
                      View Document Link <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                )) : (
                  <div className="col-span-full glass-card p-12 text-center">
                    <p className="text-white/40">No files or documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Select Organization Member</label>
                    <select
                      className="glass-input w-full h-12 text-sm font-bold bg-no-repeat bg-[right_1rem_center] text-white"
                      value={selectedMemberId}
                      onChange={(e) => {
                        const memberId = e.target.value;
                        setSelectedMemberId(memberId);
                        if (memberId === '') {
                          setNewMember({ name: '', email: '', userType: 'DEVELOPER' });
                        } else {
                          const m = orgMembers.find(member => member._id === memberId);
                          if (m) {
                            setNewMember({ name: m.fullName, email: m.email, userType: m.userType || 'DEVELOPER' });
                          }
                        }
                      }}
                    >
                      <option value="" className="bg-[#111827] text-white">-- Choose an existing team member --</option>
                      {orgMembers.map(member => (
                        <option key={member._id} value={member._id} className="bg-[#111827] text-white">
                          {member.fullName} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMemberId && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass p-5 rounded-xl space-y-3 border border-primary/20 bg-primary/5"
                    >
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ready to Assign</div>
                      <div className="space-y-1">
                        <div className="text-lg font-black text-premium">{newMember.name}</div>
                        <div className="text-sm text-white/60 font-medium">{newMember.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 w-fit text-premium uppercase tracking-widest">
                        Role: {newMember.userType}
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="px-6 sm:px-8 py-5 border-t border-white/5 bg-[#111827]/50 flex-shrink-0">
                  <button 
                    type="submit" 
                    className="w-full h-12 sm:h-14 btn-primary-premium text-sm sm:text-base flex items-center justify-center gap-2"
                    disabled={!selectedMemberId}
                  >
                    Add Member to Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Deployment Details Modal */}
      <AnimatePresence>
        {showEditDeployment && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] border border-white/10"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-premium">Edit Deployment Details</h3>
                  <p className="text-white/40 text-xs sm:text-sm font-medium">Update repository and build environment specifications</p>
                </div>
                <button onClick={() => setShowEditDeployment(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all flex-shrink-0">
                  <X className="w-5 h-5 flex-shrink-0" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateDeployment} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Git Repository Link</label>
                    <input
                      type="text"
                      placeholder="e.g., https://github.com/org/repo"
                      className="glass-input w-full h-12 text-sm font-semibold"
                      value={deploymentForm.gitLink}
                      onChange={(e) => setDeploymentForm({ ...deploymentForm, gitLink: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Vercel Frontend Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://app.vercel.app"
                      className="glass-input w-full h-12 text-sm font-semibold"
                      value={deploymentForm.vercelFrontendLink}
                      onChange={(e) => setDeploymentForm({ ...deploymentForm, vercelFrontendLink: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Vercel Backend Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://api.vercel.app"
                      className="glass-input w-full h-12 text-sm font-semibold"
                      value={deploymentForm.vercelBackendLink}
                      onChange={(e) => setDeploymentForm({ ...deploymentForm, vercelBackendLink: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">.env Google Drive Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://drive.google.com/..."
                      className="glass-input w-full h-12 text-sm font-semibold"
                      value={deploymentForm.envDriveLink}
                      onChange={(e) => setDeploymentForm({ ...deploymentForm, envDriveLink: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Walkthrough Video Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://drive.google.com/file/d/... or YouTube link"
                      className="glass-input w-full h-12 text-sm font-semibold"
                      value={deploymentForm.walkthroughVideoUrl}
                      onChange={(e) => setDeploymentForm({ ...deploymentForm, walkthroughVideoUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-5 border-t border-white/5 flex gap-4 bg-[#111827]/50 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditDeployment(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] h-12 btn-primary-premium flex items-center justify-center gap-2 text-sm"
                  >
                    Save Changes
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