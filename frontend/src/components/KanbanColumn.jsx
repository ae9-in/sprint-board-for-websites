import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

function KanbanColumn({ id, title, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const getColumnColor = (columnId) => {
    const colors = {
      NOT_STARTED: 'border-gray-300',
      IN_PROGRESS: 'border-blue-300',
      UNDER_REVIEW: 'border-yellow-300',
      BLOCKED: 'border-red-300',
      COMPLETED: 'border-green-300',
    };
    return colors[columnId] || 'border-gray-300';
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-white rounded-lg shadow-sm border-2 ${getColumnColor(id)} ${
        isOver ? 'bg-gray-50' : ''
      }`}
    >
      <div className="p-3 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{tasks.length}</span>
        </div>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <KanbanCard key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default KanbanColumn;