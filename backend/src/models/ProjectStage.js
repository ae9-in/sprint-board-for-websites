import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const projectStageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  stageType: {
    type: String,
    required: true,
    enum: [
      'REQUIREMENT_SPECIFICATION', 'BASIC_LAYOUT_PLANNING', 'TECH_STACK_APPROVAL',
      'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'MAINTENANCE', 'FEATURE_ENHANCEMENTS'
    ]
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'COMPLETED'],
    default: 'PENDING'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalNotes: {
    type: String,
    default: null
  },
  rejectionNotes: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

projectStageSchema.plugin(basePlugin);

projectStageSchema.index({ projectId: 1, stageType: 1 }, { unique: true });
projectStageSchema.index({ organizationId: 1, status: 1 });

export const ProjectStage = mongoose.model('ProjectStage', projectStageSchema);
export default ProjectStage;