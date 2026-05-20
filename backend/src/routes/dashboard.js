import express from 'express';
import mongoose from 'mongoose';
import { Project, ProjectStage, Sprint, Task, DailyLog, TestingReport, MaintenanceLog, User, ActivityLog } from '../models/index.js';
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

    // Consolidated aggregation for better performance
    const stats = await Project.aggregate([
      { $match: { organizationId: orgId, isDeleted: false } },
      {
        $facet: {
          totalProjects: [{ $count: 'count' }],
          projectsByStage: [
            { $group: { _id: '$currentStage', count: { $sum: 1 } } }
          ],
          delayedProjects: [
            { $match: { status: 'ACTIVE', deadline: { $lt: new Date() } } },
            { $count: 'count' }
          ],
          expectedLogs: [
            { $match: { status: 'ACTIVE', currentStage: 'DEVELOPMENT' } },
            { $project: { userCount: { $size: { $ifNull: ['$assignedUserIds', []] } } } },
            { $group: { _id: null, total: { $sum: '$userCount' } } }
          ]
        }
      }
    ]).allowDiskUse(true);

    const facet = stats[0];

    const [
      pendingApprovals,
      testingPending,
      activeUsers,
      openMaintenanceIssues,
      dailyLogsSubmittedToday,
      recentActivity
    ] = await Promise.all([
      ProjectStage.countDocuments({ organizationId: orgId, status: { $in: ['PENDING', 'IN_PROGRESS'] }, isDeleted: false }),
      TestingReport.countDocuments({ organizationId: orgId, status: { $in: ['OPEN', 'IN_PROGRESS'] }, isDeleted: false }),
      User.countDocuments({ 
        organizationId: orgId, 
        isDeleted: false, 
        isActive: true, 
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
      MaintenanceLog.countDocuments({ organizationId: orgId, status: { $in: ['OPEN', 'IN_PROGRESS'] }, isDeleted: false }),
      DailyLog.countDocuments({ organizationId: orgId, date: { $gte: today, $lt: tomorrow }, isDeleted: false }),
      ActivityLog.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    // Transform projectsByStage
    const projectsByStage = {};
    facet.projectsByStage.forEach(item => {
      projectsByStage[item._id] = item.count;
    });

    const expectedLogs = facet.expectedLogs[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalProjects: facet.totalProjects[0]?.count || 0,
        projectsByStage,
        delayedProjects: facet.delayedProjects[0]?.count || 0,
        pendingApprovals,
        testingPending,
        activeUsers,
        openMaintenanceIssues,
        dailyLogsSubmittedToday,
        dailyLogsMissingToday: Math.max(0, expectedLogs - dailyLogsSubmittedToday),
        recentActivity
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Single aggregation to get project/task related stats
    const stats = await Project.aggregate([
      { $match: { organizationId: orgId, isDeleted: false, assignedUserIds: userId } },
      {
        $facet: {
          assignedProjectsCount: [{ $count: 'count' }],
          dailyLogsPending: [
            { $match: { status: 'ACTIVE', currentStage: 'DEVELOPMENT' } },
            {
              $lookup: {
                from: 'dailylogs',
                let: { pid: '$_id' },
                pipeline: [
                  { 
                    $match: { 
                      $expr: { 
                        $and: [
                          { $eq: ['$projectId', '$$pid'] },
                          { $eq: ['$createdBy', userId] },
                          { $gte: ['$date', today] },
                          { $lt: ['$date', tomorrow] },
                          { $eq: ['$isDeleted', false] }
                        ]
                      }
                    }
                  }
                ],
                as: 'logs'
              }
            },
            { $match: { logs: { $size: 0 } } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const facet = stats[0];

    const [
      pendingTasks,
      testingAssignments,
      maintenanceAssignments
    ] = await Promise.all([
      Task.countDocuments({ organizationId: orgId, assignedTo: userId, status: { $in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'] }, isDeleted: false }),
      TestingReport.countDocuments({ organizationId: orgId, isDeleted: false, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      MaintenanceLog.countDocuments({ organizationId: orgId, assignedTo: userId, status: { $in: ['OPEN', 'IN_PROGRESS'] }, isDeleted: false })
    ]);

    res.json({
      success: true,
      data: {
        assignedProjects: facet.assignedProjectsCount[0]?.count || 0,
        pendingTasks,
        dailyLogsPending: facet.dailyLogsPending[0]?.count || 0,
        testingAssignments,
        maintenanceAssignments
      }
    });
  } catch (error) {
    next(error);
  }
});


export default router;