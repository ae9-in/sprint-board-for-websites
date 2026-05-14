import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const projectSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  currentStage: {
    type: String,
    enum: [
      'REQUIREMENT_SPECIFICATION', 'BASIC_LAYOUT_PLANNING', 'TECH_STACK_APPROVAL',
      'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'MAINTENANCE', 'FEATURE_ENHANCEMENTS'
    ],
    default: 'REQUIREMENT_SPECIFICATION'
  },
  startDate: {
    type: Date,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  assignedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    openBugs: { type: Number, default: 0 },
    openMaintenanceIssues: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

projectSchema.plugin(basePlugin);

projectSchema.index({ organizationId: 1, status: 1 });
projectSchema.index({ organizationId: 1, currentStage: 1 });
projectSchema.index({ organizationId: 1, deadline: 1 });
projectSchema.index({ organizationId: 1, assignedUserIds: 1 });
projectSchema.index({ organizationId: 1, isDeleted: 1 });
projectSchema.index({ organizationId: 1, name: 'text', clientName: 'text' });

export const Project = mongoose.model('Project', projectSchema);
export default Project;