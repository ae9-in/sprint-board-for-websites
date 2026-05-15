import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Lock, 
  Mail, 
  ArrowRight, 
  Github, 
  CheckCircle2,
  TrendingUp,
  Users
} from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { user, accessToken, refreshToken, organization } = response.data.data;

      // Store refresh token in localStorage for persistence
      localStorage.setItem('refreshToken', refreshToken);

      // Set auth state: user, organization, accessToken
      setAuth(user, organization, accessToken);

      toast.success(`Welcome back, ${user.fullName}! 🚀`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A] selection:bg-primary/30">
      {/* Left Side: Cinematic Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-white/5">
        <div className="premium-bg">
          <div className="premium-mesh opacity-60" />
          <div className="premium-grid" />
          <div className="premium-noise" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-premium tracking-tight">SprintBoard</span>
          </Link>

          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl font-black text-premium leading-tight mb-8">
                Build faster, <br />
                <span className="text-blue-500 text-glow-blue">Together.</span>
              </h2>
              
              <div className="space-y-8">
                <FeatureItem 
                  icon={<CheckCircle2 className="w-6 h-6 text-green-400" />}
                  title="Real-time Sprints"
                  desc="Sync your team's progress instantly across all devices."
                />
                <FeatureItem 
                  icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
                  title="Advanced Metrics"
                  desc="Powerful analytics to keep your project on the right track."
                />
                <FeatureItem 
                  icon={<Users className="w-6 h-6 text-purple-400" />}
                  title="Team Management"
                  desc="Manage roles and permissions with enterprise precision."
                />
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-8 text-white/40 text-sm font-medium">
            <span>&copy; 2026 SprintBoard AI</span>
            <div className="flex gap-4">
              <Github className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Floating Abstract Element */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-premium">SprintBoard</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-premium mb-3">Welcome back</h1>
            <p className="text-white/50 font-medium text-lg">Enter your credentials to access your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60 ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="glass-input w-full pl-12 h-14 text-lg"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-white/60 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-12 h-14 text-lg"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 transition-all" />
              <label htmlFor="remember" className="text-sm text-white/50 font-medium cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-premium w-full h-14 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-white/40 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline transition-all">
              Start 14-day free trial
            </Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
}

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex items-start gap-5">
    <div className="mt-1 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
      {icon}
    </div>
    <div>
      <h4 className="text-xl font-bold text-white/90">{title}</h4>
      <p className="text-white/40 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Login;