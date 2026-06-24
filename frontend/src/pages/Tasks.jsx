import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Plus, LayoutGrid, LayoutList, Kanban } from 'lucide-react';
import TaskCard from '../components/Task/TaskCard';
import TaskTable from '../components/Task/TaskTable';
import TaskForm from '../components/Task/TaskForm';
import TaskDetails from '../components/Task/TaskDetails';

const Tasks = () => {
  const { tasks, loading, filters, setFilters, fetchTasks, addTask, editTask, removeTask } = useTasks();
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
  const [viewMode, setViewMode] = useState('table'); // 'table', 'board'

  const statusOptions = ['All', 'To Do', 'In Progress', 'Completed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High'];
  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Created Date' },
  ];
  const orderOptions = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
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

    const handleTaskStatusChanged = (data) => {
      console.log('📝 Real-time: Task status changed', data);
      fetchTasks();
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('task_status_changed', handleTaskStatusChanged);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('task_status_changed', handleTaskStatusChanged);
    };
  }, [socket, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value === 'All' ? '' : value });
  };

  const handleSortChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    fetchTasks({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    const updatedFilters = { ...filters, sortBy: 'dueDate', order: 'asc' };
    setFilters(updatedFilters);
    fetchTasks(updatedFilters);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTasks = tasks.filter(task => {
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage all your tasks in one place</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={20} />
            New Task
          </button>
        )}
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter size={18} />
            Filters
          </button>

          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            {['table', 'board'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 capitalize flex items-center gap-1 transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon(mode)}
                <span className="hidden sm:inline">{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={filters.status || 'All'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Priority</label>
              <select
                value={filters.priority || 'All'}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Sort By</label>
              <select
                value={filters.sortBy || 'dueDate'}
                onChange={(e) => handleSortChange('sortBy', e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Order</label>
              <select
                value={filters.order || 'asc'}
                onChange={(e) => handleSortChange('order', e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {orderOptions.map(option => (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['To Do', 'In Progress', 'Completed'].map((status) => (
                <div key={status} className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
                  <h3 className="font-medium mb-3">{status}</h3>
                  <div className="space-y-3">
                    {filteredTasks
                      .filter(task => task.status === status)
                      .map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          canManage={canManage}
                          onView={() => setViewingTask(task)}
                          onEdit={() => {
                            setEditingTask(task);
                            setShowTaskForm(true);
                          }}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
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