import express from 'express';
import mongoose from 'mongoose';
import { Project, ProjectStage, Sprint, Task, DailyLog, TestingReport, MaintenanceLog, User } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { orgQuery } from '../middleware/orgScope.js';

const router = express.Router();

// GET /api/dashboard/admin - Admin dashboard stats
router.get('/admin', auth, async (req, res, next) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.user.organizationId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregation pipeline for comprehensive dashboard data
    const [
      totalProjects,
      projectsByStageResult,
      delayedProjects,
      pendingApprovals,
      testingPending,
      activeUsers,
      openMaintenanceIssues,
      dailyLogsSubmittedToday
    ] = await Promise.all([
      // Total active projects
      Project.countDocuments({ organizationId: orgId, isDeleted: false, status: 'ACTIVE' }),

      // Projects by stage
      Project.aggregate([
        { $match: { organizationId: orgId, isDeleted: false, status: 'ACTIVE' } },
        { $group: { _id: '$currentStage', count: { $sum: 1 } } }
      ]),

      // Delayed projects (deadline passed, still active)
      Project.countDocuments({
        organizationId: orgId,
        isDeleted: false,
        status: 'ACTIVE',
        deadline: { $lt: new Date() }
      }),

      // Pending approvals (stages awaiting approval)
      ProjectStage.countDocuments({
        organizationId: orgId,
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        isDeleted: false
      }),

      // Open testing reports
      TestingReport.countDocuments({
        organizationId: orgId,
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
        isDeleted: false
      }),

      // Active users (logged in last 7 days)
      User.countDocuments({
        organizationId: orgId,
        isDeleted: false,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),

      // Open maintenance issues
      MaintenanceLog.countDocuments({
        organizationId: orgId,
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
        isDeleted: false
      }),

      // Daily logs submitted today
      DailyLog.countDocuments({
        organizationId: orgId,
        date: { $gte: today, $lt: tomorrow },
        isDeleted: false
      })
    ]);

    // Transform projectsByStage
    const projectsByStage = {};
    projectsByStageResult.forEach(item => {
      projectsByStage[item._id] = item.count;
    });

    // Calculate expected daily logs (users assigned to active projects in DEVELOPMENT)
    const developmentProjects = await Project.find({
      organizationId: orgId,
      isDeleted: false,
      status: 'ACTIVE',
      currentStage: 'DEVELOPMENT'
    });

    const expectedLogs = developmentProjects.reduce((total, proj) => {
      return total + (proj.assignedUserIds?.length || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        totalProjects,
        projectsByStage,
        delayedProjects,
        pendingApprovals,
        testingPending,
        activeUsers,
        openMaintenanceIssues,
        dailyLogsSubmittedToday,
        dailyLogsMissingToday: Math.max(0, expectedLogs - dailyLogsSubmittedToday)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/user - User dashboard stats
router.get('/user', auth, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const orgId = new mongoose.Types.ObjectId(req.user.organizationId);

    // Assigned projects count
    const assignedProjects = await Project.countDocuments({
      organizationId: orgId,
      isDeleted: false,
      assignedUserIds: userId
    });

    // Pending tasks (assigned to user, not completed)
    const pendingTasks = await Task.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      status: { $in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'] },
      isDeleted: false
    });

    // Daily logs pending (user assigned to active project in DEVELOPMENT, no log today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const developmentProjects = await Project.find({
      organizationId: orgId,
      isDeleted: false,
      status: 'ACTIVE',
      currentStage: 'DEVELOPMENT',
      assignedUserIds: userId
    });

    let dailyLogsPending = 0;
    for (const project of developmentProjects) {
      const hasLogToday = await DailyLog.findOne({
        projectId: project._id,
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow },
        isDeleted: false
      });
      if (!hasLogToday) dailyLogsPending++;
    }

    // Testing assignments
    const testingAssignments = await TestingReport.countDocuments({
      organizationId: orgId,
      isDeleted: false,
      status: { $in: ['OPEN', 'IN_PROGRESS'] }
      // Note: Could filter by assignedTo if that field exists
    });

    // Maintenance assignments
    const maintenanceAssignments = await MaintenanceLog.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        assignedProjects,
        pendingTasks,
        dailyLogsPending,
        testingAssignments,
        maintenanceAssignments
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;