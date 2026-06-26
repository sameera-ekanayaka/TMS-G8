import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { getUsers, getProjects } from '../../services/api';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';

const roleLabels = { ADMIN: 'Admin', PROJECT_MANAGER: 'Project Manager', COLLABORATOR: 'Collaborator' };

const TaskForm = ({ task, onClose, onSuccess, initialStatus }) => {
  const { addTask, editTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUserIds: [],
    dueDate: '',
    priority: 'Medium',
    status: initialStatus || 'To Do',
    projectId: '',
  });

  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch in parallel so the assignee list isn't gated behind projects.
        const [usersRes, projRes] = await Promise.all([
          getUsers(token),
          getProjects(token),
        ]);
        setUsers(usersRes.data.users || []);
        setProjects(projRes.data?.projects || []);
      } catch (error) {
        console.error('Failed to load users/projects:', error);
      }
    };
    fetchData();

    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedUserIds: task.assignedUserIds || [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        projectId: task.projectId || '',
      });
    }
  }, [task, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssigneeToggle = (userId) => {
    setFormData(prev => {
      const currentIds = prev.assignedUserIds || [];
      if (currentIds.includes(userId)) {
        return { ...prev, assignedUserIds: currentIds.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedUserIds: [...currentIds, userId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // A task must belong to a project (mirrors the backend rule).
    if (!formData.projectId) {
      toast.error("Please select a project for this task.");
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      };

      if (task) {
        await editTask(task.id, data);
        toast.success("Task updated successfully!");
      } else {
        await addTask(data);
        toast.success("Task created successfully!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(24,29,38,0.45)' }}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto ed-scroll"
        style={{ background: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div
          className="flex justify-between items-center px-5 py-4 sticky top-0 z-10"
          style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)' }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-ink)' }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--color-faint)' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="ed-label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="ed-input"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="ed-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="ed-textarea"
                placeholder="Enter task description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="ed-label">Assign to</label>
              <input
                type="text"
                placeholder="Search assignees…"
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                className="ed-input"
                style={{ height: 36, marginBottom: 8 }}
              />
              <div
                className="w-full px-3 py-2 max-h-32 overflow-y-auto space-y-1 ed-scroll"
                style={{ border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--rounded-sm)', background: 'var(--color-surface-soft)' }}
              >
                {users
                  .filter(u => u.role !== 'ADMIN')
                  .filter(u => {
                    const q = assigneeSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                  })
                  .map(user => (
                  <label key={user.id} className="ed-notif flex items-center gap-2 cursor-pointer p-1.5" style={{ borderRadius: 'var(--rounded-sm)' }}>
                    <input
                      type="checkbox"
                      checked={(formData.assignedUserIds || []).includes(user.id)}
                      onChange={() => handleAssigneeToggle(user.id)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--color-body)' }}>
                      {user.name} <span style={{ color: 'var(--color-faint)', fontSize: 12 }}>({roleLabels[user.role] || user.role})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="ed-label">Project *</label>
              <select name="projectId" value={formData.projectId} onChange={handleChange} className="ed-select" required>
                <option value="" disabled>Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {projects.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                  No projects yet — create a project first.
                </p>
              )}
            </div>

            <div>
              <label className="ed-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="ed-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="ed-label">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="ed-select">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="ed-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="ed-select">
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 col-span-1 md:col-span-2" style={{ borderTop: '1px solid var(--color-hairline)' }}>
            <button type="submit" disabled={loading} className="ed-btn ed-btn-primary" style={{ flex: 1 }}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="ed-btn ed-btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;