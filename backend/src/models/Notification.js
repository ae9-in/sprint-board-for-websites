import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const notificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  type: {
    type: String,
    enum: [
      'PROJECT_ASSIGNED', 'STAGE_CHANGED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED',
      'CHANGES_REQUESTED', 'TESTING_ASSIGNED', 'DEPLOYMENT_PENDING', 'DAILY_LOG_MISSING',
      'MAINTENANCE_ASSIGNED', 'FEATURE_ASSIGNED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

notificationSchema.plugin(basePlugin);

// Enterprise Performance Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;