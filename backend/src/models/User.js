import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const userSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'GUEST'],
    default: 'USER'
  },
  permissions: [{
    type: String,
    trim: true
  }],
  userType: {
    type: String,
    enum: ['DEVELOPER', 'TESTER', 'UI_UX_DESIGNER', 'DEPLOYMENT_MANAGER', 'PROJECT_COORDINATOR', 'CLIENT'],
    default: 'DEVELOPER'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inviteAccepted: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  sessions: [{
    tokenHash: String,
    deviceType: String,
    os: String,
    browser: String,
    ip: String,
    lastActiveAt: { type: Date, default: Date.now }
  }],
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

userSchema.plugin(basePlugin);

// Enterprise Indexes
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, status: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });

export const User = mongoose.model('User', userSchema);
export default User;