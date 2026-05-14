import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const deploymentDetailSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  frontend: {
    platform: { type: String, default: null },
    domainName: { type: String, default: null },
    deploymentUrl: { type: String, default: null },
    accountOwner: { type: String, default: null },
    cdnDetails: { type: String, default: null }
  },
  backend: {
    provider: { type: String, default: null },
    serverDetails: { type: String, default: null },
    runtimeEnvironment: { type: String, default: null },
    apiBaseUrl: { type: String, default: null },
    accountOwner: { type: String, default: null }
  },
  database: {
    type: { type: String, default: null },
    provider: { type: String, default: null },
    backupStrategy: { type: String, default: null },
    accessOwner: { type: String, default: null }
  },
  repository: {
    links: [{ type: String, trim: true }],
    owner: { type: String, default: null },
    branchStructure: { type: String, default: null }
  },
  checklist: {
    sslConfigured: { type: Boolean, default: false },
    dnsConfigured: { type: Boolean, default: false },
    monitoringEnabled: { type: Boolean, default: false },
    loggingEnabled: { type: Boolean, default: false },
    backupsEnabled: { type: Boolean, default: false },
    errorTrackingEnabled: { type: Boolean, default: false }
  },
  walkthroughVideoUrl: { type: String, default: null },
  isComplete: { type: Boolean, default: false, index: true },
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

deploymentDetailSchema.plugin(basePlugin);

export const DeploymentDetail = mongoose.model('DeploymentDetail', deploymentDetailSchema);
export default DeploymentDetail;