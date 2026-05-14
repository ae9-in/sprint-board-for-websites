import mongoose from 'mongoose';

const inviteTokenSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'USER'],
    default: 'USER'
  },
  userType: {
    type: String,
    enum: ['DEVELOPER', 'TESTER', 'UI_UX_DESIGNER', 'DEPLOYMENT_MANAGER', 'PROJECT_COORDINATOR'],
    default: 'DEVELOPER'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

inviteTokenSchema.index({ organizationId: 1, email: 1 });

export const InviteToken = mongoose.model('InviteToken', inviteTokenSchema);
export default InviteToken;