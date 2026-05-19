import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  Bell, 
  Search, 
  LogOut, 
  Menu, 
  X,
  Rocket,
  ChevronRight,
  Activity,
  Layers,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DashboardLayout = ({ children }) => {
  const { user, organization, clearAuth } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
      localStorage.removeItem('refreshToken');
      clearAuth();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      clearAuth();
      navigate('/login');
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: Layers, label: 'Sprints', path: '/sprints' },
    { 
      icon: Users, 
      label: 'Team', 
      path: '/team',
      adminOnly: true 
    },
    { 
      icon: Activity, 
      label: 'Activity', 
      path: '/activity',
      adminOnly: true 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings',
      adminOnly: true 
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !['SUPER_ADMIN', 'ADMIN'].includes(user?.role)) {
      return false;
    }
    return true;
  });

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className="h-20 flex items-center px-6 gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        {(isSidebarOpen || mobile) && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold tracking-tight text-premium truncate"
          >
            SprintBoard
          </motion.span>
        )}
        {mobile && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto p-2 glass rounded-lg lg:hidden">
            <X className="w-5 h-5 text-white/50" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
              {(isSidebarOpen || mobile) && (
                <span className="font-bold tracking-tight text-sm truncate">{item.label}</span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute right-0 w-1 h-6 bg-primary rounded-l-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass p-4 rounded-2xl flex items-center gap-3 overflow-hidden transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center font-black text-blue-400 flex-shrink-0">
            {organization?.name?.[0] || 'W'}
          </div>
          {(isSidebarOpen || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest truncate">Workspace</p>
              <p className="font-bold truncate text-premium">{organization?.name || 'Loading...'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex overflow-hidden">
      <div className="premium-bg">
        <div className="premium-mesh" />
        <div className="premium-grid" />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay to close drawer on outside click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[100] lg:hidden glass backdrop-blur-2xl flex flex-col w-80 max-w-[85vw] border-r border-white/10 shadow-2xl bg-[#0F172A]/90"
            >
              <SidebarContent mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } hidden lg:flex flex-col glass border-r border-white/5 transition-all duration-500 relative z-30 flex-shrink-0`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Navigation */}
        <header className="h-20 glass border-b border-white/5 px-4 lg:px-8 flex items-center justify-between relative z-20 gap-4">
          <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 glass rounded-xl hover:bg-white/10 transition-all flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>
            <div className="relative group flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="glass-input pl-10 h-11 w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
            <button className="relative p-2.5 rounded-xl glass hover:bg-white/10 transition-all group hidden sm:block">
              <Bell className="w-5 h-5 text-white/50 group-hover:text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0F172A]" />
            </button>

            <div className="h-8 w-px bg-white/5 hidden sm:block" />

            <div className="flex items-center gap-2.5 lg:gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-premium truncate max-w-[120px]">{user?.fullName}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{user?.role?.split('_')[0]}</span>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0">
                {user?.fullName?.[0]}
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl glass hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
