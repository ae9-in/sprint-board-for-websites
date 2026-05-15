import express from 'express';
import { Project, Task } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { orgQuery } from '../middleware/orgScope.js';

const router = express.Router();

/**
 * GET /api/search - Global search across projects and tasks
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: { projects: [], tasks: [] } });
    }

    const query = orgQuery(req);
    const searchRegex = { $regex: q, $options: 'i' };

    // Parallel search for better performance
    const [projects, tasks] = await Promise.all([
      Project.find({
        ...query,
        $or: [
          { name: searchRegex },
          { clientName: searchRegex },
          { description: searchRegex }
        ]
      })
      .select('name clientName status currentStage progressPercent')
      .limit(10)
      .lean(),

      Task.find({
        ...query,
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      })
      .select('title status priority projectId')
      .populate('projectId', 'name')
      .limit(20)
      .lean()
    ]);

    res.json({
      success: true,
      data: {
        projects,
        tasks: tasks.map(t => ({
          ...t,
          projectName: t.projectId?.name,
          projectId: t.projectId?._id
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
