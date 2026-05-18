import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Users, Plus, Mail, X, Shield, User, Code, TestTube, Palette, Server, Briefcase } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const USER_TYPE_ICONS = {
  DEVELOPER: Code,
  TESTER: TestTube,
  UI_UX_DESIGNER: Palette,
  DEPLOYMENT_MANAGER: Server,
  PROJECT_COORDINATOR: Briefcase,
};

const USER_TYPE_LABELS = {
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
  UI_UX_DESIGNER: 'UI/UX Designer',
  DEPLOYMENT_MANAGER: 'Deployment Manager',
  PROJECT_COORDINATOR: 'Project Coordinator',
};

function Team() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'USER', userType: 'DEVELOPER' });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/sessions'); // fallback to org users
      // Try to get org users via a project member list or fallback
      try {
        const res2 = await api.get('/projects?limit=1');
        // Get users from organization via dashboard endpoint
      } catch {}
      setMembers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.post('/auth/invite/send', inviteForm);
      const { inviteLink: link } = res.data.data;
      setInviteLink(link);
      toast.success('Invitation created! Share the link below.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Organization</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-premium tracking-tight">Team</h1>
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => { setShowInvite(true); setInviteLink(null); }}
              className="btn-primary-premium flex items-center justify-center gap-2 px-5 py-3 text-sm sm:text-base w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="w-5 h-5 flex-shrink-0" /> Invite Member
            </button>
          )}
        </div>

        {/* Current User Info Card */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/20 flex-shrink-0">
              {user?.fullName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-premium truncate">{user?.fullName}</h2>
              <p className="text-white/40 font-medium truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 inline-block">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-white/5 text-white/40 border border-white/5 inline-block">
                  {USER_TYPE_LABELS[user?.userType] || user?.userType}
                </span>
              </div>
            </div>
          </div>
          <p className="text-white/30 text-xs sm:text-sm font-medium border-t border-white/5 pt-6 leading-relaxed">
            Team management features are available. Use the <span className="text-primary font-bold">"Invite Member"</span> button to add team members to your organization workspace.
          </p>
        </div>

        {/* Invite Instructions */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="glass-card p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-premium mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              Invitation System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { step: '01', title: 'Send Invite', desc: 'Click "Invite Member", enter email and role, then generate an invitation link.' },
                { step: '02', title: 'Share Link', desc: 'Copy and share the invite link with your team member via email or messaging.' },
                { step: '03', title: 'Member Joins', desc: 'They click the link, set a password, and automatically join your workspace.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="glass p-6 rounded-xl border border-white/5">
                  <div className="text-3xl sm:text-4xl font-black text-primary/20 mb-3">{step}</div>
                  <h4 className="font-bold text-premium mb-2 text-base sm:text-lg">{title}</h4>
                  <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-premium">Invite Team Member</h3>
                  <p className="text-white/40 text-xs sm:text-sm">Generate an invitation link for your team</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 hover:text-white flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 flex-shrink-0" />
                      <input
                        type="email"
                        required
                        placeholder="team@company.com"
                        className="glass-input w-full h-12 pl-11 text-sm font-medium"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Role</label>
                      <select
                        className="glass-input w-full h-12 text-sm font-bold bg-no-repeat bg-[right_1rem_center]"
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      >
                        <option value="USER">User</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">User Type</label>
                      <select
                        className="glass-input w-full h-12 text-sm font-bold bg-no-repeat bg-[right_1rem_center]"
                        value={inviteForm.userType}
                        onChange={(e) => setInviteForm({ ...inviteForm, userType: e.target.value })}
                      >
                        {Object.entries(USER_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {inviteLink && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Invitation Link Generated</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white/70 text-xs break-all flex-1">{inviteLink}</p>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Link copied!'); }}
                          className="flex-shrink-0 text-xs font-bold text-primary hover:underline px-2 py-1"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 sm:px-8 py-5 border-t border-white/5 flex gap-4 bg-[#111827]/50 flex-shrink-0">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 h-12 sm:h-14 rounded-xl font-bold text-white/40 hover:bg-white/5 transition-all text-sm sm:text-base">
                    Cancel
                  </button>
                  <button type="submit" disabled={inviting}
                    className="flex-[2] h-12 sm:h-14 btn-primary-premium flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base">
                    {inviting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" /> : <><Mail className="w-4 h-4 flex-shrink-0" /> Generate Link</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default Team;
