import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import {
  formatStage,
  formatStatus,
  formatPriority,
  getStatusColor,
  getPriorityColor
} from '../utils/formatters';

function Projects() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Projects</h1>
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              {showCreate ? 'Cancel' : 'New Project'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Create Project
              </button>
            </form>
          </div>
        )}

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No projects found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(project.priority)}`}>
                    {formatPriority(project.priority)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Client: {project.clientName}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                    {formatStatus(project.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {project.progressPercent}% complete
                  </span>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Stage: {formatStage(project.currentStage)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Projects;