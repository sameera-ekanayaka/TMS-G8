import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../services/api';
import { useSocket } from './SocketContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', sortBy: 'dueDate', order: 'asc' });
  const { socket } = useSocket();

  const token = localStorage.getItem('token');

  // Fetch tasks with filters
  const fetchTasks = async (filterParams = filters) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getTasks(token, filterParams);
      setTasks(response.data);
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
      const response = await createTask(token, taskData);
      setTasks(prev => [...prev, response.data]);
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
      const response = await updateTask(token, taskId, taskData);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? response.data : task
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
      const response = await updateTaskStatus(token, taskId, status);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? response.data : task
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
      setTasks(prev => [...prev, newTask]);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    });

    socket.on('taskDeleted', (taskId) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    });

    socket.on('taskStatusChanged', ({ taskId, newStatus }) => {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
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