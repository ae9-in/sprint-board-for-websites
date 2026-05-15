import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { User, Lock, Rocket, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [form, setForm] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/invite/accept', {
        token,
        fullName: form.fullName,
        password: form.password,
      });

      const { accessToken, refreshToken, user, organization } = response.data.data;
      localStorage.setItem('refreshToken', refreshToken);
      setAuth(user, organization, accessToken);
      
      setSuccess(true);
      toast.success('Account created successfully! Welcome to the team.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="premium-bg">
          <div className="premium-mesh" />
          <div className="premium-grid" />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md w-full relative z-10"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-premium mb-4">Welcome Aboard!</h2>
          <p className="text-white/40 mb-8">Your account has been set up. Redirecting you to the dashboard...</p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
              className="h-full bg-primary"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="premium-bg">
        <div className="premium-mesh" />
        <div className="premium-grid" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-lg shadow-primary/10">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-premium tracking-tight">Join the Team</h1>
          <p className="text-white/40 text-sm font-medium mt-2">Complete your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                required
                placeholder="John Doe"
                className="glass-input w-full h-12 pl-11 text-sm font-bold"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="glass-input w-full h-12 pl-11 text-sm font-bold"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="glass-input w-full h-12 pl-11 text-sm font-bold"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                minLength={8}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 btn-primary-premium flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="px-8 py-6 bg-white/5 border-t border-white/5 text-center">
          <p className="text-xs text-white/30 font-medium">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-bold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default AcceptInvite;
