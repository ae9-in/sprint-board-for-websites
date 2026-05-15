import express from 'express';
import { z } from 'zod';
import { DailyLog, Project } from '../models/index.js';
import { trackActivity } from '../utils/activity.js';
import { emitToProject } from '../utils/socket.js';
import { auth } from '../middleware/auth.js';
import { orgQuery, assertObjectId } from '../middleware/orgScope.js';
import { validate } from '../utils/validators.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/projects/:projectId/daily-logs - List daily logs
router.get('/projects/:projectId/daily-logs', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    const query = orgQuery(req, { projectId: req.params.projectId });

    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const result = await paginate(DailyLog, query, { page, limit, sort: { date: -1 } });

    res.json({
      success: true,
      data: result.data,
      meta: buildPaginationMeta(result)
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/daily-logs - Create daily log
router.post('/projects/:projectId/daily-logs', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');

    const data = validate(z.object({
      date: z.string().datetime(),
      moduleWorkedOn: z.string().min(2),
      tasksCompleted: z.string().min(2),
      pendingTasks: z.string().min(2),
      hoursWorked: z.number().min(0).max(24),
      issuesBlockers: z.string().optional(),
      commitLinks: z.array(z.string()).optional(),
      notes: z.string().optional()
    }), req.body);

    const logDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the future
    if (logDate > today) {
      return res.status(400).json({
        success: false,
        error: { code: 'FUTURE_DATE', message: 'Cannot submit daily log for future dates' }
      });
    }

    // Check for duplicate (same user, same project, same date)
    const existingLog = await DailyLog.findOne({
      projectId: req.params.projectId,
      createdBy: req.user.id,
      date: {
        $gte: new Date(logDate.setHours(0, 0, 0, 0)),
        $lt: new Date(logDate.setHours(23, 59, 59, 999))
      },
      isDeleted: false
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_LOG', message: 'A daily log has already been submitted for this date' }
      });
    }

    const log = await DailyLog.create({
      ...data,
      projectId: req.params.projectId,
      organizationId: req.user.organizationId,
      date: new Date(data.date),
      createdBy: req.user.id
    });

    // Log activity
    trackActivity({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      userId: req.user.id,
      action: 'LOG_CREATED',
      entityType: 'DailyLog',
      entityId: log._id,
      description: `Daily log submitted for ${new Date(data.date).toLocaleDateString()}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Socket emission
    emitToProject(req.params.projectId, 'log-created', log);

    res.status(201).json({
      success: true,
      data: log,
      message: 'Daily log submitted successfully'
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_LOG', message: 'A daily log has already been submitted for this date' }
      });
    }
    next(error);
  }
});

// GET /api/projects/:projectId/daily-logs/my - Get current user's logs
router.get('/projects/:projectId/daily-logs/my', auth, async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'Project ID');

    const logs = await DailyLog.find({
      projectId: req.params.projectId,
      createdBy: req.user.id,
      isDeleted: false
    }).sort({ date: -1 }).lean();

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

export default router;