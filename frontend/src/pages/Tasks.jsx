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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-borderstrong/30">
        <div>
          <h1 className="text-[28px] font-normal text-ink tracking-tight">Tasks</h1>
          <p className="text-[14px] text-muted mt-1 font-medium">
            {urlProjectId ? 'Viewing tasks for selected project' : 'Manage all your tasks in one place'}
          </p>
        </div>
        <div className="flex gap-3">
          {urlProjectId && (
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('projectId');
                setSearchParams(newParams);
              }}
              className="bg-canvas border border-borderstrong text-ink px-4 py-2 rounded-md hover:bg-surface-strong transition-colors flex items-center gap-2 text-[14px] font-medium"
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
              className="bg-primary text-white px-5 py-2.5 rounded-pill hover:bg-primary-active flex items-center gap-2 text-[14px] font-medium transition-colors"
            >
              <Plus size={18} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="bg-canvas border border-borderstrong/40 rounded-lg p-5 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-borderstrong rounded-md text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-link focus:border-link transition-colors"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-borderstrong rounded-md text-[14px] font-medium text-ink hover:bg-surface-strong transition-colors"
          >
            <Filter size={18} />
            Filters
          </button>

          {/* View Toggle */}
          <div className="flex border border-borderstrong rounded-md overflow-hidden">
            {['table', 'board'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 capitalize flex items-center gap-2 text-[14px] font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-white'
                    : 'bg-canvas text-ink hover:bg-surface-strong'
                }`}
              >
                {getViewIcon(mode)}
                <span className="hidden sm:inline">{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-borderstrong/30">
            <div>
              <label className="block text-[13px] font-medium text-muted mb-1.5">Status</label>
              <select
                value={filters.status || 'All'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-borderstrong rounded-md px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-link focus:border-link"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-muted mb-1.5">Priority</label>
              <select
                value={filters.priority || 'All'}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="border border-borderstrong rounded-md px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-link focus:border-link"
              >
                {priorityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-muted mb-1.5">Sort By</label>
              <select
                value={filters.sortBy !== undefined ? filters.sortBy : 'dueDate'}
                onChange={(e) => handleSortChange('sortBy', e.target.value)}
                className="border border-borderstrong rounded-md px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-link focus:border-link"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Display based on view mode */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500">No tasks found</p>
          {canManage && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="mt-4 text-blue-500 hover:underline"
            >
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
              <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4">
                {['To Do', 'In Progress', 'Completed'].map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status);
                  
                  // Modern colorful styles for columns
                  const getColumnStyles = (s) => {
                    switch(s) {
                      case 'To Do': return { bg: 'bg-[#F4F7FE]', accent: 'bg-[#4318FF]', text: 'text-[#4318FF]' };
                      case 'In Progress': return { bg: 'bg-[#FFF9E6]', accent: 'bg-[#FFB547]', text: 'text-[#FFB547]' };
                      case 'Completed': return { bg: 'bg-[#E9FAF1]', accent: 'bg-[#05CD99]', text: 'text-[#05CD99]' };
                      default: return { bg: 'bg-gray-50', accent: 'bg-gray-400', text: 'text-gray-800' };
                    }
                  };
                  const styles = getColumnStyles(status);

                  return (
                  <Droppable key={status} droppableId={status}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 min-w-[320px] ${styles.bg} rounded-[32px] p-5 min-h-[500px] border-4 border-white shadow-sm`}
                      >
                        <div className="flex items-center justify-between mb-5 px-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${styles.accent} shadow-sm`}></div>
                            <h3 className="font-bold text-[16px] text-gray-800 tracking-tight">{status}</h3>
                          </div>
                          <span className={`bg-white shadow-sm ${styles.text} text-[11px] font-extrabold px-3 py-1 rounded-full`}>
                            {columnTasks.length} {columnTasks.length === 1 ? 'Task' : 'Tasks'}
                          </span>
                        </div>
                        <div className="space-y-4 min-h-[50px]">
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