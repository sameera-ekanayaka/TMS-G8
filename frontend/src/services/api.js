import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ════════ AUTH ENDPOINTS ════════════════════════════════════════════════════
export const loginUser = (email, password) =>
  api.post("/api/auth/login", { email, password });

export const resetPassword = (authToken, tempPassword, newPassword) =>
  api.post(
    "/api/auth/reset-password",
    { tempPassword, newPassword },
    authHeader(authToken)
  );

// ════════ USER ENDPOINTS ════════════════════════════════════════════════════
export const getUsers = (token) => api.get("/api/users", authHeader(token));
export const createUser = (token, data) => api.post("/api/users", data, authHeader(token));
export const updateUser = (token, id, data) => api.put(`/api/users/${id}`, data, authHeader(token));
export const deactivateUser = (token, id) => api.patch(`/api/users/${id}/deactivate`, {}, authHeader(token));

// ════════ TASK ENDPOINTS ════════════════════════════════════════════════════
// getTasks now supports optional query params: status, priority, sortBy, order
export const getTasks = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.order) params.append("order", filters.order);
  
  const queryString = params.toString();
  const url = queryString ? `/api/tasks?${queryString}` : "/api/tasks";
  return api.get(url, authHeader(token));
};

export const createTask = (token, data) => api.post("/api/tasks", data, authHeader(token));
export const updateTask = (token, id, data) => api.put(`/api/tasks/${id}`, data, authHeader(token));
export const deleteTask = (token, id) => api.delete(`/api/tasks/${id}`, authHeader(token));
export const assignTask = (token, taskId, userId) => api.post(`/api/tasks/${taskId}/assign`, { userId }, authHeader(token));
export const updateTaskStatus = (token, taskId, status) => api.put(`/api/tasks/${taskId}/status`, { status }, authHeader(token));

// ════════ COMMENT ENDPOINTS ════════════════════════════════════════════════
// Get all comments for a task
export const getComments = (token, taskId) =>
  api.get(`/api/tasks/${taskId}/comments`, authHeader(token));

// Create a new comment on a task
export const createComment = (token, taskId, content) =>
  api.post(
    `/api/tasks/${taskId}/comments`,
    { content },
    authHeader(token)
  );

// ════════ ATTACHMENT ENDPOINTS ══════════════════════════════════════════════
// Get all attachments for a task
export const getAttachments = (token, taskId) =>
  api.get(`/api/tasks/${taskId}/attachments`, authHeader(token));

// Upload a file attachment to a task (sends FormData)
export const uploadAttachment = (token, taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  return api.post(
    `/api/tasks/${taskId}/attachments`,
    formData,
    {
      ...authHeader(token),
      headers: {
        ...authHeader(token).headers,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// ════════ NOTIFICATION ENDPOINTS ════════════════════════════════════════════
export const getNotifications = (token) => api.get("/api/notifications", authHeader(token));
export const markNotificationRead = (token, id) => api.patch(`/api/notifications/${id}/read`, {}, authHeader(token));

// Mark all notifications as read
export const markAllNotificationsRead = (token) =>
  api.patch("/api/notifications/read-all", {}, authHeader(token));

export default api;