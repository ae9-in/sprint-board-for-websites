import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Project, ProjectStage, User, Notification, ActivityLog, Sprint, Task, ProjectFile, TestingReport, MaintenanceLog, FeatureRequest } from '../models/index.js';
import { trackActivity } from '../utils/activity.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { orgQuery, assertObjectId } from '../middleware/orgScope.js';
import { validate } from '../utils/validators.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';
import { getIO } from '../utils/socket.js';
import { addNotificationJob } from '../queues/notificationQueue.js';

const router = express.Router();

const STAGE_ORDER = [
  'REQUIREMENT_SPECIFICATION',
  'BASIC_LAYOUT_PLANNING',
  'TECH_STACK_APPROVAL',
  'DEVELOPMENT',
  'TESTING',
  'DEPLOYMENT',
  'MAINTENANCE',
  'FEATURE_ENHANCEMENTS'
];

// GET /api/projects - List projects
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, priority, stage, assignedTo, startDate, endDate } = req.query;

    const query = orgQuery(req);

    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      query.assignedUserIds = req.user.id;
    } else if (assignedTo) {
      query.assignedUserIds = assignedTo;
    }

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (stage) query.currentStage = stage;
    if (assignedTo) query.assignedUserIds = assignedTo;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.deadline = { $lte: new Date(endDate) };

    const result = await paginate(Project, query, { page, limit, sort: { createdAt: -1 } });

    // Generate presigned URLs for any files if needed

    res.json({
      success: true,
      data: result.data,
      meta: buildPaginationMeta(result)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');

    const query = orgQuery(req, { _id: req.params.id });
    
    // Role-based access control
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      query.assignedUserIds = req.user.id;
    }

    const project = await Project.findOne(query)
      .populate('assignedUserIds', 'fullName email userType')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    // Get stages
    const stages = await ProjectStage.find({
      projectId: project._id,
      isDeleted: false
    }).lean();

    // Get sprints
    const sprints = await Sprint.find({
      projectId: project._id,
      isDeleted: false
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        ...project,
        stages,
        sprints
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create project (SUPER_ADMIN only)
router.post('/', auth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    const data = validate(z.object({
      name: z.string().min(2),
      clientName: z.string().min(2),
      description: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      startDate: z.string().datetime(),
      deadline: z.string().datetime(),
      assignedUserIds: z.array(z.string()).optional(),
      gitLink: z.string().optional(),
      vercelBackendLink: z.string().optional(),
      vercelFrontendLink: z.string().optional(),
      envDriveLink: z.string().optional()
    }), req.body);

    let projectObj;
    try {
      // Create project
      const project = await Project.create({
        organizationId: req.user.organizationId,
        name: data.name,
        clientName: data.clientName,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'ACTIVE',
        currentStage: 'REQUIREMENT_SPECIFICATION',
        startDate: new Date(data.startDate),
        deadline: new Date(data.deadline),
        progressPercent: 0,
        assignedUserIds: data.assignedUserIds || [],
        createdBy: req.user.id,
        gitLink: data.gitLink || '',
        vercelBackendLink: data.vercelBackendLink || '',
        vercelFrontendLink: data.vercelFrontendLink || '',
        envDriveLink: data.envDriveLink || ''
      });

      // Create stages
      const stages = STAGE_ORDER.map((stageType, index) => ({
        projectId: project._id,
        organizationId: req.user.organizationId,
        stageType,
        status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
        startedAt: index === 0 ? new Date() : null,
        createdBy: req.user.id
      }));

      await ProjectStage.insertMany(stages);
      projectObj = project;
    } catch (err) {
      throw err;
    }

    // Safe background notification & activity logging
    try {
      if (data.assignedUserIds && data.assignedUserIds.length > 0) {
        for (const userId of data.assignedUserIds) {
          addNotificationJob({
            organizationId: req.user.organizationId,
            userId,
            projectId: projectObj._id,
            type: 'PROJECT_ASSIGNED',
            title: 'New Project Assigned',
            message: `You have been assigned to project: ${projectObj.name}`,
            link: `/projects/${projectObj._id}`
          });
        }
      }

      // Log activity
      trackActivity({
        organizationId: req.user.organizationId,
        projectId: projectObj._id,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: projectObj._id,
        description: `Project "${projectObj.name}" created`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (bgError) {
      console.error('Non-critical background operations failed during project creation:', bgError);
    }

    // Fetch created project with stages
    const createdProject = await Project.findById(projectObj._id)
      .populate('assignedUserIds', 'fullName email userType');

    const createdStages = await ProjectStage.find({
      projectId: projectObj._id,
      isDeleted: false
    }).lean();

    res.status(201).json({
      success: true,
      data: {
        ...createdProject.toObject(),
        stages: createdStages
      },
      message: 'Project created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id - Update project (Authorized for Admins, or assigned users updating deployment details only)
router.patch('/:id', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');

    const query = orgQuery(req, { _id: req.params.id });
    const projectCheck = await Project.findOne(query);

    if (!projectCheck) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const isAssigned = projectCheck.assignedUserIds.map(id => id.toString()).includes(req.user.id.toString());

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const data = validate(z.object({
      name: z.string().min(2).optional(),
      clientName: z.string().min(2).optional(),
      description: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
      startDate: z.string().datetime().optional(),
      deadline: z.string().datetime().optional(),
      assignedUserIds: z.array(z.string()).optional(),
      gitLink: z.string().optional(),
      vercelBackendLink: z.string().optional(),
      vercelFrontendLink: z.string().optional(),
      envDriveLink: z.string().optional(),
      walkthroughVideoUrl: z.string().optional()
    }), req.body);

    // If regular user, restrict updates strictly to deployment details only!
    if (!isAdmin) {
      const restrictedFields = ['name', 'clientName', 'description', 'priority', 'status', 'startDate', 'deadline', 'assignedUserIds'];
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Access denied: Regular members can only update deployment details' }
          });
        }
      }
    }

    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.deadline) updateData.deadline = new Date(data.deadline);

    const project = await Project.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('assignedUserIds', 'fullName email userType');

    // Log activity
    trackActivity({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id,
      description: `Project "${project.name}" updated`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Real-time update
    getIO().to(`project:${project._id}`).emit('project-updated', project);

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/members - Add member to project
router.post('/:id/members', auth, async (req, res, next) => {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can assign members to projects' }
      });
    }

    assertObjectId(req.params.id, 'Project ID');
    const { name, email, userType = 'DEVELOPER' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: { message: 'Name and email are required' } });
    }

    const project = await Project.findOne(orgQuery(req, { _id: req.params.id }));
    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found' } });
    }

    let user = await User.findOne({ email: email.toLowerCase(), organizationId: req.user.organizationId });
    
    if (!user) {
      const { hashPassword } = await import('../utils/bcrypt.js');
      user = await User.create({
        organizationId: req.user.organizationId,
        fullName: name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword('password123'),
        role: 'USER',
        userType,
        isActive: true,
        inviteAccepted: true,
        createdBy: req.user.id
      });
    }

    if (!project.assignedUserIds.includes(user._id)) {
      project.assignedUserIds.push(user._id);
      await project.save();
    }

    // Populate user to return
    const populatedUser = await User.findById(user._id).select('fullName email userType');

    // Fetch updated project and broadcast via socket room
    const updatedProject = await Project.findById(project._id)
      .populate('assignedUserIds', 'fullName email userType')
      .populate('createdBy', 'fullName email')
      .lean();

    getIO().to(`project:${project._id}`).emit('project-updated', updatedProject);

    res.json({
      success: true,
      data: populatedUser,
      message: 'Member added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Soft delete project
router.delete('/:id', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');

    const query = orgQuery(req, { _id: req.params.id });

    const project = await Project.findOneAndUpdate(
      query,
      { $set: { isDeleted: true, updatedAt: new Date() } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    // Log activity
    trackActivity({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'PROJECT_DELETED',
      entityType: 'Project',
      entityId: project._id,
      description: `Project "${project.name}" deleted`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});
// POST /api/projects/:projectId/stages/:stageType/approve - Approve stage
router.post('/:projectId/stages/:stageType/approve', auth, async (req, res, next) => {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can approve stages' }
      });
    }

    assertObjectId(req.params.projectId, 'Project ID');
    const { stageType } = req.params;
    const { approvalNotes } = req.body;

    if (!STAGE_ORDER.includes(stageType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STAGE', message: 'Invalid stage type' }
      });
    }

    const project = await Project.findOne(orgQuery(req, { _id: req.params.projectId }));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    // Update the selected stage to APPROVED status
    const stage = await ProjectStage.findOneAndUpdate(
      { projectId: project._id, stageType, isDeleted: false },
      {
        $set: {
          status: 'APPROVED',
          approvedBy: req.user.id,
          approvalNotes: approvalNotes || null,
          completedAt: new Date()
        }
      },
      { new: true }
    );

    // Dynamic calculations:
    // 1. Calculate overall project progress percent based on number of APPROVED stages
    const allStages = await ProjectStage.find({ projectId: project._id, isDeleted: false });
    const approvedStages = allStages.filter(s => s.status === 'APPROVED');
    project.progressPercent = Math.round((approvedStages.length / STAGE_ORDER.length) * 100);

    // 2. Set currentStage to the first unapproved stage sequentially
    let nextUnapprovedStage = STAGE_ORDER.find(stageName => {
      const found = allStages.find(s => s.stageType === stageName);
      return !found || found.status !== 'APPROVED';
    });

    if (nextUnapprovedStage) {
      project.currentStage = nextUnapprovedStage;
      // Mark the next unapproved stage as IN_PROGRESS if it's currently PENDING
      await ProjectStage.findOneAndUpdate(
        { projectId: project._id, stageType: nextUnapprovedStage, status: 'PENDING', isDeleted: false },
        { $set: { status: 'IN_PROGRESS', startedAt: new Date() } }
      );
    } else {
      project.progressPercent = 100;
      project.status = 'COMPLETED';
    }

    await project.save();

    trackActivity({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'STAGE_APPROVED',
      entityType: 'ProjectStage',
      entityId: stage._id,
      description: `Stage "${stageType}" approved`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Background notifications & real-time updates (safe & isolated)
    try {
      for (const userId of project.assignedUserIds) {
        addNotificationJob({
          organizationId: req.user.organizationId,
          userId,
          projectId: project._id,
          type: 'APPROVED',
          title: 'Stage Approved',
          message: `Stage "${stageType}" has been approved for project "${project.name}"`,
          link: `/projects/${project._id}`
        });
      }
      getIO().to(`project:${project._id}`).emit('project-updated', project);
    } catch (bgError) {
      console.error('Non-critical background operations failed during stage approval:', bgError);
    }

    res.json({
      success: true,
      data: { stage, project },
      message: 'Stage approved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/stages/:stageType/reject - Reject stage
router.post('/:projectId/stages/:stageType/reject', auth, async (req, res, next) => {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can reject stages' }
      });
    }

    assertObjectId(req.params.projectId, 'Project ID');
    const { stageType } = req.params;
    const { rejectionNotes } = req.body;

    if (!rejectionNotes) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'Rejection notes are required' }
      });
    }

    const project = await Project.findOne(orgQuery(req, { _id: req.params.projectId }));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    const stage = await ProjectStage.findOneAndUpdate(
      { projectId: project._id, stageType, isDeleted: false },
      {
        $set: {
          status: 'REJECTED',
          rejectionNotes
        }
      },
      { new: true }
    );

    // Send notifications
    for (const userId of project.assignedUserIds) {
      const notification = await Notification.create({
        organizationId: req.user.organizationId,
        userId,
        projectId: project._id,
        type: 'REJECTED',
        title: 'Stage Rejected',
        message: `Stage "${stageType}" has been rejected for project "${project.name}"`,
        link: `/projects/${project._id}`,
        createdBy: req.user.id
      });

      try {
        push(userId.toString(), notification);
      } catch (e) {}
    }

    // Log activity
    trackActivity({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'STAGE_REJECTED',
      entityType: 'ProjectStage',
      entityId: stage._id,
      description: `Stage "${stageType}" rejected`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Real-time update
    getIO().to(`project:${project._id}`).emit('project-updated', project);

    res.json({
      success: true,
      data: stage,
      message: 'Stage rejected'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/stages/:stageType/request-changes - Request changes
router.post('/:projectId/stages/:stageType/request-changes', auth, async (req, res, next) => {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can request changes' }
      });
    }

    assertObjectId(req.params.projectId, 'Project ID');
    const { stageType } = req.params;
    const { notes } = req.body;

    const stage = await ProjectStage.findOneAndUpdate(
      { projectId: req.params.projectId, stageType, isDeleted: false },
      {
        $set: {
          status: 'CHANGES_REQUESTED'
        }
      },
      { new: true }
    );

    if (!stage) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Stage not found' }
      });
    }

    // Notify assigned users
    const project = await Project.findById(req.params.projectId);
    for (const userId of project.assignedUserIds) {
      const notification = await Notification.create({
        organizationId: req.user.organizationId,
        userId,
        projectId: project._id,
        type: 'CHANGES_REQUESTED',
        title: 'Changes Requested',
        message: `Changes requested for stage "${stageType}"`,
        link: `/projects/${project._id}`,
        createdBy: req.user.id
      });

      try {
        push(userId.toString(), notification);
      } catch (e) {}
    }

    res.json({
      success: true,
      data: stage,
      message: 'Changes requested'
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// USER PERMISSION & LINK UPLOAD ENDPOINTS
// ==========================================

// Helper function to check if the user is authorized to access the project
const checkProjectAccess = async (req, projectId) => {
  const project = await Project.findOne(orgQuery(req, { _id: projectId }));
  if (!project) return null;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  const isAssigned = project.assignedUserIds.map(id => id.toString()).includes(req.user.id.toString());
  if (!isAdmin && !isAssigned) return null;
  return project;
};

// --- FILES/DOCUMENTS ENDPOINTS ---

// GET /api/projects/:id/files - Get all files/documents for project
router.get('/:id/files', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const files = await ProjectFile.find({ projectId: project._id, isDeleted: false })
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/files - Upload file/document (Google Drive Link)
router.post('/:id/files', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const { fileName, googleDriveLink, linkedEntityType = 'REQUIREMENT' } = req.body;
    if (!fileName || !googleDriveLink) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'fileName and googleDriveLink are required' }
      });
    }

    const file = await ProjectFile.create({
      projectId: project._id,
      organizationId: req.user.organizationId,
      fileName,
      fileType: 'link',
      fileSize: 0,
      storageKey: googleDriveLink, // Save Google Drive URL as storageKey
      linkedEntityType,
      linkedEntityId: project._id,
      uploadedBy: req.user.id,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
});

// --- TESTING REPORTS ENDPOINTS ---

// GET /api/projects/:id/testing-reports - Get all testing reports for project
router.get('/:id/testing-reports', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const reports = await TestingReport.find({ projectId: project._id, isDeleted: false })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/testing-reports - Upload testing report (Google Drive Link)
router.post('/:id/testing-reports', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const { testCaseId, moduleTested, bugDescription, reproductionSteps, severity, googleDriveLink } = req.body;
    if (!testCaseId || !moduleTested || !bugDescription || !reproductionSteps || !severity) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'testCaseId, moduleTested, bugDescription, reproductionSteps, severity are required' }
      });
    }

    let fileIds = [];
    if (googleDriveLink) {
      const file = await ProjectFile.create({
        projectId: project._id,
        organizationId: req.user.organizationId,
        fileName: `Testing Report Link - ${moduleTested}`,
        fileType: 'link',
        fileSize: 0,
        storageKey: googleDriveLink,
        linkedEntityType: 'TESTING',
        linkedEntityId: project._id,
        uploadedBy: req.user.id,
        createdBy: req.user.id
      });
      fileIds.push(file._id);
    }

    const report = await TestingReport.create({
      projectId: project._id,
      organizationId: req.user.organizationId,
      testCaseId,
      moduleTested,
      bugDescription,
      reproductionSteps,
      severity,
      status: 'OPEN',
      browserDevice: req.headers['user-agent'] || 'Chrome/Desktop',
      fileIds,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// --- MAINTENANCE LOGS ENDPOINTS ---

// GET /api/projects/:id/maintenance-logs - Get all maintenance logs for project
router.get('/:id/maintenance-logs', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const logs = await MaintenanceLog.find({ projectId: project._id, isDeleted: false })
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/maintenance-logs - Create maintenance log
router.post('/:id/maintenance-logs', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const { issueTitle, description, severity, googleDriveLink } = req.body;
    if (!issueTitle || !description || !severity) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'issueTitle, description, severity are required' }
      });
    }

    const log = await MaintenanceLog.create({
      projectId: project._id,
      organizationId: req.user.organizationId,
      issueTitle,
      description,
      severity,
      status: 'OPEN',
      resolution: googleDriveLink || null, // Storing drive link inside resolution
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id/maintenance-logs/:logId - Update maintenance log status/resolution
router.patch('/:id/maintenance-logs/:logId', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    assertObjectId(req.params.logId, 'Log ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const { status, resolutionNotes } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'status is required' }
      });
    }

    const log = await MaintenanceLog.findOneAndUpdate(
      { _id: req.params.logId, projectId: project._id },
      {
        $set: {
          status,
          resolutionNotes,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
          updatedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Maintenance log not found' }
      });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

// --- FEATURE REQUESTS ENDPOINTS ---

// GET /api/projects/:id/feature-requests - Get all feature requests for project
router.get('/:id/feature-requests', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const features = await FeatureRequest.find({ projectId: project._id, isDeleted: false })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: features });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/feature-requests - Create feature request
router.post('/:id/feature-requests', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');
    const project = await checkProjectAccess(req, req.params.id);
    if (!project) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You are not assigned to this project' }
      });
    }

    const { title, description, googleDriveLink } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELD', message: 'title and description are required' }
      });
    }

    const feature = await FeatureRequest.create({
      projectId: project._id,
      organizationId: req.user.organizationId,
      title,
      description,
      releaseNotes: googleDriveLink || null, // Storing drive link inside releaseNotes
      status: 'REQUESTED',
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: feature });
  } catch (error) {
    next(error);
  }
});

export default router;