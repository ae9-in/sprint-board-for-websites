import mongoose from 'mongoose';

export default function basePlugin(schema, options) {
  // Add organizationId field
  schema.add({
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    }
  });

  // Add createdBy field
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    }
  });

  // Add createdAt
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Add updatedAt
  schema.add({
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Add isDeleted with index
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  });

  // Pre save hook to update updatedAt
  schema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });

  // Pre findOneAndUpdate hook
  schema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: new Date() });
    next();
  });

  // Method to soft delete
  schema.methods.softDelete = function() {
    this.isDeleted = true;
    this.updatedAt = new Date();
    return this.save();
  };

  // Static method to find non-deleted
  schema.statics.findActive = function(conditions = {}) {
    return this.find({ ...conditions, isDeleted: false });
  };
}