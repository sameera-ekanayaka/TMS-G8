import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTasks } from '../../context/TaskContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Calendar, User, RefreshCw } from 'lucide-react';
import TaskForm from '../Task/TaskForm';

const STATUSES = ['To Do', 'In Progress', 'Completed'];

const KanbanBoard = () => {
  const { tasks, loading, changeTaskStatus, fetchTasks } = useTasks();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const [groupedTasks, setGroupedTasks] = useState({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group tasks by status
  useEffect(() => {
    const grouped = STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {});
    setGroupedTasks(grouped);
  }, [tasks]);

  // Real-time task updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      console.log('📝 Kanban: Task created', newTask);
      fetchTasks();
    };

    const handleTaskUpdated = (updatedTask) => {
      console.log('📝 Kanban: Task updated', updatedTask);
      fetchTasks();
    };

    const handleTaskDeleted = (taskId) => {
      console.log('📝 Kanban: Task deleted', taskId);
      fetchTasks();
    };

    const handleTaskStatusChanged = ({ taskId, newStatus }) => {
      console.log('📝 Kanban: Task status changed', taskId, newStatus);
      fetchTasks();
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('taskStatusChanged', handleTaskStatusChanged);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('taskStatusChanged', handleTaskStatusChanged);
    };
  }, [socket, fetchTasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return;

    // Update local state optimistically
    const sourceColumn = [...groupedTasks[source.droppableId]];
    const [removed] = sourceColumn.splice(source.index, 1);
    const destColumn = [...groupedTasks[destination.droppableId]];
    destColumn.splice(destination.index, 0, removed);

    setGroupedTasks({
      ...groupedTasks,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });

    // Update backend
    try {
      await changeTaskStatus(draggableId, destination.droppableId);
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert on error
      const reverted = STATUSES.reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
      }, {});
      setGroupedTasks(reverted);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Real-time connected' : 'Offline mode'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh Board"
          >
            <RefreshCw size={20} />
          </button>
          {canManage && (
            <button
              onClick={() => {
                setSelectedStatus('To Do');
                setShowTaskForm(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUSES.map((status) => {
            const columnTasks = groupedTasks[status] || [];
            return (
              <div key={status} className="bg-gray-50 rounded-xl border p-4 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">{status}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                    {columnTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-100/50' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-all ${
                                snapshot.isDragging ? 'shadow-md ring-2 ring-indigo-500/10' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-medium text-gray-850 line-clamp-2">{task.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-gray-500 text-xs line-clamp-3 mb-4">{task.description}</p>
                              )}
                              
                              <div className="flex justify-between items-center text-gray-400 text-xs">
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User size={12} />
                                  <span className="truncate max-w-[80px]">
                                    {task.assignments?.[0]?.user?.name || 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showTaskForm && (
        <TaskForm
          onClose={() => {
            setShowTaskForm(false);
            setSelectedStatus(null);
          }}
          initialStatus={selectedStatus}
        />
      )}
    </>
  );
};

export default KanbanBoard;