import express from 'express';
import { z } from 'zod';
import { Task, TaskComment, Project, Sprint } from '../models/index.js';
import { trackActivity } from '../utils/activity.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { orgQuery, assertObjectId } from '../middleware/orgScope.js';
import { validate } from '../utils/validators.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';
import { emitToProject, emitToOrg } from '../utils/socket.js';

const router = express.Router();

// GET /api/projects/:projectId/tasks - List tasks for a project
router.get('/projects/:projectId/tasks', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');
    const { page = 1, limit = 50, sprintId, status, assignedTo, priority, search } = req.query;

    const query = orgQuery(req, { projectId: req.params.projectId });

    if (sprintId) query.sprintId = sprintId;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For non-admin users, only show assigned tasks or created by them
    if (req.user.role !== 'SUPER_ADMIN') {
      query.$or = [
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
      ];
    }

    const result = await paginate(Task, query, { page, limit, sort: { createdAt: -1 } });

    res.json({
      success: true,
      data: result.data,
      meta: buildPaginationMeta(result)
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/tasks - Create a task
router.post('/projects/:projectId/tasks', auth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');

    const data = validate(z.object({
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
    }), req.body);

    const task = await Task.create({
      ...data,
      projectId: req.params.projectId,
      organizationId: req.user.organizationId,
      status: 'NOT_STARTED',
      progressPercent: 0,
      createdBy: req.user.id,
      sprintId: data.sprintId || null,
      assignedTo: data.assignedTo || null
    });

    // Update project metrics
    await Project.findByIdAndUpdate(req.params.projectId, {
      $inc: { 'metrics.totalTasks': 1 }
    });

    // Log activity
    trackActivity({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      userId: req.user.id,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id,
      description: `Task "${task.title}" created`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Socket emission
    emitToProject(req.params.projectId, 'task-created', task);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/tasks/:id - Update task
router.patch('/projects/:projectId/tasks/:id', auth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Task ID');

    const data = validate(z.object({
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
    }), req.body);

    const task = await Task.findOneAndUpdate(
      orgQuery(req, { _id: req.params.id, projectId: req.params.projectId }),
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      });
    }

    // Socket emission
    emitToProject(req.params.projectId, 'task-updated', task);

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/tasks/:id/status - Update task status
router.patch('/projects/:projectId/tasks/:id/status', auth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Task ID');

    const { status } = req.body;
    if (!['NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'BLOCKED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status' }
      });
    }

    const task = await Task.findOne(
      orgQuery(req, { _id: req.params.id, projectId: req.params.projectId })
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    // Recalculate sprint and project metrics if status changed to COMPLETED
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED' && task.sprintId) {
      // Update sprint completion
      const sprintTasks = await Task.find({ sprintId: task.sprintId, isDeleted: false });
      const completedTasks = sprintTasks.filter(t => t.status === 'COMPLETED').length;
      const completionPercent = Math.round((completedTasks / sprintTasks.length) * 100);

      await Sprint.findByIdAndUpdate(task.sprintId, {
        completionPercent
      });

      // Update project completed tasks count
      await Project.findByIdAndUpdate(task.projectId, {
        $inc: { 'metrics.completedTasks': 1 }
      });
    }

    // Socket emission
    emitToProject(req.params.projectId, 'task-updated', task);

    res.json({
      success: true,
      data: task,
      message: 'Task status updated'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/tasks/:id - Delete task
router.delete('/projects/:projectId/tasks/:id', auth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Task ID');

    const task = await Task.findOneAndUpdate(
      orgQuery(req, { _id: req.params.id, projectId: req.params.projectId }),
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      });
    }

    // Socket emission
    emitToProject(req.params.projectId, 'task-deleted', task._id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/tasks/:id/comments - Add comment
router.post('/projects/:projectId/tasks/:id/comments', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Task ID');

    const { content, isInternal } = req.body;

    const comment = await TaskComment.create({
      taskId: req.params.id,
      projectId: req.params.projectId,
      organizationId: req.user.organizationId,
      content,
      isInternal: isInternal || false,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/tasks/:id/comments - Get comments
router.get('/projects/:projectId/tasks/:id/comments', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Task ID');

    const comments = await TaskComment.find({
      taskId: req.params.id,
      isDeleted: false
    })
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
});

export default router;