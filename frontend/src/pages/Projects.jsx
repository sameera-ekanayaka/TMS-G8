import { useState, useEffect } from "react";
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
  const canManage = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage projects and their details</p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            No projects found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Manager</th>
                {canManage && <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.map((project) => {
                const isExpanded = expandedProject === project.id;
                const colSpan = canManage ? 4 : 3;
                return (
                  <>
                    <tr
                      key={project.id}
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer select-none"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{project.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{project.description || "No description"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {project.manager ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{project.manager.name}</span>
                            <span className="text-xs text-gray-400">{project.manager.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {isExpanded && (
                      <tr key={`${project.id}-tasks`}>
                        <td colSpan={colSpan} className="bg-indigo-50 px-4 py-3">
                          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                            Tasks in this project ({project.tasks?.length || 0})
                          </p>
                          {!project.tasks || project.tasks.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No tasks assigned to this project yet.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-gray-500 border-b border-indigo-100">
                                  <th className="text-left py-1 font-medium">Title</th>
                                  <th className="text-left py-1 font-medium">Assignee</th>
                                  <th className="text-left py-1 font-medium">Status</th>
                                  <th className="text-left py-1 font-medium">Due Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-100">
                                {project.tasks.map((t) => {
                                  const statusColors = { TODO: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700', COMPLETED: 'bg-green-100 text-green-700' };
                                  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
                                  return (
                                    <tr key={t.id}>
                                      <td className="py-1.5 pr-4 font-medium text-gray-800">{t.title}</td>
                                      <td className="py-1.5 pr-4 text-xs text-gray-500">
                                        {t.assignments?.[0]?.user?.name || 'Unassigned'}
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-600'}`}>
                                          {statusLabels[t.status] || t.status}
                                        </span>
                                      </td>
                                      <td className="py-1.5 text-gray-500 text-xs">
                                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
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
