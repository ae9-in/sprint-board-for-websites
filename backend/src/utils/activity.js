import { ActivityLog } from '../models/index.js';
import { emitToOrg } from './socket.js';

/**
 * Logs an activity to the database and emits a real-time event to the organization room.
 * @param {Object} params - Activity parameters
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

    // Emit to real-time sync channel
    emitToOrg(organizationId, 'activity-created', log);

    return log;
  } catch (error) {
    console.error('Failed to log/emit activity:', error);
    // Non-blocking, so we don't throw
  }
}
