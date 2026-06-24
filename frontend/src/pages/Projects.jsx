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

  const projectManagers = users.filter((u) => u.role === "PROJECT_MANAGER");

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
    <div className="min-h-screen bg-surface-soft p-6 font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-borderstrong/30">
        <div>
          <h1 className="text-[28px] font-normal text-ink tracking-tight">Projects</h1>
          <p className="text-[14px] text-muted mt-1 font-medium">Manage your team's editorial workflows</p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary-active text-white text-[14px] font-medium px-5 py-2.5 rounded-pill transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-borderstrong rounded-md px-4 py-3 text-[14px] text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-link focus:border-link transition-colors"
        />
      </div>

      {error && (
        <div className="bg-surface-soft border border-signature-coral text-signature-coral text-[14px] rounded-md px-4 py-3 mb-6 font-medium">
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
            const surfaces = [
              'bg-signature-cream text-ink',
              'bg-signature-mint text-ink',
              'bg-signature-peach text-ink',
              'bg-signature-yellow text-ink',
              'bg-surface-strong text-ink'
            ];
            
            const gIndex = idx % surfaces.length;
            
            return (
              <div 
                key={project.id}
                onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                className={`relative ${surfaces[gIndex]} rounded-lg p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`bg-primary text-white text-[12px] font-medium px-3 py-1 rounded-pill`}>
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

                <div className="pt-4 border-t border-primary/10 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    {project.manager ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-medium text-white">
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
                  
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white group-hover:bg-primary-active transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-gray-900">
                {editingProject ? "Edit Project" : "Add Project"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description"
                rows="3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-4">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg py-2 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {formLoading ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
