import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Lock, 
  Mail, 
  ArrowRight, 
  Briefcase, 
  User,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        ...form,
        email: form.email.trim().toLowerCase()
      });
      const { accessToken, refreshToken, user, organization } = response.data.data;

      localStorage.setItem('refreshToken', refreshToken);
      setAuth(user, organization, accessToken);
      toast.success(`Welcome to SprintBoard, ${user.fullName}! 🚀`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Signup failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = form.fullName.length >= 2 && form.email.includes('@');

  return (
    <div className="min-h-screen flex bg-[#0F172A] selection:bg-primary/30">
      {/* Left Side: Cinematic Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-white/5">
        <div className="premium-bg">
          <div className="premium-mesh opacity-60" />
          <div className="premium-grid" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Rocket className="w-7 h-7 text-white flex-shrink-0" />
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
                Build the <br />
                <span className="text-blue-500 text-glow-blue">Future.</span>
              </h2>
              
              <div className="space-y-8">
                <FeatureItem 
                  icon={<ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />}
                  title="Secure by Design"
                  desc="Enterprise-grade isolation for your team's most critical data."
                />
                <FeatureItem 
                  icon={<Zap className="w-6 h-6 text-blue-400 flex-shrink-0" />}
                  title="Ultra-Fast Sync"
                  desc="Real-time updates across all modules with zero latency."
                />
                <FeatureItem 
                  icon={<Globe className="w-6 h-6 text-purple-400 flex-shrink-0" />}
                  title="Global Scale"
                  desc="Built to handle complex multi-org workflows effortlessly."
                />
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-8 text-white/40 text-sm font-medium">
            <span>&copy; 2026 SprintBoard AI</span>
            <div className="flex gap-4">
              <span className="hover:text-white transition-colors cursor-pointer">Status</span>
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Right Side: Optimized Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden">
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5 sm:gap-3">
          <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-premium">SprintBoard</span>
        </div>

        <div className="w-full max-w-md relative pt-12 sm:pt-0">
          <div className="mb-8 sm:mb-12 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-widest mb-3 sm:mb-4 flex-shrink-0 whitespace-nowrap"
            >
              <Check className="w-3 h-3 flex-shrink-0" /> Step {step} of 2
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-premium mb-2 sm:mb-3">
              {step === 1 ? "Personal Profile" : "Organization Details"}
            </h1>
            <p className="text-white/40 font-medium text-base sm:text-lg">
              {step === 1 ? "Tell us who you are" : "Let's set up your workspace"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 ml-1 uppercase tracking-[0.2em]">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="glass-input w-full pl-12 h-14 text-base sm:text-lg font-medium"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 ml-1 uppercase tracking-[0.2em]">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="glass-input w-full pl-12 h-14 text-base sm:text-lg font-medium"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 ml-1 uppercase tracking-[0.2em]">Organization Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <input
                        type="text"
                        value={form.organizationName}
                        onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                        className="glass-input w-full pl-12 h-14 text-base sm:text-lg font-medium"
                        placeholder="Acme Industries"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 ml-1 uppercase tracking-[0.2em]">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="glass-input w-full pl-12 pr-12 h-14 text-base sm:text-lg font-medium"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-primary transition-colors flex-shrink-0"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading || (step === 1 && !isStep1Valid)}
                className="btn-primary-premium w-full h-14 text-base sm:text-lg flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <>
                    {step === 1 ? "Next Step" : "Launch Workspace"} 
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </>
                )}
              </button>

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-white/40 text-sm sm:text-base font-bold hover:text-white transition-colors py-2"
                >
                  Go Back
                </button>
              )}
            </div>
          </form>

          <p className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-white/40 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline transition-all">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 sm:gap-5">
    <div className="mt-1 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-lg sm:text-xl font-bold text-white/90">{title}</h4>
      <p className="text-white/40 text-sm sm:text-base leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Signup;