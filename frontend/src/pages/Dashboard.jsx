import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  List, 
  Calendar,
  TrendingUp,
  BarChart3,
  User,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';

const Dashboard = () => {
  // Get data from contexts
  const { tasks, loading } = useTasks();
  const { user } = useAuth();
  
  // State for stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    overdue: 0,
    completionRate: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });
  
  // State for weekly data
  const [weeklyData, setWeeklyData] = useState([]);

  // Calculate stats when tasks change
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completed = tasks.filter(t => t.status === 'Completed').length;
      const inProgress = tasks.filter(t => t.status === 'In Progress').length;
      const todo = tasks.filter(t => t.status === 'To Do').length;
      const overdue = tasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;
      const highPriority = tasks.filter(t => t.priority === 'High').length;
      const mediumPriority = tasks.filter(t => t.priority === 'Medium').length;
      const lowPriority = tasks.filter(t => t.priority === 'Low').length;

      setStats({
        total: tasks.length,
        completed,
        inProgress,
        todo,
        overdue,
        completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        highPriority,
        mediumPriority,
        lowPriority,
      });

      calculateWeeklyData(tasks);
    } else {
      setStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
        completionRate: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
      });
      setWeeklyData([]);
    }
  }, [tasks]);

  // Calculate weekly data
  const calculateWeeklyData = (taskList) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekTasks = taskList.filter(t => {
      const created = new Date(t.createdAt);
      return created >= weekAgo && created <= now;
    });

    const weeklyStats = days.map(day => {
      const dayTasks = weekTasks.filter(t => {
        const dayOfWeek = new Date(t.createdAt).getDay();
        const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' };
        return dayMap[dayOfWeek] === day;
      });
      return {
        day,
        created: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'Completed').length,
      };
    });

    setWeeklyData(weeklyStats);
  };

  // Data for charts
  const statusData = [
    { name: 'To Do', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Completed', value: stats.completed },
  ];

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981'];

  const priorityData = [
    { name: 'Low', count: stats.lowPriority || 0 },
    { name: 'Medium', count: stats.mediumPriority || 0 },
    { name: 'High', count: stats.highPriority || 0 },
  ];

  const priorityColors = ['#10B981', '#F59E0B', '#EF4444'];

  // Get recent tasks (last 5)
  const recentTasks = tasks && tasks.length > 0 
    ? [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    : [];

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

  const getStatusIcon = (status) => {
    const icons = {
      'To Do': '📋',
      'In Progress': '⏳',
      'Completed': '✅',
    };
    return icons[status] || '📌';
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's an overview of your tasks and progress</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <User size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600">{user?.role || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <List className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span>All tasks in the system</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-xl">
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span>Currently active tasks</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdue}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <AlertCircle className="text-red-500" size={24} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span className="text-red-500">⚠️ Need attention</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          {tasks && tasks.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 size={56} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tasks to display</p>
                <p className="text-sm">Create your first task to see analytics</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          {tasks && tasks.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={priorityColors[index % priorityColors.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 size={56} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tasks to display</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress and Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          {weeklyData.length > 0 && weeklyData.some(d => d.created > 0 || d.completed > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#3B82F6" 
                    name="Created" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10B981" 
                    name="Completed" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp size={56} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No weekly data available</p>
                <p className="text-sm">Tasks created/completed this week will appear here</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Last 5 tasks
            </span>
          </div>
          {recentTasks.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <List size={56} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm">Create your first task to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(task.status)}</span>
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          (() => {
                            if (task.status === 'Completed') return 'bg-gray-100 text-gray-600';
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dueDate = new Date(task.dueDate);
                            dueDate.setHours(0, 0, 0, 0);
                            return dueDate < today ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600';
                          })()
                        }`}>
                          <Calendar size={12} />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Overall Completion Rate</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-blue-600">{stats.completionRate}%</span>
                {stats.completionRate > 70 && stats.total > 0 && (
                  <span className="text-green-500 bg-green-50 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <ArrowUp size={14} />
                    Great!
                  </span>
                )}
                {stats.completionRate < 30 && stats.total > 0 && (
                  <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <ArrowDown size={14} />
                    Needs focus
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  stats.completionRate > 70 ? 'bg-green-500' :
                  stats.completionRate > 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-500">
                {stats.completed} out of {stats.total} tasks completed
              </span>
              {stats.total > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">To Do: {stats.todo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">In Progress: {stats.inProgress}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Completed: {stats.completed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;