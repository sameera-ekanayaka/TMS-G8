import React, { useState } from 'react';
import { MoreVertical, Check, Eye, Edit2, Trash2, Folder, MessageSquare, Calendar, Paperclip } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TaskCard = ({ task, onEdit, onView, canManage = true, currentUserId }) => {
  const { changeTaskStatus, removeTask } = useTasks();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);

  const isMyTask = currentUserId
    ? (task.assignedUsers || []).some((u) => u.id === currentUserId)
    : false;
  const isCollaborator = user?.role === 'COLLABORATOR';

  const priorityBadgeClass = (priority) => {
    const map = { High: 'ed-badge-high', Medium: 'ed-badge-medium', Low: 'ed-badge-low' };
    return `ed-badge ${map[priority] || 'ed-badge-low'}`;
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const handleStatusChange = async (status) => {
    if (isCollaborator && !isMyTask) {
      showToast("You can only change the status of tasks assigned to you.", "warning");
      setShowMenu(false);
      return;
    }
    await changeTaskStatus(task.id, status);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await removeTask(task.id);
    }
  };

  const assignees = task.assignedUsers || [];

  return (
    <div
      className="rounded-md p-4 shadow-sm hover:shadow-md transition-all duration-200 relative group border border-hairline"
      style={{
        background: 'var(--color-canvas)',
        borderLeft: isMyTask ? '4px solid var(--color-primary)' : undefined,
      }}
    >
      <div
        className={`flex flex-col h-full ${onView ? 'cursor-pointer' : ''}`}
        onClick={() => onView && onView()}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={priorityBadgeClass(task.priority)}>
              {task.priority}
            </span>
            {isMyTask && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: 'var(--rounded-full)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                My Task
              </span>
            )}
          </div>
          
          {/* Actions Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted hover:text-ink p-1 rounded-sm hover:bg-surface-strong transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-canvas rounded-md shadow-md border border-borderstrong/40 z-10 overflow-hidden">
                <div className="p-2 border-b border-borderstrong/20">
                  <p className="text-[10px] font-medium text-muted px-2 py-1 uppercase tracking-wider">Move To</p>
                  {['To Do', 'In Progress', 'Completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface-strong rounded-sm flex items-center gap-2 text-ink"
                    >
                      {task.status === status && <Check size={14} className="text-success" />}
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
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface-strong rounded-sm flex items-center gap-2 text-ink"
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
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface-strong rounded-sm flex items-center gap-2 text-ink"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                        className="w-full text-left px-3 py-2 text-[13px] text-signature-coral hover:bg-signature-coral/10 rounded-sm flex items-center gap-2"
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

        <h4 className="font-normal text-[16px] text-ink leading-snug mb-2 line-clamp-2">{task.title}</h4>
        
        {task.description && (
          <p className="text-[13px] text-muted line-clamp-2 mb-4 leading-relaxed font-normal">
            {task.description}
          </p>
        )}
        
        {task.project && (
           <p className="text-[12px] font-medium text-muted flex items-center gap-1.5 mb-4">
              <Folder size={12} className="text-borderstrong" />
              {task.project.name}
           </p>
        )}

        <div className="mt-auto pt-4 border-t border-borderstrong/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Assignee Avatars */}
             <div className="flex -space-x-1.5">
               {assignees.length > 0 ? (
                 assignees.slice(0, 3).map((user, i) => (
                   <div key={user.id} className="w-6 h-6 rounded-pill bg-primary flex items-center justify-center text-[10px] font-medium text-on-primary ring-2 ring-canvas" title={user.name}>
                     {user.name.charAt(0).toUpperCase()}
                   </div>
                 ))
               ) : (
                 <div className="w-6 h-6 rounded-pill bg-surface-strong border border-borderstrong flex items-center justify-center text-[10px] font-medium text-muted ring-2 ring-canvas" title="Unassigned">
                   ?
                 </div>
               )}
               {assignees.length > 3 && (
                 <div className="w-6 h-6 rounded-pill bg-surface-strong border border-borderstrong flex items-center justify-center text-[10px] font-medium text-ink ring-2 ring-canvas">
                   +{assignees.length - 3}
                 </div>
               )}
             </div>

             <div className="flex items-center gap-1 text-[11px] font-medium text-muted" title="Comments">
               <MessageSquare size={12} />
               <span>{task._count?.comments ?? task.comments?.length ?? 0}</span>
             </div>

             <div className="flex items-center gap-1 text-[11px] font-medium text-muted" title="Attachments">
               <Paperclip size={12} />
               <span>{task._count?.attachments ?? 0}</span>
             </div>
          </div>
          
          <div className={`flex items-center gap-1 text-[11px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-signature-coral' : 'text-muted'}`}>
            <Calendar size={12} />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;