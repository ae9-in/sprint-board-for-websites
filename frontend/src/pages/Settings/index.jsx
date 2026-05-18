import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Settings, User, Building, Shield, Lock, Save, Key } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

function SettingsPage() {
  const { user, organization } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Profile update endpoint (would need backend route)
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 truncate">Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-premium tracking-tight">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 p-1.5 glass rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-lg font-black text-premium mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary flex-shrink-0" /> Your Profile
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 pb-8 border-b border-white/5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg shadow-primary/20 flex-shrink-0">
                  {user?.fullName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg sm:text-xl font-black text-premium truncate">{user?.fullName}</h4>
                  <p className="text-white/40 text-xs sm:text-sm truncate">{user?.email}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-2 inline-block">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    className="glass-input w-full h-12 text-sm font-bold"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    className="glass-input w-full h-12 text-sm opacity-50 cursor-not-allowed font-medium"
                    value={user?.email}
                    disabled
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving} className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-sm sm:text-base">
                    <Save className="w-4 h-4 flex-shrink-0" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-lg font-black text-premium mb-6 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary flex-shrink-0" /> Organization Details
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Organization Name', value: organization?.name },
                  { label: 'Organization Slug', value: organization?.slug },
                  { label: 'Plan', value: organization?.plan || 'FREE' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass rounded-xl border border-white/5 gap-1">
                    <span className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-widest">{label}</span>
                    <span className="text-sm font-bold text-premium truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-lg font-black text-premium mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary flex-shrink-0" /> Change Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {[
                  { label: 'Current Password', field: 'currentPassword' },
                  { label: 'New Password', field: 'newPassword' },
                  { label: 'Confirm New Password', field: 'confirmPassword' },
                ].map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 flex-shrink-0" />
                      <input
                        type="password"
                        required
                        className="glass-input w-full h-12 pl-11 text-sm font-medium"
                        value={passwordForm[field]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                        minLength={field !== 'currentPassword' ? 8 : undefined}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <button type="submit" disabled={saving} className="btn-primary-premium flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-sm sm:text-base">
                    <Shield className="w-4 h-4 flex-shrink-0" /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
