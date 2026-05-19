import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Globe,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

function Signup() {
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
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform flex-shrink-0">
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

      {/* Right Side: Informative Registration Closed Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden">
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5 sm:gap-3">
          <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-premium">SprintBoard</span>
        </div>

        <div className="w-full max-w-md relative pt-12 sm:pt-0">
          <div className="glass-card p-8 sm:p-10 border border-white/10 shadow-[0_0_100px_rgba(239,68,68,0.05)] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
            
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-premium mb-4">
              Registration Closed
            </h1>
            
            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-8">
              Public self-registration is currently deactivated. SprintBoard workspaces are private and require an official invitation from your system administrator.
            </p>

            <div className="space-y-4">
              <Link
                to="/login"
                className="btn-primary-premium w-full h-12 flex items-center justify-center gap-2 text-sm sm:text-base font-bold"
              >
                Return to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
              
              <p className="text-[11px] text-white/30 font-medium">
                Received an invite? Check your email inbox or contact support.
              </p>
            </div>
          </div>
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