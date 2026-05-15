import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Layers, 
  ChevronRight,
  Github,
  Twitter,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen text-white overflow-hidden selection:bg-primary/30">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="premium-mesh" />
        <div className="premium-grid" />
        <div className="floating-orb w-[600px] h-[600px] -top-48 -left-48 bg-blue-600/20" />
        <div className="floating-orb w-[500px] h-[500px] -bottom-48 -right-48 bg-indigo-600/20" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-premium">SprintBoard</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Log in</Link>
            <Link to="/signup" className="btn-primary-premium">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm font-medium text-blue-400 mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            V2.0 is now live with AI-powered insights
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 text-premium leading-[1.1]"
          >
            Manage Projects With <br />
            <span className="text-blue-500">Enterprise Precision</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The all-in-one platform for modern product teams. Track development, 
            testing, and deployments with breathtaking speed and clarity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup" className="btn-primary-premium px-10 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2 group">
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="glass px-10 py-4 rounded-xl font-semibold w-full sm:w-auto hover:bg-white/10 transition-all">
              Book a Demo
            </button>
          </motion.div>

          {/* Hero Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full -z-10" />
            <div className="glass p-2 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
               <img 
                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2069&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                loading="lazy"
                className="w-full rounded-[1.8rem] shadow-2xl"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-40" />
              
              {/* Floating Cards Over Preview */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-12 hidden lg:block glass-card p-4 w-64 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm font-bold text-premium">Performance</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-green-500" />
                  </div>
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Sprint Velocity: 85%</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 -right-12 hidden lg:block glass-card p-4 w-64 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-bold text-premium">Team Capacity</span>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111827] bg-gray-800" />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 mt-40">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-premium mb-6">Built for the next generation</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Everything you need to ship world-class software, from initial ideation to final deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Lightning Fast"
              desc="Optimized for speed. No more waiting for boards to load or tickets to update."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-blue-400" />}
              title="Enterprise Security"
              desc="Bank-grade encryption and role-based access control for your entire organization."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
              title="Advanced Analytics"
              desc="Deep insights into team performance, sprint velocity, and project health."
            />
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-cyan-400" />}
              title="Modern Kanban"
              desc="Beautiful, highly interactive boards that make project management a breeze."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-green-400" />}
              title="Real-time Collaboration"
              desc="Work together seamlessly with instant updates and team-wide visibility."
            />
            <FeatureCard 
              icon={<Rocket className="w-6 h-6 text-orange-400" />}
              title="Continuous Delivery"
              desc="Track deployments and integrations directly within your project workspace."
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-40 border-y border-white/5 glass py-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <StatItem value="10k+" label="Teams Onboarded" />
            <StatItem value="99.9%" label="Uptime Record" />
            <StatItem value="250M+" label="Tasks Completed" />
            <StatItem value="150+" label="Integrations" />
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 mt-40 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-b border-white/5 pb-20 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-premium">SprintBoard</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                The most sophisticated project management platform ever built.
                Trusted by 10,000+ teams worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li className="hover:text-white transition-colors cursor-pointer">Features</li>
                <li className="hover:text-white transition-colors cursor-pointer">Integrations</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-white transition-colors cursor-pointer">Changelog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-white transition-colors cursor-pointer">Privacy</li>
                <li className="hover:text-white transition-colors cursor-pointer">Terms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <div className="flex gap-4">
                <Github className="w-5 h-5 text-white/40 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-white/40 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-white/20">
            &copy; 2026 SprintBoard AI Inc. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-8 text-left"
  >
    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-premium mb-3">{title}</h3>
    <p className="text-white/40 leading-relaxed">{desc}</p>
  </motion.div>
);

const StatItem = ({ value, label }) => (
  <div>
    <div className="text-4xl md:text-5xl font-black text-premium mb-2">{value}</div>
    <div className="text-sm font-bold text-blue-500 uppercase tracking-widest">{label}</div>
  </div>
);

export default LandingPage;
