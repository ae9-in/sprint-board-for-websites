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
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', password: '', role: 'USER', userType: 'DEVELOPER' });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/members');
      setMembers(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.post('/auth/invite/send', inviteForm);
      if (inviteForm.fullName && inviteForm.password) {
        toast.success('Team member added successfully!');
        setShowInvite(false);
        setInviteForm({ fullName: '', email: '', password: '', role: 'USER', userType: 'DEVELOPER' });
        fetchMembers();
      } else {
        const { inviteLink: link } = res.data.data;
        setInviteLink(link);
        toast.success('Invitation created! Share the link below.');
        fetchMembers();
      }
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
              onClick={() => { setShowInvite(true); setInviteLink(null); setInviteForm({ fullName: '', email: '', password: '', role: 'USER', userType: 'DEVELOPER' }); }}
              className="btn-primary-premium flex items-center justify-center gap-2 px-5 py-3 text-sm sm:text-base w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="w-5 h-5 flex-shrink-0" /> Add Team Member
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
            Team management features are available. Use the <span className="text-primary font-bold">"Add Team Member"</span> button to add team members to your organization workspace directly with a login password.
          </p>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-premium">Team Directory ({members.length})</h2>
            {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>

          {members.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white/60 mb-1">No other team members yet</h3>
              <p className="text-white/30 text-sm">Add team members using the "Add Team Member" button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => {
                const TypeIcon = USER_TYPE_ICONS[member.userType] || Code;
                return (
                  <motion.div
                    key={member._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 relative group overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-lg font-black text-white/80 flex-shrink-0">
                        {member.fullName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-premium truncate text-base sm:text-lg">{member.fullName}</h3>
                        <p className="text-white/40 text-xs truncate font-medium mb-2">{member.email}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/10`}>
                            {member.role}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 flex items-center gap-1">
                            <TypeIcon className="w-2.5 h-2.5" />
                            {USER_TYPE_LABELS[member.userType] || member.userType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30 font-medium relative z-10">
                      <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invite Instructions */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="glass-card p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-premium mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              Invitation & Add System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { step: '01', title: 'Add Directly', desc: 'Click "Add Team Member", enter name, email, role, and set a password directly.' },
                { step: '02', title: 'Quick Login', desc: 'Once added, the team member can immediately log in using their email and set password.' },
                { step: '03', title: 'Workspace Access', desc: 'They get instant access to the organization boards, stages, sprints, and tasks.' },
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
                  <h3 className="text-xl sm:text-2xl font-black text-premium">Add Team Member</h3>
                  <p className="text-white/40 text-xs sm:text-sm">Create a new user profile for your team</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 hover:text-white flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-5 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 flex-shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="glass-input w-full h-12 pl-11 text-sm font-medium"
                        value={inviteForm.fullName}
                        onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                      />
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 flex-shrink-0" />
                      <input
                        type="password"
                        required
                        placeholder="•••••••• (Min 8 characters)"
                        className="glass-input w-full h-12 pl-11 text-sm font-medium"
                        value={inviteForm.password}
                        onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
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
                    {inviting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" /> : <><Plus className="w-4 h-4 flex-shrink-0" /> Add Member</>}
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
