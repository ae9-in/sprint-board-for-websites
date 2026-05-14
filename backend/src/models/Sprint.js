import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const sprintSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  goal: {
    type: String,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED'
  },
  completionPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

sprintSchema.plugin(basePlugin);

sprintSchema.index({ projectId: 1, status: 1 });
sprintSchema.index({ organizationId: 1, status: 1 });

export const Sprint = mongoose.model('Sprint', sprintSchema);
export default Sprint;