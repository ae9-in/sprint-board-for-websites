import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect, lazy, Suspense } from 'react';
import { useSocketStore } from './stores/socketStore';
import { Toaster } from 'sonner';

// Lazy load route pages for chunk optimization
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const SprintBoard = lazy(() => import('./pages/SprintBoard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Team = lazy(() => import('./pages/Team'));
const Activity = lazy(() => import('./pages/Activity'));
const Settings = lazy(() => import('./pages/Settings'));
const SprintList = lazy(() => import('./pages/Sprint'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Premium visual placeholder during chunk loading
function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#0F172A] flex items-center justify-center z-[999]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, organization } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      connect(organization.id);
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isAuthenticated, organization?.id]);

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/invite/accept/:token" element={<AcceptInvite />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/sprint-board"
            element={
              <ProtectedRoute>
                <SprintBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sprints"
            element={
              <ProtectedRoute>
                <SprintList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;