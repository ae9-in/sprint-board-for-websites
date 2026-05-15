import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Paperclip,
  MoreVertical
} from 'lucide-react';
import {
  formatPriority,
  getPriorityColor,
  formatDate,
  isOverdue
} from '../utils/formatters';

function KanbanCard({ task, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card p-5 group cursor-grab active:cursor-grabbing border border-white/5 relative overflow-hidden ${
        isDragging || isSortableDragging ? 'opacity-30 border-primary/50 ring-2 ring-primary/20' : ''
      }`}
    >
      {/* Priority Glow */}
      <div className={`absolute top-0 left-0 w-1 h-full opacity-50 ${getPriorityGlow(task.priority)}`} />

      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getPriorityStyle(task.priority)}`}>
          {formatPriority(task.priority)}
        </span>
        <button className="text-white/20 hover:text-white transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <h4 className="font-bold text-premium mb-4 group-hover:text-primary transition-colors leading-snug">
        {task.title}
      </h4>

      <div className="flex flex-wrap gap-2 mb-5">
        {task.labels?.map((label, index) => (
          <span
            key={index}
            className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                {task.assignedTo.fullName?.charAt(0)}
              </div>
              <span className="text-[11px] font-bold text-white/40">{task.assignedTo?.fullName?.split(' ')[0] || 'Unassigned'}</span>
            </div>
          ) : (
             <div className="w-7 h-7 rounded-lg glass border border-dashed border-white/10 flex items-center justify-center">
              <span className="text-[10px] text-white/20">?</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-white/30">
          {task.subtaskCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black">{task.completedSubtasks || 0}/{task.subtaskCount}</span>
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase">{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for subtasks */}
      {task.subtaskCount > 0 && (
        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${((task.completedSubtasks || 0) / task.subtaskCount) * 100}%` }} 
          />
        </div>
      )}
    </div>
  );
}

function getPriorityStyle(priority) {
  const styles = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return styles[priority] || styles.MEDIUM;
}

function getPriorityGlow(priority) {
  const glows = {
    LOW: 'bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.5)]',
    MEDIUM: 'bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]',
    HIGH: 'bg-orange-500 shadow-[2px_0_10px_rgba(249,115,22,0.5)]',
    CRITICAL: 'bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.5)]',
  };
  return glows[priority] || glows.MEDIUM;
}

export default KanbanCard;