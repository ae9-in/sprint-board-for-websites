import mongoose from 'mongoose';

/**
 * Enterprise Tenant Isolation Utility
 * Ensures every query is scoped to the current user's organization.
 */
export function orgQuery(req, extraConditions = {}) {
  if (!req.user || !req.user.organizationId) {
    const error = new Error('Unauthorized: No organization context found');
    error.status = 401;
    throw error;
  }

  const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
  
  return {
    organizationId,
    isDeleted: false,
    ...extraConditions
  };
}

/**
 * Standard ID validation with enterprise error codes
 */
export function assertObjectId(id, fieldName = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName} format`);
    error.code = 'INVALID_ID';
    error.status = 400;
    throw error;
  }
}

/**
 * Middleware to enforce organization scoping on every request
 */
export function enforceTenant(req, res, next) {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Organization context missing' }
      });
    }

    // Attach helper to request for easy access in controllers
    req.tenantQuery = (extra) => orgQuery(req, extra);
    
    next();
  } catch (error) {
    next(error);
  }
}