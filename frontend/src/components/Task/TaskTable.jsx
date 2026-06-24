import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Calendar, User, Tag, Edit2, Trash2, ChevronUp, ChevronDown, Folder } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TaskTable = ({ tasks, onEdit, onView, canManage = true }) => {
  const { changeTaskStatus, removeTask } = useTasks();
  const { user } = useAuth();
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const getPriorityBadge = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'To Do': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await removeTask(taskId);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-1">
                Task
                {getSortIcon('title')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center gap-1">
                Priority
                {getSortIcon('priority')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                Status
                {getSortIcon('status')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('assignedUser')}
            >
              <div className="flex items-center gap-1">
                Assigned To
                {getSortIcon('assignedUser')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('dueDate')}
            >
              <div className="flex items-center gap-1">
                Due Date
                {getSortIcon('dueDate')}
              </div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedTasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div
                  className={onView ? 'cursor-pointer' : ''}
                  onClick={() => onView && onView(task)}
                  title={onView ? 'View details, comments and attachments' : undefined}
                >
                  <p className="font-medium text-gray-900 hover:text-blue-600">{task.title}</p>
                  {task.project && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mt-1">
                      <Folder size={10} />
                      {task.project.name}
                    </span>
                  )}
                  {task.assignedUserId === user?.id && (
                    <span className="inline-block mt-1 ml-1 px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800 rounded-full border border-green-200">
                      Assigned to me
                    </span>
                  )}
                  {task.description && (
                    <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(task.priority)}`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  {task.assignedUser || 'Unassigned'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(task.dueDate)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t">
          <tr>
            <td colSpan="6" className="px-4 py-3 text-sm text-gray-500">
              {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TaskTable;