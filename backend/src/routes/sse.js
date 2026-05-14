import express from 'express';
import { auth } from '../middleware/auth.js';
import { Notification } from '../models/index.js';
import { addClient, removeClient } from '../utils/sseManager.js';

const router = express.Router();

router.get('/stream', auth, async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add client to SSE manager
  addClient(req.user.id, res);

  // Send initial unread count
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
    isDeleted: false
  });

  res.write(`event: NOTIFICATION\ndata: ${JSON.stringify({ type: 'INIT', unreadCount })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    removeClient(req.user.id, res);
  });
});

export default router;