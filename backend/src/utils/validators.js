import { z } from 'zod';

// Auth validators
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  organizationName: z.string().min(2)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

export const inviteSendSchema = z.object({
  email: z.string().email(),
  role: z.enum(['SUPER_ADMIN', 'USER']),
  userType: z.enum(['DEVELOPER', 'TESTER', 'UI_UX_DESIGNER', 'DEPLOYMENT_MANAGER', 'PROJECT_COORDINATOR'])
});

export const inviteAcceptSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  fullName: z.string().min(2)
});

// Project validators
export const createProjectSchema = z.object({
  name: z.string().min(2),
  clientName: z.string().min(2),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().datetime(),
  deadline: z.string().datetime(),
  assignedUserIds: z.array(z.string()).optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  clientName: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  assignedUserIds: z.array(z.string()).optional()
});

// Task validators
export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sprintId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  parentTaskId: z.string().optional(),
  dependsOnTaskId: z.string().optional(),
  labels: z.array(z.string()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  labels: z.array(z.string()).optional(),
  commitLinks: z.array(z.string()).optional()
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'BLOCKED', 'COMPLETED'])
});

// Sprint validators
export const createSprintSchema = z.object({
  name: z.string().min(2),
  goal: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

// Daily Log validators
export const createDailyLogSchema = z.object({
  date: z.string().datetime(),
  moduleWorkedOn: z.string().min(2),
  tasksCompleted: z.string().min(2),
  pendingTasks: z.string().min(2),
  hoursWorked: z.number().min(0).max(24),
  issuesBlockers: z.string().optional(),
  commitLinks: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Testing Report validators
export const createTestingReportSchema = z.object({
  projectId: z.string(),
  testCaseId: z.string(),
  moduleTested: z.string(),
  bugDescription: z.string(),
  reproductionSteps: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  browserDevice: z.string()
});

// Deployment Detail validators
export const updateDeploymentSchema = z.object({
  frontend: z.object({
    platform: z.string().optional(),
    domainName: z.string().optional(),
    deploymentUrl: z.string().optional(),
    accountOwner: z.string().optional(),
    cdnDetails: z.string().optional()
  }).optional(),
  backend: z.object({
    provider: z.string().optional(),
    serverDetails: z.string().optional(),
    runtimeEnvironment: z.string().optional(),
    apiBaseUrl: z.string().optional(),
    accountOwner: z.string().optional()
  }).optional(),
  database: z.object({
    type: z.string().optional(),
    provider: z.string().optional(),
    backupStrategy: z.string().optional(),
    accessOwner: z.string().optional()
  }).optional(),
  repository: z.object({
    links: z.array(z.string()).optional(),
    owner: z.string().optional(),
    branchStructure: z.string().optional()
  }).optional(),
  checklist: z.object({
    sslConfigured: z.boolean().optional(),
    dnsConfigured: z.boolean().optional(),
    monitoringEnabled: z.boolean().optional(),
    loggingEnabled: z.boolean().optional(),
    backupsEnabled: z.boolean().optional(),
    errorTrackingEnabled: z.boolean().optional()
  }).optional(),
  walkthroughVideoUrl: z.string().optional()
});

// Maintenance Log validators
export const createMaintenanceLogSchema = z.object({
  projectId: z.string(),
  issueTitle: z.string().min(2),
  description: z.string().min(2),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTo: z.string().optional()
});

// Feature Request validators
export const createFeatureRequestSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  description: z.string().min(2),
  assignedTo: z.string().optional(),
  estimatedTimeline: z.string().datetime().optional(),
  modulesChanged: z.array(z.string()).optional()
});

// Stage approval validators
export const approveStageSchema = z.object({
  approvalNotes: z.string().optional()
});

export const rejectStageSchema = z.object({
  rejectionNotes: z.string()
});

export const requestChangesSchema = z.object({
  notes: z.string()
});

// Task Comment validators
export const createCommentSchema = z.object({
  content: z.string().min(2),
  isInternal: z.boolean().optional()
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    const error = new Error('Validation failed');
    error.status = 422;
    error.code = 'VALIDATION_ERROR';
    error.fields = errors;
    throw error;
  }
  return result.data;
}