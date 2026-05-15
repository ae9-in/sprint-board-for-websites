import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { motion } from 'framer-motion';

function KanbanColumn({ id, title, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const getColumnGlow = (columnId) => {
    const glows = {
      NOT_STARTED: 'border-white/10',
      IN_PROGRESS: 'border-blue-500/30',
      UNDER_REVIEW: 'border-yellow-500/30',
      BLOCKED: 'border-red-500/30',
      COMPLETED: 'border-emerald-500/30',
    };
    return glows[columnId] || 'border-white/10';
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-2xl glass transition-all duration-300 border ${getColumnGlow(id)} ${
        isOver ? 'bg-white/5 ring-2 ring-primary/20' : ''
      } flex flex-col max-h-full`}
    >
      <div className="p-5 border-b border-white/5 sticky top-0 glass z-10 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-premium tracking-tight">{title}</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
          </div>
          <span className="text-[10px] font-black bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/40 uppercase tracking-widest">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto no-scrollbar min-h-[500px]">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {tasks.map((task) => (
              <KanbanCard key={task._id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default KanbanColumn;