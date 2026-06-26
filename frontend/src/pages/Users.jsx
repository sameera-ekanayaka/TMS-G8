import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
} from "../services/api";
import toast from "react-hot-toast";

export default function Users() {
  const { token, user: currentUser } = useAuth();

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

  // True when the target row is an admin AND is not the currently logged-in user.
  // Used to hide destructive actions — admins cannot act on peer admins.
  const isOtherAdmin = (u) => u.role === "ADMIN" && u.id !== currentUser?.id;

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

  async function handleDelete(id) {
    if (!window.confirm(
      "Permanently delete this user? This also deletes the tasks they created and their comments/attachments. This cannot be undone."
    )) return;
    try {
      await deleteUser(token, id);
      await fetchUsers();
      toast.success("User permanently deleted.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete user.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>

      <div className="flex items-center justify-between mb-6 pb-4 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
        <div>
          <h1 className="ed-page-title">Users</h1>
          <p className="ed-page-subtitle">Manage system users and roles</p>
        </div>
        <button onClick={openCreateModal} className="ed-btn ed-btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ed-input"
          style={{ flex: 1, minWidth: 200, maxWidth: 360, height: 40 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="ed-select"
          style={{ width: 'auto', minWidth: 160, height: 40 }}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="COLLABORATOR">Collaborator</option>
        </select>
      </div>

      {error && (
        <div
          className="text-sm rounded-md px-4 py-3 mb-4"
          style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
        >
          {error}
        </div>
      )}

      <div>
        {loading ? (
          <div className="ed-card-flat p-12 text-center" style={{ fontSize: 14, color: 'var(--color-muted)' }}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="ed-card-flat p-12 text-center" style={{ fontSize: 14, color: 'var(--color-muted)' }}>
            No users found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4"
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--rounded-md)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: user.isActive ? 1 : 0.7,
                }}
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
                  <div
                    className="w-11 h-11 shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--rounded-full)', fontSize: 16, fontWeight: 600 }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate" style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>
                      {user.name}
                    </h3>
                    <p className="truncate" style={{ fontSize: 13, color: 'var(--color-muted)' }} title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Middle: Badges */}
                <div className="flex items-center gap-2 w-full sm:w-1/3 sm:justify-center">
                  <RoleBadge role={user.role} />
                  <StatusBadge active={user.isActive} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-1/3 sm:justify-end shrink-0">
                  {!isOtherAdmin(user) && (
                    <button onClick={() => openEditModal(user)} className="ed-btn ed-btn-secondary ed-btn-sm">
                      Edit
                    </button>
                  )}
                  {user.isActive ? (
                    !isOtherAdmin(user) && (
                      <button onClick={() => handleDeactivate(user.id)} className="ed-btn ed-btn-danger ed-btn-sm">
                        Deactivate
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => handleActivate(user.id)}
                        className="ed-btn ed-btn-sm"
                        style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)', border: '1px solid var(--color-hairline-strong)' }}
                      >
                        Activate
                      </button>
                      {!isOtherAdmin(user) && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="ed-btn ed-btn-sm"
                          style={{ background: 'var(--color-danger)', color: '#fff', border: '1px solid var(--color-danger)' }}
                          title="Permanently delete this deactivated user"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                {editingUser ? "Edit User" : "Add User"}
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
                placeholder="Full name"
                className="ed-input"
              />
            </div>

            <div className="mb-4">
              <label className="ed-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                disabled={!!editingUser}
                className="ed-input"
                style={editingUser ? { background: 'var(--color-surface-soft)', color: 'var(--color-faint)' } : undefined}
              />
              {editingUser && (
                <p style={{ fontSize: 12, color: 'var(--color-faint)', marginTop: 4 }}>Email cannot be changed.</p>
              )}
            </div>

            <div className="mb-5">
              <label className="ed-label">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="ed-select"
              >
                <option value="COLLABORATOR">Collaborator</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
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
    ADMIN: { background: 'var(--color-surface-strong)', color: 'var(--color-ink)' },
    PROJECT_MANAGER: { background: 'var(--color-info-soft)', color: 'var(--color-info)' },
    COLLABORATOR: { background: 'var(--color-success-soft)', color: 'var(--color-success)' },
  };
  const labels = {
    ADMIN: "Admin",
    PROJECT_MANAGER: "Project Manager",
    COLLABORATOR: "Collaborator",
  };
  return (
    <span className="ed-badge" style={styles[role] || { background: 'var(--color-surface-strong)', color: 'var(--color-muted)' }}>
      {labels[role] || role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className="ed-badge"
      style={active
        ? { background: 'var(--color-success-soft)', color: 'var(--color-success)' }
        : { background: 'var(--color-surface-strong)', color: 'var(--color-muted)' }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}