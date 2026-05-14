import express from 'express';
import { z } from 'zod';
import { Sprint, Task, Project } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { orgQuery, assertObjectId } from '../middleware/orgScope.js';
import { validate } from '../utils/validators.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/projects/:projectId/sprints - List sprints
router.get('/projects/:projectId/sprints', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');

    const sprints = await Sprint.find(
      orgQuery(req, { projectId: req.params.projectId })
    ).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: sprints
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sprints - Create sprint
router.post('/projects/:projectId/sprints', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');

    const data = validate(z.object({
      name: z.string().min(2),
      goal: z.string().optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    }), req.body);

    // Check if there's already an active sprint
    const activeSprint = await Sprint.findOne({
      projectId: req.params.projectId,
      status: 'ACTIVE',
      isDeleted: false
    });

    if (activeSprint) {
      return res.status(409).json({
        success: false,
        error: { code: 'ACTIVE_SPRINT_EXISTS', message: 'Only one sprint can be active at a time' }
      });
    }

    const sprint = await Sprint.create({
      ...data,
      projectId: req.params.projectId,
      organizationId: req.user.organizationId,
      status: 'PLANNED',
      completionPercent: 0,
      createdBy: req.user.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });

    res.status(201).json({
      success: true,
      data: sprint,
      message: 'Sprint created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sprints/start - Start a sprint
router.post('/projects/:projectId/sprints/start', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');
    const { sprintId } = req.body;

    // Check if there's already an active sprint
    const activeSprint = await Sprint.findOne({
      projectId: req.params.projectId,
      status: 'ACTIVE',
      isDeleted: false
    });

    if (activeSprint && activeSprint._id.toString() !== sprintId) {
      return res.status(409).json({
        success: false,
        error: { code: 'ACTIVE_SPRINT_EXISTS', message: 'Only one sprint can be active at a time' }
      });
    }

    const sprint = await Sprint.findOneAndUpdate(
      orgQuery(req, { _id: sprintId, projectId: req.params.projectId }),
      { $set: { status: 'ACTIVE' } },
      { new: true }
    );

    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sprint not found' }
      });
    }

    res.json({
      success: true,
      data: sprint,
      message: 'Sprint started'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sprints/complete - Complete a sprint
router.post('/projects/:projectId/sprints/complete', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');
    const { sprintId } = req.body;

    const sprint = await Sprint.findOneAndUpdate(
      orgQuery(req, { _id: sprintId, projectId: req.params.projectId }),
      { $set: { status: 'COMPLETED' } },
      { new: true }
    );

    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sprint not found' }
      });
    }

    res.json({
      success: true,
      data: sprint,
      message: 'Sprint completed'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/sprints/:id - Get sprint with tasks
router.get('/projects/:projectId/sprints/:id', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id, 'Sprint ID');

    const sprint = await Sprint.findOne(
      orgQuery(req, { _id: req.params.id, projectId: req.params.projectId })
    ).lean();

    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sprint not found' }
      });
    }

    const tasks = await Task.find({
      sprintId: sprint._id,
      isDeleted: false
    }).lean();

    res.json({
      success: true,
      data: { ...sprint, tasks }
    });
  } catch (error) {
    next(error);
  }
});

export default router;