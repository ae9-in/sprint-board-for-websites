import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const projectFileSchema = new mongoose.Schema({
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
  linkedEntityType: {
    type: String,
    enum: ['REQUIREMENT', 'LAYOUT', 'TECH_STACK', 'DAILY_LOG', 'TESTING', 'DEPLOYMENT', 'MAINTENANCE', 'FEATURE'],
    required: true,
    index: true
  },
  linkedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  storageKey: {
    type: String,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

projectFileSchema.plugin(basePlugin);

projectFileSchema.index({ linkedEntityType: 1, linkedEntityId: 1 });
projectFileSchema.index({ projectId: 1, linkedEntityType: 1 });

export const ProjectFile = mongoose.model('ProjectFile', projectFileSchema);
export default ProjectFile;