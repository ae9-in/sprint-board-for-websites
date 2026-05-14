import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
      className={`bg-white p-3 border rounded-md shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging || isSortableDragging ? 'opacity-50' : ''
      } hover:shadow-md transition-shadow`}
    >
      <h4 className="font-medium text-sm mb-2">{task.title}</h4>

      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
          {formatPriority(task.priority)}
        </span>
        {task.labels?.map((label, index) => (
          <span
            key={index}
            className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
          >
            {label}
          </span>
        ))}
      </div>

      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
            {task.assignedTo.fullName?.charAt(0) || '?'}
          </div>
          <span className="text-xs text-gray-600">{task.assignedTo.fullName}</span>
        </div>
      )}

      {task.dueDate && (
        <div className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
          Due: {formatDate(task.dueDate)}
        </div>
      )}

      {/* Subtask progress */}
      {task.subtaskCount > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Subtasks</span>
            <span>
              {task.completedSubtasks || 0}/{task.subtaskCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full"
              style={{
                width: `${((task.completedSubtasks || 0) / task.subtaskCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default KanbanCard;