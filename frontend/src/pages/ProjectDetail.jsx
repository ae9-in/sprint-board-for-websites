import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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

function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', userType: 'DEVELOPER' });

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, newMember);
      setShowAddMember(false);
      setNewMember({ name: '', email: '', userType: 'DEVELOPER' });
      fetchProject(); // refresh the list
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add member');
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

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

  const handleApproveStage = async (stageType) => {
    try {
      await api.post(`/projects/${id}/stages/${stageType}/approve`, {});
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve stage');
    }
  };

  const handleRejectStage = async (stageType) => {
    const notes = prompt('Enter rejection notes:');
    if (!notes) return;
    try {
      await api.post(`/projects/${id}/stages/${stageType}/reject`, { rejectionNotes: notes });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reject stage');
    }
  };

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
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit log');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Project not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/projects" className="text-gray-600 hover:text-gray-900">
              ← Projects
            </Link>
            <h1 className="text-lg md:text-xl font-bold break-all">{project.name}</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link
              to={`/projects/${id}/sprint-board`}
              className="w-full md:w-auto text-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Sprint Board
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 mb-6 border-b whitespace-nowrap">
          {['overview', 'stages', 'daily-log', 'team'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-2 -mb-px border-b-2 text-sm md:text-base transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Project Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client</span>
                  <span className="font-medium">{project.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority</span>
                  <span className="font-medium">{project.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Stage</span>
                  <span className="font-medium">{formatStage(project.currentStage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-medium">
                    {formatDate(project.startDate) || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline</span>
                  <span className="font-medium">
                    {formatDate(project.deadline) || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Progress</h3>
              <div className="text-3xl font-bold text-primary mb-2">{project.progressPercent}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">{project.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">Project Stages</h3>
            <div className="space-y-4">
              {project.stages?.map((stage, index) => {
                const isCurrentStage = project.currentStage === stage.stageType;
                const isPastStage = STAGE_ORDER.indexOf(project.currentStage) > index;

                return (
                  <div
                    key={stage._id}
                    className={`p-4 border rounded-lg ${isCurrentStage ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{formatStage(stage.stageType)}</h4>
                        {stage.startedAt && (
                          <p className="text-xs text-gray-500">
                            Started: {formatDate(stage.startedAt)}
                          </p>
                        )}
                        {stage.completedAt && (
                          <p className="text-xs text-gray-500">
                            Completed: {formatDate(stage.completedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStageStatusColor(stage.status)}`}>
                          {stage.status}
                        </span>
                        {isCurrentStage && stage.status === 'IN_PROGRESS' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveStage(stage.stageType)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectStage(stage.stageType)}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {stage.approvalNotes && (
                      <p className="text-sm text-gray-600 mt-2">Notes: {stage.approvalNotes}</p>
                    )}
                    {stage.rejectionNotes && (
                      <p className="text-sm text-red-600 mt-2">Rejection: {stage.rejectionNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'daily-log' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Daily Work Logs</h3>
              <button
                onClick={() => setShowLogForm(true)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                + Submit Daily Log
              </button>
            </div>

            {showLogForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-4">Submit Daily Log</h4>
                <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full p-2 border rounded"
                        value={logForm.date}
                        onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Module</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Auth, Dashboard"
                        className="w-full p-2 border rounded"
                        value={logForm.moduleWorkedOn}
                        onChange={(e) => setLogForm({ ...logForm, moduleWorkedOn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hours Worked</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="24"
                        step="0.5"
                        className="w-full p-2 border rounded"
                        value={logForm.hoursWorked}
                        onChange={(e) => setLogForm({ ...logForm, hoursWorked: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tasks Completed</label>
                    <textarea
                      required
                      className="w-full p-2 border rounded"
                      rows="2"
                      value={logForm.tasksCompleted}
                      onChange={(e) => setLogForm({ ...logForm, tasksCompleted: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pending Tasks</label>
                    <textarea
                      required
                      className="w-full p-2 border rounded"
                      rows="2"
                      value={logForm.pendingTasks}
                      onChange={(e) => setLogForm({ ...logForm, pendingTasks: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowLogForm(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded"
                    >
                      Submit Log
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {dailyLogs.length > 0 ? (
                dailyLogs.map((log) => (
                  <div key={log._id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-semibold text-primary">{formatDate(log.date)}</div>
                        <div className="font-medium">{log.moduleWorkedOn}</div>
                      </div>
                      <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {log.hoursWorked} hrs
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-gray-600 mb-1">Completed</div>
                        <p className="text-gray-800">{log.tasksCompleted}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-600 mb-1">Pending</div>
                        <p className="text-gray-800">{log.pendingTasks}</p>
                      </div>
                    </div>
                    {log.issuesBlockers && (
                      <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded">
                        <span className="font-semibold">Blockers:</span> {log.issuesBlockers}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border text-gray-500">
                  No daily logs submitted yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Team Members</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary/90"
                >
                  + Add Member
                </button>
            </div>
            {project.assignedUserIds?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.assignedUserIds.map((member) => (
                  <div key={member._id} className="flex items-center gap-3 p-3 border rounded">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                      {member.fullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">{member.userType}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No team members assigned</p>
            )}
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newMember.userType}
                    onChange={(e) => setNewMember({ ...newMember, userType: e.target.value })}
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="TESTER">Tester</option>
                    <option value="UI_UX_DESIGNER">UI/UX Designer</option>
                    <option value="DEPLOYMENT_MANAGER">Deployment Manager</option>
                    <option value="PROJECT_COORDINATOR">Project Coordinator</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;