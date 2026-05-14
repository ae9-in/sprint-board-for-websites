import mongoose from 'mongoose';

export function orgQuery(req, extraConditions = {}) {
  const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
  return {
    organizationId,
    isDeleted: false,
    ...extraConditions
  };
}

export function assertObjectId(id, fieldName = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid ID format');
    error.status = 400;
    throw error;
  }
}

export function orgScope(req, res, next) {
  req.orgQuery = (extraConditions = {}) => orgQuery(req, extraConditions);
  next();
}