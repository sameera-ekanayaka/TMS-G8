import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', sortBy: 'dueDate', order: 'asc' });
  const { socket } = useSocket();

  const { token } = useAuth();

  const backendToFrontendPriority = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High'
  };

  const backendToFrontendStatus = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed'
  };

  // Helper to transform task data for UI consumption (assignedUser, assignedUserId)
  const transformTask = (task) => {
    if (!task) return task;
    return {
      ...task,
      priority: backendToFrontendPriority[task.priority] || task.priority,
      status: backendToFrontendStatus[task.status] || task.status,
      assignedUser: task.assignments?.[0]?.user?.name || null,
      assignedUserId: task.assignments?.[0]?.user?.id || '',
    };
  };

  // Fetch tasks with filters
  const fetchTasks = async (filterParams = filters) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getTasks(token, filterParams);
      setTasks((response.data.tasks || []).map(transformTask));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const addTask = async (taskData) => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        ...taskData,
        priority: taskData.priority ? taskData.priority.toUpperCase() : undefined,
        status: taskData.status ? (taskData.status === 'To Do' ? 'TODO' : taskData.status === 'In Progress' ? 'IN_PROGRESS' : 'COMPLETED') : undefined,
      };
      const response = await createTask(token, payload);
      setTasks(prev => [...prev, transformTask(response.data.task)]);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const editTask = async (taskId, taskData) => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        ...taskData,
        priority: taskData.priority ? taskData.priority.toUpperCase() : undefined,
        status: taskData.status ? (taskData.status === 'To Do' ? 'TODO' : taskData.status === 'In Progress' ? 'IN_PROGRESS' : 'COMPLETED') : undefined,
      };
      const response = await updateTask(token, taskId, payload);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? transformTask(response.data.task) : task
      ));
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const removeTask = async (taskId) => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteTask(token, taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update task status
  const changeTaskStatus = async (taskId, status) => {
    if (!token) return;
    try {
      const backendStatus = status === 'To Do' ? 'TODO' : status === 'In Progress' ? 'IN_PROGRESS' : 'COMPLETED';
      const response = await updateTaskStatus(token, taskId, backendStatus);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? transformTask(response.data.task) : task
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    }
  };

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('taskCreated', (newTask) => {
      setTasks(prev => [...prev, transformTask(newTask)]);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? transformTask(updatedTask) : task
      ));
    });

    socket.on('taskDeleted', (taskId) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    });

    socket.on('task_status_changed', (data) => {
      const taskId = data.taskId || (data.task && data.task.id);
      const newStatus = data.newStatus || (data.task && data.task.status);
      if (taskId && newStatus) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: backendToFrontendStatus[newStatus] || newStatus } : task
        ));
      }
    });

    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('taskStatusChanged');
    };
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      error,
      filters,
      setFilters,
      fetchTasks,
      addTask,
      editTask,
      removeTask,
      changeTaskStatus,
    }}>
      {children}
    </TaskContext.Provider>
  );
};