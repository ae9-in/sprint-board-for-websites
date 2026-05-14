import mongoose from 'mongoose';
import basePlugin from './plugins/basePlugin.js';

const taskCommentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

taskCommentSchema.plugin(basePlugin);

taskCommentSchema.index({ taskId: 1, createdAt: -1 });

export const TaskComment = mongoose.model('TaskComment', taskCommentSchema);
export default TaskComment;