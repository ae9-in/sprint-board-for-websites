import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  sprintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    default: null,
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
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'BLOCKED', 'COMPLETED'],
    default: 'NOT_STARTED',
    index: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    default: null
  },
  actualHours: {
    type: Number,
    default: null
  },
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  dependsOnTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  labels: [{
    type: String,
    trim: true
  }],
  commitLinks: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

taskSchema.plugin(basePlugin);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, sprintId: 1, status: 1 });
taskSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ parentTaskId: 1 });
taskSchema.index({ projectId: 1, title: 'text', description: 'text' });

export const Task = mongoose.model('Task', taskSchema);
export default Task;