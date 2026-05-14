import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const featureRequestSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedTimeline: {
    type: Date,
    default: null
  },
  releaseVersion: {
    type: String,
    default: null
  },
  releaseNotes: {
    type: String,
    default: null
  },
  deployedAt: {
    type: Date,
    default: null
  },
  modulesChanged: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

featureRequestSchema.plugin(basePlugin);

featureRequestSchema.index({ projectId: 1, status: 1 });

export const FeatureRequest = mongoose.model('FeatureRequest', featureRequestSchema);
export default FeatureRequest;