import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getUsers,
} from "../services/api";

export default function Projects() {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const canManage = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTaskStatusChanged = () => {
      fetchProjects();
    };

    socket.on("task_status_changed", handleTaskStatusChanged);

    return () => {
      socket.off("task_status_changed", handleTaskStatusChanged);
    };
  }, [socket]);

  async function fetchUsers() {
    try {
      const response = await getUsers(token);
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }

  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const response = await getProjects(token);
      setProjects(response.data?.projects || []);
    } catch (err) {
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const projectManagers = users.filter((u) => u.role === "PROJECT_MANAGER" && u.isActive);

  function openCreateModal() {
    setEditingProject(null);
    setFormData({ name: "", description: "", managerId: "" });
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(project) {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      managerId: project.managerId || "",
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProject(null);
    setFormData({ name: "", description: "", managerId: "" });
    setFormError("");
  }

  function validateForm() {
    if (!formData.name) {
      setFormError("Project name is required.");
      return false;
    }
    setFormError("");
    return true;
  }

  async function handleFormSubmit() {
    if (!validateForm()) return;

    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        managerId: formData.managerId ? parseInt(formData.managerId, 10) : null,
      };

      if (editingProject) {
        await updateProject(token, editingProject.id, payload);
      } else {
        await createProject(token, payload);
      }
      await fetchProjects();
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong.";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this project? This will remove the project association from all its tasks.")) return;
    try {
      await deleteProject(token, id);
      await fetchProjects();
    } catch (err) {
      setError("Failed to delete project.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
        <div>
          <h1 className="ed-page-title">Projects</h1>
          <p className="ed-page-subtitle">Manage your team's projects and workflows</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="ed-btn ed-btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ed-input"
          style={{ maxWidth: 360, height: 40 }}
        />
      </div>

      {error && (
        <div
          className="text-[14px] rounded-md px-4 py-3 mb-6 font-medium"
          style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-[14px] text-muted">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[14px] text-muted">
            No projects found.
          </div>
        ) : (
          filteredProjects.map((project, idx) => {
            // Light mode: pastel signature surface with dark ink. Dark mode:
            // standard dark canvas card with hairline border — readable + cohesive.
            const surfaces = [
              'bg-signature-cream dark:bg-canvas',
              'bg-signature-mint dark:bg-canvas',
              'bg-signature-peach dark:bg-canvas',
              'bg-signature-yellow dark:bg-canvas',
              'bg-[#e8eaed] dark:bg-canvas'
            ];

            const gIndex = idx % surfaces.length;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                className={`relative ${surfaces[gIndex]} text-ink border border-transparent dark:border-hairline rounded-lg p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`bg-primary text-on-primary text-[12px] font-medium px-3 py-1 rounded-pill`}>
                    Project
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                        className="p-1.5 bg-canvas border border-borderstrong text-ink hover:bg-surface-strong rounded-md transition-all"
                        title="Edit Project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="p-1.5 bg-canvas border border-borderstrong text-ink hover:bg-signature-coral hover:text-white hover:border-signature-coral rounded-md transition-all"
                        title="Delete Project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <h3 className="text-[24px] font-normal leading-[1.2] mb-3">
                    {project.name}
                  </h3>
                  <p className="text-[14px] font-normal opacity-80 line-clamp-3 leading-relaxed">
                    {project.description || "No description provided for this project."}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    {project.manager ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-medium text-on-primary">
                          {project.manager.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium">{project.manager.name}</span>
                          <span className="text-[11px] font-medium opacity-70">Manager</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[12px] font-medium">
                          ?
                        </div>
                        <span className="text-[13px] font-medium italic opacity-70">Unassigned</span>
                      </>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary group-hover:bg-primary-active transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(24,29,38,0.45)' }}>
          <div
            className="w-full max-w-md p-6"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-ink)' }}>
                {editingProject ? "Edit Project" : "Add Project"}
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--color-faint)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="ed-label">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
                className="ed-input"
              />
            </div>

            <div className="mb-4">
              <label className="ed-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description"
                rows="3"
                className="ed-textarea"
              />
            </div>

            <div className="mb-5">
              <label className="ed-label">Project Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="ed-select"
              >
                <option value="">Unassigned</option>
                {projectManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <div
                className="text-xs rounded-md px-3 py-2 mb-4"
                style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
              >
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeModal} className="ed-btn ed-btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleFormSubmit} disabled={formLoading} className="ed-btn ed-btn-primary" style={{ flex: 1 }}>
                {formLoading ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
