import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

function Dashboard() {
  const { user, organization, clearAuth } = useAuthStore();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    // For now, fetch basic project count
    const fetchStats = async () => {
      try {
        const response = await api.get('/projects?limit=100');
        const projects = response.data.data || [];
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
          completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
          pendingApprovals: 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('refreshToken');
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold">Sprint Board</h1>
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {organization?.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user?.fullName}</span>
              <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-wider font-semibold">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium ml-2 md:ml-0"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {user?.fullName}!</h2>
          <p className="text-gray-600">Here's an overview of your projects</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl font-bold text-primary">{stats.totalProjects}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl font-bold text-green-600">{stats.activeProjects}</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl font-bold text-blue-600">{stats.completedProjects}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</div>
            <div className="text-sm text-gray-600">Pending Approvals</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/projects"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2">View Projects</h3>
            <p className="text-gray-600 text-sm">
              Browse and manage all your projects
            </p>
          </Link>

          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/projects?new=true"
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-2">Create New Project</h3>
              <p className="text-gray-600 text-sm">
                Start a new project and invite team members
              </p>
            </Link>
          )}
        </div>

        {/* Recent Projects (placeholder) */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Recent Projects</h3>
          </div>
          <div className="p-4 text-center text-gray-500">
            <Link to="/projects" className="text-primary hover:underline">
              View all projects
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;