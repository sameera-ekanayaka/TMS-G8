import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Edit2, Trash2, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TaskTable = ({ tasks, onEdit, onView, canManage = true }) => {
  const { changeTaskStatus, removeTask } = useTasks();
  const { user } = useAuth();
  const [sortField, setSortField] = useState('priority');
  const [sortDirection, setSortDirection] = useState('desc');

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-signature-coral text-white border border-signature-coral';
      case 'Medium': return 'bg-signature-yellow text-ink border border-signature-yellow';
      case 'Low': default: return 'bg-signature-mint text-ink border border-signature-mint';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'To Do': return 'bg-surface-strong text-ink border border-borderstrong/20';
      case 'In Progress': return 'bg-signature-peach text-ink border border-signature-peach';
      case 'Completed': return 'bg-success text-white border border-success';
      default: return 'bg-surface-strong text-ink border border-borderstrong/20';
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric'
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

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortField) return 0;
    
    if (sortField === 'priority') {
      const priorityWeights = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const aWeight = priorityWeights[a.priority] || 0;
      const bWeight = priorityWeights[b.priority] || 0;
      
      if (aWeight < bWeight) return sortDirection === 'asc' ? -1 : 1;
      if (aWeight > bWeight) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

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
    <div className="bg-canvas border border-borderstrong/40 rounded-md p-6 px-8 shadow-sm font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-borderstrong/30">
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted cursor-pointer whitespace-nowrap hover:text-ink transition-colors" onClick={() => handleSort('title')}>
                Task Name <span className="inline-block ml-1 text-[10px] opacity-60">↕</span>
              </th>
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted cursor-pointer whitespace-nowrap hover:text-ink transition-colors" onClick={() => handleSort('priority')}>
                Priority <span className="inline-block ml-1 text-[10px] opacity-60">↕</span>
              </th>
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted cursor-pointer whitespace-nowrap hover:text-ink transition-colors" onClick={() => handleSort('status')}>
                Status <span className="inline-block ml-1 text-[10px] opacity-60">↕</span>
              </th>
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted cursor-pointer whitespace-nowrap hover:text-ink transition-colors" onClick={() => handleSort('assignedUser')}>
                Assigned To <span className="inline-block ml-1 text-[10px] opacity-60">↕</span>
              </th>
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted cursor-pointer whitespace-nowrap hover:text-ink transition-colors" onClick={() => handleSort('dueDate')}>
                Due Date <span className="inline-block ml-1 text-[10px] opacity-60">↕</span>
              </th>
              <th className="pb-4 pt-2 font-medium text-[13px] text-muted text-center whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id} className="border-b border-borderstrong/10 hover:bg-surface-soft transition-colors group">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-surface-strong flex items-center justify-center text-muted shrink-0 border border-borderstrong/20">
                      <CheckSquare size={18} />
                    </div>
                    <div
                      className={onView ? 'cursor-pointer' : ''}
                      onClick={() => onView && onView(task)}
                    >
                      <p className="font-normal text-[15px] text-ink tracking-tight leading-snug hover:text-link transition-colors">{task.title}</p>
                      {task.project && (
                        <p className="text-[12px] font-medium text-muted mt-0.5">{task.project.name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wide ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`text-[12px] font-medium px-2.5 py-1 rounded-sm ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {task.assignedUsers && task.assignedUsers.length > 0 ? (
                      <div className="flex -space-x-1.5">
                         {task.assignedUsers.slice(0, 3).map(u => (
                           <div key={u.id} className="w-7 h-7 rounded-pill bg-primary flex items-center justify-center text-[10px] font-medium text-white ring-2 ring-canvas" title={u.name}>
                             {u.name.charAt(0).toUpperCase()}
                           </div>
                         ))}
                         {task.assignedUsers.length > 3 && (
                           <div className="w-7 h-7 rounded-pill bg-surface-strong border border-borderstrong flex items-center justify-center text-[10px] font-medium text-ink ring-2 ring-canvas">
                             +{task.assignedUsers.length - 3}
                           </div>
                         )}
                      </div>
                    ) : (
                      <span className="text-[13px] font-medium text-muted italic">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <span className={`text-[13px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-signature-coral' : 'text-ink'}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {canManage ? (
                      <>
                        <button onClick={() => onEdit(task)} className="p-1.5 text-muted hover:text-ink hover:bg-surface-strong rounded-sm transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1.5 text-muted hover:text-signature-coral hover:bg-signature-coral/10 rounded-sm transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span className="text-borderstrong font-bold tracking-widest">...</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TaskTable;