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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import KanbanColumn from '../components/KanbanColumn';
import KanbanCard from '../components/KanbanCard';

function SprintBoard() {
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data.data;
    },
  });

  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries(['tasks', projectId]);
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, status } : task
        )
      );

      return { previousTasks };
    },
    onError: (err, { taskId }, context) => {
      setTasks(context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = [
    { id: 'NOT_STARTED', title: 'Not Started' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'UNDER_REVIEW', title: 'Under Review' },
    { id: 'BLOCKED', title: 'Blocked' },
    { id: 'COMPLETED', title: 'Completed' },
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    const overColumn = columns.find((c) => c.id === over.id);

    if (overColumn && activeTask.status !== overColumn.id) {
      setTasks((prev) =>
        prev.map((task) =>
          task._id === active.id ? { ...task, status: overColumn.id } : task
        )
      );
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    const overColumn = columns.find((c) => c.id === over.id);

    if (overColumn && activeTask) {
      updateStatusMutation.mutate({
        taskId: active.id,
        status: overColumn.id,
      });
    }
  };

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const createTaskMutation = useMutation({
    mutationFn: (task) => api.post(`/projects/${projectId}/tasks`, task),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
      setShowAddTask(false);
      setNewTask({ title: '', description: '' });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to create task');
    }
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    createTaskMutation.mutate(newTask);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/projects/${projectId}`} className="text-gray-600 hover:text-gray-900">
              ← Project
            </Link>
            <h1 className="text-xl font-bold">Sprint Board</h1>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>

            <DragOverlay>
              {activeTask ? (
                <KanbanCard task={activeTask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Add New Task</h3>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    disabled={createTaskMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                    disabled={createTaskMutation.isPending}
                  >
                    {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

export default SprintBoard;