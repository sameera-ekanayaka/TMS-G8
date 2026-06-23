import React, { useState } from 'react';
import { Calendar, User, MoreVertical, Edit2, Trash2, Check, Eye } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

const TaskCard = ({ task, onEdit, onView, canManage = true }) => {
  const { changeTaskStatus, removeTask } = useTasks();
  const [showMenu, setShowMenu] = useState(false);

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
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStatusChange = async (status) => {
    await changeTaskStatus(task.id, status);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await removeTask(task.id);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task.status !== 'Completed';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      isOverdue(task.dueDate) ? 'border-red-300 bg-red-50' : ''
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div
          className={`flex-1 ${onView ? 'cursor-pointer' : ''}`}
          onClick={() => onView && onView()}
          title={onView ? 'View details, comments and attachments' : undefined}
        >
          <h4 className="font-medium text-gray-900 line-clamp-2">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{task.description}</p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
              <div className="p-2 border-b">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Change Status</p>
                {['To Do', 'In Progress', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    {task.status === status && <Check size={14} className="text-green-500" />}
                    <span className={task.status === status ? 'font-medium' : ''}>{status}</span>
                  </button>
                ))}
              </div>
              <div className="p-2">
                {onView && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onView();
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Eye size={14} />
                    View details
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>

        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
          {task.status}
        </span>

        {task.dueDate && (
          <span className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full ${
            isOverdue(task.dueDate) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}

        {task.assignedUser && (
          <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800">
            <User size={12} />
            {task.assignedUser}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;