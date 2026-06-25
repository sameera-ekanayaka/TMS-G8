import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Plus, LayoutGrid, LayoutList, Kanban } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from '../components/Task/TaskCard';
import TaskTable from '../components/Task/TaskTable';
import TaskForm from '../components/Task/TaskForm';
import TaskDetails from '../components/Task/TaskDetails';
import { useSearchParams } from 'react-router-dom';

const Tasks = () => {
  const { tasks, loading, filters, setFilters, fetchTasks, addTask, editTask, removeTask, changeTaskStatus } = useTasks();
  const { socket } = useSocket();
  const { user } = useAuth();
  // only managers create/edit/delete. collaborators can still view and
  // change status on tasks assigned to them.
  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'table', 'board'

  const statusOptions = ['All', 'To Do', 'In Progress', 'Completed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High'];
  const sortOptions = [
    { value: '', label: 'None' },
    { value: 'projectId', label: 'Project' },
  ];

  // Real-time task updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      console.log('📝 Real-time: Task created', newTask);
      fetchTasks();
    };

    const handleTaskUpdated = (updatedTask) => {
      console.log('📝 Real-time: Task updated', updatedTask);
      fetchTasks();
    };

    const handleTaskDeleted = (taskId) => {
      console.log('📝 Real-time: Task deleted', taskId);
      fetchTasks();
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [socket, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTaskId = searchParams.get('taskId');
  const urlProjectId = searchParams.get('projectId');

  useEffect(() => {
    if (urlTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === parseInt(urlTaskId));
      if (task) {
        setViewingTask(task);
        setSearchParams({});
      }
    }
  }, [urlTaskId, tasks, setSearchParams]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'All' ? '' : value };
    setFilters(newFilters);
    fetchTasks(newFilters);
  };

  const handleSortChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    fetchTasks({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    const updatedFilters = { status: '', priority: '', sortBy: '', order: '' };
    setFilters(updatedFilters);
    fetchTasks(updatedFilters);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTasks = tasks.filter(task => {
    if (urlProjectId && task.projectId !== urlProjectId) return false;
    if (!searchTerm) return true;
    return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getViewIcon = (mode) => {
    switch (mode) {
      case 'grid': return <LayoutGrid size={18} />;
      case 'table': return <LayoutList size={18} />;
      case 'board': return <Kanban size={18} />;
      default: return <LayoutGrid size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ed-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
        <div>
          <h1 className="ed-page-title">Tasks</h1>
          <p className="ed-page-subtitle">
            {urlProjectId ? 'Viewing tasks for selected project' : 'Manage all your tasks in one place'}
          </p>
        </div>
        <div className="flex gap-2">
          {urlProjectId && (
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('projectId');
                setSearchParams(newParams);
              }}
              className="ed-btn ed-btn-secondary"
            >
              Clear Project Filter
            </button>
          )}
          {canManage && (
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
              className="ed-btn ed-btn-primary"
            >
              <Plus size={18} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="ed-card-flat p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={17} style={{ color: 'var(--color-faint)' }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearch}
                className="ed-input"
                style={{ paddingLeft: 38, height: 40 }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ed-btn ed-btn-secondary"
          >
            <Filter size={17} />
            Filters
          </button>

          {/* View Toggle — segmented control */}
          <div
            className="flex p-1 gap-1"
            style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}
          >
            {['table', 'board'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="capitalize flex items-center gap-2 px-3 py-1.5 transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 'var(--rounded-sm)',
                  background: viewMode === mode ? 'var(--color-canvas)' : 'transparent',
                  color: viewMode === mode ? 'var(--color-ink)' : 'var(--color-muted)',
                  boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {getViewIcon(mode)}
                <span className="hidden sm:inline">{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-hairline)' }}>
            <div>
              <label className="ed-label">Status</label>
              <select
                value={filters.status || 'All'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="ed-select"
                style={{ height: 40, width: 'auto', minWidth: 150 }}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="ed-label">Priority</label>
              <select
                value={filters.priority || 'All'}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="ed-select"
                style={{ height: 40, width: 'auto', minWidth: 150 }}
              >
                {priorityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="ed-label">Sort By</label>
              <select
                value={filters.sortBy !== undefined ? filters.sortBy : 'dueDate'}
                onChange={(e) => handleSortChange('sortBy', e.target.value)}
                className="ed-select"
                style={{ height: 40, width: 'auto', minWidth: 150 }}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="ed-btn ed-btn-ghost"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Display based on view mode */}
      {filteredTasks.length === 0 ? (
        <div className="ed-card-flat text-center" style={{ padding: '64px 24px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>☰</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No tasks found</p>
          {canManage && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="ed-btn ed-btn-primary"
              style={{ marginTop: 16 }}
            >
              <Plus size={16} />
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <TaskTable
              tasks={filteredTasks}
              canManage={canManage}
              onView={(task) => setViewingTask(task)}
              onEdit={(task) => {
                setEditingTask(task);
                setShowTaskForm(true);
              }}
            />
          )}

          {viewMode === 'board' && (
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;
                const sourceStatus = result.source.droppableId;
                const destStatus = result.destination.droppableId;
                const taskId = isNaN(parseInt(result.draggableId)) ? result.draggableId : parseInt(result.draggableId);
                
                if (sourceStatus !== destStatus) {
                  changeTaskStatus(taskId, destStatus);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                {['To Do', 'In Progress', 'Completed'].map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status);

                  const accentMap = {
                    'To Do': 'var(--color-faint)',
                    'In Progress': 'var(--color-info)',
                    'Completed': 'var(--color-success)',
                  };
                  const accent = accentMap[status] || 'var(--color-faint)';

                  return (
                  <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col min-h-[500px]"
                        style={{
                          background: 'var(--color-surface-soft)',
                          border: '1px solid var(--color-hairline)',
                          borderRadius: 'var(--rounded-md)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3 shrink-0"
                          style={{ borderBottom: '1px solid var(--color-hairline)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="ed-dot" style={{ background: accent }} />
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{status}</h3>
                          </div>
                          <span
                            style={{
                              fontSize: 12, fontWeight: 600, color: 'var(--color-muted)',
                              background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
                              borderRadius: 'var(--rounded-full)', padding: '1px 9px', minWidth: 24, textAlign: 'center',
                            }}
                          >
                            {columnTasks.length}
                          </span>
                        </div>
                        <div
                          className="flex-1 p-3 space-y-3 ed-scroll transition-colors"
                          style={{ background: snapshot.isDraggingOver ? 'var(--color-surface-strong)' : 'transparent' }}
                        >
                          {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div
                              className="flex items-center justify-center text-center py-10 px-3"
                              style={{ border: '1px dashed var(--color-hairline-strong)', borderRadius: 'var(--rounded-md)', color: 'var(--color-faint)', fontSize: 13 }}
                            >
                              No tasks
                            </div>
                          )}
                          {columnTasks
                            .map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <TaskCard
                                      task={task}
                                      canManage={canManage}
                                      onView={() => setViewingTask(task)}
                                      onEdit={() => {
                                        setEditingTask(task);
                                        setShowTaskForm(true);
                                      }}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )})}
              </div>
            </DragDropContext>
          )}
        </>
      )}

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          onSuccess={() => fetchTasks()}
        />
      )}

      {viewingTask && (
        <TaskDetails
          task={viewingTask}
          onClose={() => setViewingTask(null)}
        />
      )}
    </div>
  );
};

export default Tasks;