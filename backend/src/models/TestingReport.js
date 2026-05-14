import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const testingReportSchema = new mongoose.Schema({
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
  testCaseId: {
    type: String,
    required: true
  },
  moduleTested: {
    type: String,
    required: true
  },
  bugDescription: {
    type: String,
    required: true
  },
  reproductionSteps: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  browserDevice: {
    type: String,
    required: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
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

testingReportSchema.plugin(basePlugin);

testingReportSchema.index({ projectId: 1, severity: 1, status: 1 });
testingReportSchema.index({ projectId: 1, moduleTested: 'text', bugDescription: 'text' });

export const TestingReport = mongoose.model('TestingReport', testingReportSchema);
export default TestingReport;