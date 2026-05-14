import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const dailyLogSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  moduleWorkedOn: {
    type: String,
    required: true
  },
  tasksCompleted: {
    type: String,
    required: true
  },
  pendingTasks: {
    type: String,
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  issuesBlockers: {
    type: String,
    default: null
  },
  commitLinks: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    default: null
  },
  fileIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectFile'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

dailyLogSchema.plugin(basePlugin);

dailyLogSchema.index({ projectId: 1, createdBy: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ organizationId: 1, date: 1 });
dailyLogSchema.index({ projectId: 1, date: -1 });

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
export default DailyLog;