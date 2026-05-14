import express from 'express';
import { Notification } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { orgQuery } from '../middleware/orgScope.js';
import { paginate, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { userId: req.user.id, isDeleted: false };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const result = await paginate(Notification, query, { page, limit, sort: { createdAt: -1 } });

    res.json({
      success: true,
      data: result.data,
      meta: buildPaginationMeta(result)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', auth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;