import { ActivityLog } from '../models/index.js';

/**
 * Logs an activity to the database and optionally emits a real-time event.
 * Safe to call in serverless contexts — socket emit is attempted lazily.
 */
export async function trackActivity({
  organizationId,
  projectId = null,
  userId,
  action,
  entityType,
  entityId = null,
  description,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const log = await ActivityLog.create({
      organizationId,
      projectId,
      userId,
      action,
      entityType,
      entityId,
      description: description || `${action} on ${entityType}`,
      ipAddress,
      userAgent,
      createdBy: userId
    });

    // Emit to real-time sync channel (non-blocking, optional)
    try {
      const { emitToOrg } = await import('./socket.js');
      emitToOrg(organizationId, 'activity-created', log);
    } catch (_) {
      // Socket not initialized in this context — skip
    }

    return log;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    // Non-blocking — never throw from activity logger
  }
}
