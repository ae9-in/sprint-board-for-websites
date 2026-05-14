import mongoose from 'mongoose';

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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

activityLogSchema.index({ organizationId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;