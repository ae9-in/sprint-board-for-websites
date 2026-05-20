import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import KanbanColumn from '../components/KanbanColumn';
import KanbanCard from '../components/KanbanCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Plus, 
  ChevronLeft, 
  Filter, 
  Settings2,
  Rocket,
  Search,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SprintBoard() {
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [activeId, setActiveId] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM' });

  // Core Data Fetching
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data.data;
    },
  });

  // Real-time Synchronization
  useEffect(() => {
    if (socket && projectId) {
      socket.emit('join-project', projectId);

      socket.on('task-updated', (updatedTask) => {
        queryClient.setQueryData(['tasks', projectId], (old) => 
          old?.map(t => t._id === updatedTask._id ? updatedTask : t)
        );
      });

      socket.on('task-created', (newTask) => {
        queryClient.setQueryData(['tasks', projectId], (old) => [newTask, ...(old || [])]);
      });

      socket.on('task-deleted', (deletedTaskId) => {
        queryClient.setQueryData(['tasks', projectId], (old) => 
          old?.filter(t => t._id !== deletedTaskId)
        );
      });

      return () => {
        socket.off('task-updated');
        socket.off('task-created');
        socket.off('task-deleted');
      };
    }
  }, [socket, projectId, queryClient]);

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries(['tasks', projectId]);
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      queryClient.setQueryData(['tasks', projectId], (old) =>
        old.map((task) => task._id === taskId ? { ...task, status } : task)
      );
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      toast.error('Failed to update task status');
    },
    onSuccess: () => {
      toast.success('Task status updated');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = [
    { id: 'NOT_STARTED', title: 'Not Started' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'UNDER_REVIEW', title: 'Under Review' },
    { id: 'BLOCKED', title: 'Blocked' },
    { id: 'COMPLETED', title: 'Completed' },
  ];

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    const overId = over.id;
    const overColumn = columns.find(c => c.id === overId);
    
    if (overColumn && activeTask.status !== overColumn.id) {
      updateStatusMutation.mutate({ taskId: active.id, status: overColumn.id });
    }
  };

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  const createTaskMutation = useMutation({
    mutationFn: (task) => api.post(`/projects/${projectId}/tasks`, task),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
      setShowAddTask(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM' });
      toast.success('Task created successfully');
    },
  });

  if (isLoading) return <BoardSkeleton />;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-transparent mb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to={`/projects/${projectId}`} className="p-2 sm:p-2.5 glass rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white flex-shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 truncate">Sprint Board</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-premium tracking-tight truncate">Active Sprint #24</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex -space-x-2 mr-2 hidden sm:flex">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-9 h-9 rounded-xl border-2 border-[#0F172A] bg-gray-800 flex items-center justify-center text-xs font-bold shadow-xl">
                  {String.fromCharCode(64+i)}
                </div>
              ))}
            </div>
            <button className="glass p-2.5 sm:p-3 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-white flex-shrink-0">
              <Filter className="w-5 h-5" />
            </button>
            <button className="glass p-2.5 sm:p-3 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-white flex-shrink-0">
              <Settings2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddTask(true)}
              className="btn-primary-premium flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3"
            >
              <Plus className="w-5 h-5 flex-shrink-0" /> <span className="hidden xs:inline">Add Task</span>
            </button>
          </div>
        </header>

        {/* Board Content */}
        <div className="flex-1 min-h-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-10 h-full no-scrollbar snap-x snap-mandatory">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasks.filter(t => t.status === column.id)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] border border-white/10"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-premium">Create New Task</h3>
                  <p className="text-white/40 text-xs sm:text-sm font-medium">Initialize a new work item in the backlog</p>
                </div>
                <button onClick={() => setShowAddTask(false)} className="p-2 glass rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all flex-shrink-0">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(newTask); }} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Task Title</label>
                    <div className="relative group">
                      <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                      <input
                        autoFocus
                        type="text"
                        required
                        placeholder="e.g., Redesign landing page hero"
                        className="glass-input w-full pl-12 h-14 text-base sm:text-lg"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      placeholder="Provide detailed context for this task..."
                      className="glass-input w-full min-h-[120px] py-4 text-sm sm:text-base resize-none"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Priority</label>
                      <select
                        className="glass-input w-full h-12 text-sm font-bold appearance-none bg-no-repeat bg-[right_1rem_center]"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Estimate</label>
                      <input type="text" placeholder="e.g., 4h" className="glass-input w-full h-12 text-sm font-bold" />
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-5 border-t border-white/5 flex gap-4 bg-[#111827]/50 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 h-12 sm:h-14 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-all text-sm sm:text-base"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="flex-[2] h-12 sm:h-14 btn-primary-premium flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {createTaskMutation.isPending ? 'Processing...' : (
                      <>
                        Create Task <Plus className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function BoardSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-pulse h-full flex flex-col">
        <div className="h-20 bg-white/5 rounded-2xl"></div>
        <div className="flex-1 flex gap-6 overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="w-80 bg-white/5 rounded-2xl shrink-0"></div>)}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SprintBoard;