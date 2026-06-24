import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} from "../services/api";
import toast from "react-hot-toast";

export default function Users() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "COLLABORATOR",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await getUsers(token);
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function openCreateModal() {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "COLLABORATOR" });
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "COLLABORATOR" });
    setFormError("");
  }

  function validateForm() {
    if (!formData.name || !formData.email || !formData.role) {
      setFormError("All fields are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address.");
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
      if (editingUser) {
        await updateUser(token, editingUser.id, formData);
        await fetchUsers();
        closeModal();
        toast.success("User updated successfully!");
      } else {
        const response = await createUser(token, formData);
        const createdPassword = response.data.tempPassword;
        await fetchUsers();
        closeModal();
        toast.success(
          <span>User created!<br/>Temp Password: <b>{createdPassword}</b></span>,
          { duration: 8000 }
        );
      }
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong.";
      setFormError(message);
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await deactivateUser(token, id);
      await fetchUsers();
      toast.success("User deactivated.");
    } catch (err) {
      setError("Failed to deactivate user.");
      toast.error("Failed to deactivate user.");
    }
  }

  async function handleActivate(id) {
    if (!window.confirm("Are you sure you want to activate this user?")) return;
    try {
      await activateUser(token, id);
      await fetchUsers();
      toast.success("User activated.");
    } catch (err) {
      setError("Failed to activate user.");
      toast.error("Failed to activate user.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users and roles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="COLLABORATOR">Collaborator</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div>
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
                
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-4 w-full sm:w-1/3">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-lg font-bold text-indigo-700 shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base tracking-tight truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Middle: Badges */}
                <div className="flex items-center gap-3 w-full sm:w-1/3 sm:justify-center">
                  <RoleBadge role={user.role} />
                  <StatusBadge active={user.isActive} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end shrink-0">
                  <button
                    onClick={() => openEditModal(user)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors duration-150"
                  >
                    Edit
                  </button>
                  {user.isActive ? (
                    <button
                      onClick={() => handleDeactivate(user.id)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-100 transition-colors duration-150"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(user.id)}
                      className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl border border-green-100 transition-colors duration-150"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-gray-900">
                {editingUser ? "Edit User" : "Add User"}
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
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                disabled={!!editingUser}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
              {editingUser && (
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="COLLABORATOR">Collaborator</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
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
                {formLoading ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    ADMIN: "bg-purple-100 text-purple-700",
    PROJECT_MANAGER: "bg-blue-100 text-blue-700",
    COLLABORATOR: "bg-green-100 text-green-700",
  };
  const labels = {
    ADMIN: "Admin",
    PROJECT_MANAGER: "Project Manager",
    COLLABORATOR: "Collaborator",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[role] || "bg-gray-100 text-gray-600"}`}>
      {labels[role] || role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}