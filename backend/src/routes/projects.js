import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Project, ProjectStage, User, Notification, ActivityLog, Sprint, Task } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { orgQuery, assertObjectId } from '../middleware/orgScope.js';
import { validate } from '../utils/validators.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';
import { push } from '../utils/sseManager.js';

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

    // Role-based filtering
    if (req.user.role !== 'SUPER_ADMIN' && assignedTo) {
      query.assignedUserIds = req.user.id;
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
router.post('/', auth, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const data = validate(z.object({
      name: z.string().min(2),
      clientName: z.string().min(2),
      description: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      startDate: z.string().datetime(),
      deadline: z.string().datetime(),
      assignedUserIds: z.array(z.string()).optional()
    }), req.body);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create project
      const [project] = await Project.create([{
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
        createdBy: req.user.id
      }], { session });

      // Create stages
      const stages = STAGE_ORDER.map((stageType, index) => ({
        projectId: project._id,
        organizationId: req.user.organizationId,
        stageType,
        status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
        startedAt: index === 0 ? new Date() : null,
        createdBy: req.user.id
      }));

      await ProjectStage.insertMany(stages, { session });

      await session.commitTransaction();
      session.endSession();

      // Send notifications to assigned users
      if (data.assignedUserIds && data.assignedUserIds.length > 0) {
        for (const userId of data.assignedUserIds) {
          const notification = await Notification.create({
            organizationId: req.user.organizationId,
            userId,
            projectId: project._id,
            type: 'PROJECT_ASSIGNED',
            title: 'New Project Assigned',
            message: `You have been assigned to project: ${project.name}`,
            link: `/projects/${project._id}`,
            createdBy: req.user.id
          });

          // Push real-time notification
          try {
            push(userId.toString(), notification);
          } catch (e) {
            // Ignore SSE errors
          }
        }
      }

      // Log activity
      await ActivityLog.create({
        organizationId: req.user.organizationId,
        projectId: project._id,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project._id,
        description: `Project "${project.name}" created`,
        createdBy: req.user.id
      });

      // Fetch created project with stages
      const createdProject = await Project.findById(project._id)
        .populate('assignedUserIds', 'fullName email userType');

      const createdStages = await ProjectStage.find({
        projectId: project._id,
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
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Project ID');

    const data = validate(z.object({
      name: z.string().min(2).optional(),
      clientName: z.string().min(2).optional(),
      description: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
      startDate: z.string().datetime().optional(),
      deadline: z.string().datetime().optional(),
      assignedUserIds: z.array(z.string()).optional()
    }), req.body);

    const query = orgQuery(req, { _id: req.params.id });

    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.deadline) updateData.deadline = new Date(data.deadline);

    const project = await Project.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('assignedUserIds', 'fullName email userType');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    // Log activity
    await ActivityLog.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id,
      description: `Project "${project.name}" updated`,
      createdBy: req.user.id
    });

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
    await ActivityLog.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'PROJECT_DELETED',
      entityType: 'Project',
      entityId: project._id,
      description: `Project "${project.name}" deleted`,
      createdBy: req.user.id
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

    // Check if current stage can be approved
    if (project.currentStage !== stageType) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STAGE', message: 'Can only approve the current stage' }
      });
    }

    const currentStageIndex = STAGE_ORDER.indexOf(stageType);

    // Check if all previous stages are completed
    for (let i = 0; i < currentStageIndex; i++) {
      const prevStage = await ProjectStage.findOne({
        projectId: project._id,
        stageType: STAGE_ORDER[i],
        isDeleted: false
      });

      if (!prevStage || !['APPROVED', 'COMPLETED'].includes(prevStage.status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'STAGE_GATE', message: `Stage ${STAGE_ORDER[i]} must be completed first` }
        });
      }
    }

    // Update current stage
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

    // Advance to next stage if exists
    const nextStageIndex = currentStageIndex + 1;
    if (nextStageIndex < STAGE_ORDER.length) {
      const nextStage = await ProjectStage.findOneAndUpdate(
        { projectId: project._id, stageType: STAGE_ORDER[nextStageIndex], isDeleted: false },
        {
          $set: {
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        },
        { new: true }
      );

      // Update project current stage and progress
      project.currentStage = STAGE_ORDER[nextStageIndex];
      project.progressPercent = Math.round(((currentStageIndex + 1) / STAGE_ORDER.length) * 100);
      await project.save();
    } else {
      // If it was the last stage, set to 100%
      project.progressPercent = 100;
      project.status = 'COMPLETED';
      await project.save();
    }

    // Send notifications to assigned users
    const notifications = [];
    for (const userId of project.assignedUserIds) {
      const notification = await Notification.create({
        organizationId: req.user.organizationId,
        userId,
        projectId: project._id,
        type: 'APPROVED',
        title: 'Stage Approved',
        message: `Stage "${stageType}" has been approved for project "${project.name}"`,
        link: `/projects/${project._id}`,
        createdBy: req.user.id
      });
      notifications.push(notification);

      try {
        push(userId.toString(), notification);
      } catch (e) {}
    }

    // Log activity
    await ActivityLog.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'STAGE_APPROVED',
      entityType: 'ProjectStage',
      entityId: stage._id,
      description: `Stage "${stageType}" approved`,
      createdBy: req.user.id
    });

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
    await ActivityLog.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user.id,
      action: 'STAGE_REJECTED',
      entityType: 'ProjectStage',
      entityId: stage._id,
      description: `Stage "${stageType}" rejected`,
      createdBy: req.user.id
    });

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

export default router;