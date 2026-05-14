import { ActivityLog } from '../models/index.js';

export function logActivity(action, entityType) {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(body) {
      originalSend.call(this, body);

      // Log activity only on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body;

          // Skip logging for certain endpoints
          if (req.path.includes('/stream')) return;

          ActivityLog.create({
            organizationId: req.user.organizationId,
            projectId: req.body.projectId || req.params.projectId || null,
            userId: req.user.id,
            action,
            entityType,
            entityId: req.params.id || parsed.data?._id || null,
            description: `${action} on ${entityType}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            createdBy: req.user.id
          }).catch(console.error);
        } catch (e) {
          // Silently fail activity logging
        }
      }
    };

    next();
  };
}