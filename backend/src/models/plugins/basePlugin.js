import mongoose from 'mongoose';

export default function basePlugin(schema, options) {
  // Add organizationId field if not already present
  if (!schema.path('organizationId')) {
    schema.add({
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
      }
    });
  }

  // Add createdBy field if not already present
  if (!schema.path('createdBy')) {
    schema.add({
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
        index: true
      }
    });
  }

  // Standardize soft delete
  if (!schema.path('isDeleted')) {
    schema.add({
      isDeleted: {
        type: Boolean,
        default: false,
        index: true
      }
    });
  }

  // Ensure compound index for multi-tenant isolation
  // This ensures every query by organizationId + isDeleted is fast
  schema.index({ organizationId: 1, isDeleted: 1 });

  // Method to soft delete
  schema.methods.softDelete = function(userId) {
    this.isDeleted = true;
    if (userId) this.updatedBy = userId;
    return this.save();
  };

  // Query helpers for active documents
  schema.query.active = function() {
    return this.where({ isDeleted: false });
  };

  // Query helper for tenant isolation
  schema.query.byOrg = function(orgId) {
    return this.where({ organizationId: orgId });
  };

  // Ensure timestamps are enabled if not explicitly disabled
  if (!schema.options.timestamps) {
    schema.set('timestamps', true);
  }
}