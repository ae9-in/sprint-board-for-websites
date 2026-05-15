import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const activityLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'LOGIN', 'LOGOUT', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
      'STAGE_CHANGED', 'STAGE_APPROVED', 'STAGE_REJECTED', 'USER_INVITED', 'USER_JOINED',
      'FILE_UPLOADED', 'FILE_DELETED', 'FILE_DOWNLOADED', 'TASK_CREATED', 'TASK_UPDATED',
      'TASK_STATUS_CHANGED', 'DAILY_LOG_SUBMITTED', 'TESTING_REPORT_SUBMITTED',
      'DEPLOYMENT_UPDATED', 'DEPLOYMENT_COMPLETED', 'MAINTENANCE_LOG_CREATED',
      'MAINTENANCE_LOG_RESOLVED', 'FEATURE_REQUEST_CREATED', 'FEATURE_REQUEST_COMPLETED'
    ],
    required: true,
    index: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days TTL
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

activityLogSchema.plugin(basePlugin);

// Enterprise Audit Indexes
activityLogSchema.index({ organizationId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;