import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTasks } from '../../context/TaskContext';
import { useSocket } from '../../context/SocketContext';
import { Plus, Calendar, User, RefreshCw } from 'lucide-react';
import TaskForm from '../Task/TaskForm';

const STATUSES = ['To Do', 'In Progress', 'Completed'];

const KanbanBoard = () => {
  const { tasks, loading, changeTaskStatus, fetchTasks } = useTasks();
  const { socket, isConnected } = useSocket();
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
          <div className="flex items-center gap-2 text