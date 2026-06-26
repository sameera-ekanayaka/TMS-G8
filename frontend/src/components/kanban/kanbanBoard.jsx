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

  const priorityBadgeClass = (priority) => {
    const map = { High: 'ed-badge-high', Medium: 'ed-badge-medium', Low: 'ed-badge-low' };
    return `ed-badge ${map[priority] || 'ed-badge-todo'}`;
  };

  const statusAccent = (status) => {
    const map = {
      'To Do': 'var(--color-faint)',
      'In Progress': 'var(--color-info)',
      'Completed': 'var(--color-success)',
    };
    return map[status] || 'var(--color-faint)';
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
        <div className="ed-spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="ed-page-title">Kanban Board</h1>
          <div className="flex items-center gap-2 mt-1" style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            <span className="ed-dot" style={{ background: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
            <span>{isConnected ? 'Real-time connected' : 'Offline mode'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`ed-btn ed-btn-secondary ed-btn-icon ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh Board"
          >
            <RefreshCw size={18} />
          </button>
          {canManage && (
            <button
              onClick={() => {
                setSelectedStatus('To Do');
                setShowTaskForm(true);
              }}
              className="ed-btn ed-btn-primary"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {STATUSES.map((status) => {
            const columnTasks = groupedTasks[status] || [];
            const accent = statusAccent(status);
            return (
              <div
                key={status}
                className="flex flex-col min-h-[500px]"
                style={{
                  background: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--rounded-md)',
                  overflow: 'hidden',
                }}
              >
                {/* Column header */}
                <div
                  className="flex justify-between items-center px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-hairline)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="ed-dot" style={{ background: accent }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{status}</h3>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-muted)',
                      background: 'var(--color-canvas)',
                      border: '1px solid var(--color-hairline)',
                      borderRadius: 'var(--rounded-full)',
                      padding: '1px 9px',
                      minWidth: 24,
                      textAlign: 'center',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 p-3 space-y-2.5 transition-colors ed-scroll"
                      style={{ background: snapshot.isDraggingOver ? 'var(--color-surface-strong)' : 'transparent' }}
                    >
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div
                          className="flex items-center justify-center text-center rounded-[10px] py-10 px-3"
                          style={{ border: '1px dashed var(--color-hairline-strong)', color: 'var(--color-faint)', fontSize: 13 }}
                        >
                          No tasks
                        </div>
                      )}
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                background: 'var(--color-canvas)',
                                border: '1px solid var(--color-hairline)',
                                borderRadius: 'var(--rounded-md)',
                                padding: '14px',
                                boxShadow: snapshot.isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                                borderLeft: `3px solid ${accent}`,
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <h4 className="line-clamp-2" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                                  {task.title}
                                </h4>
                                <span className={priorityBadgeClass(task.priority)} style={{ flexShrink: 0 }}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className="line-clamp-2 mb-3" style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                                  {task.description}
                                </p>
                              )}

                              <div
                                className="flex justify-between items-center pt-2.5"
                                style={{ fontSize: 12, color: 'var(--color-muted)', borderTop: '1px solid var(--color-hairline)' }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={13} />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User size={13} />
                                  <span className="truncate max-w-[90px]">
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