import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io"),
});

// Auto-logout on an invalid/expired/deactivated session (401). Skip the auth
// endpoints that legitimately return 401 for credential errors (login, reset,
// forgot) so a wrong-password attempt doesn't kick the user out. A 401 from any
// other endpoint (incl. /auth/me) means the session is no longer valid.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isCredentialCall =
      url.includes("/auth/login") ||
      url.includes("/auth/reset-password") ||
      url.includes("/auth/forgot-password");
    if (status === 401 && !isCredentialCall && localStorage.getItem("tms_token")) {
      localStorage.removeItem("tms_token");
      localStorage.removeItem("tms_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getMe = (token) => api.get("/api/auth/me", authHeader(token));

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
export const activateUser = (token, id) => api.patch(`/api/users/${id}/activate`, {}, authHeader(token));

// ════════ TASK ENDPOINTS ════════════════════════════════════════════════════
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
export const getComments = (token, taskId) =>
  api.get(`/api/tasks/${taskId}/comments`, authHeader(token));

export const createComment = (token, taskId, content) =>
  api.post(
    `/api/tasks/${taskId}/comments`,
    { content },
    authHeader(token)
  );

export const updateComment = (token, commentId, content) =>
  api.put(`/api/tasks/comments/${commentId}`, { content }, authHeader(token));

export const deleteComment = (token, commentId) =>
  api.delete(`/api/tasks/comments/${commentId}`, authHeader(token));

// ════════ ATTACHMENT ENDPOINTS ══════════════════════════════════════════════
export const getAttachments = (token, taskId) =>
  api.get(`/api/tasks/${taskId}/attachments`, authHeader(token));

export const uploadAttachment = (token, taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  // Let axios/the browser set Content-Type with the correct multipart boundary —
  // hardcoding "multipart/form-data" strips the boundary and breaks parsing.
  return api.post(`/api/tasks/${taskId}/attachments`, formData, authHeader(token));
};

export const deleteAttachment = (token, attachmentId) =>
  api.delete(`/api/tasks/attachments/${attachmentId}`, authHeader(token));

// ════════ NOTIFICATION ENDPOINTS ════════════════════════════════════════════
export const getNotifications = (token) => api.get("/api/notifications", authHeader(token));
export const markNotificationRead = (token, id) => api.patch(`/api/notifications/${id}/read`, {}, authHeader(token));

export const markAllNotificationsRead = (token) =>
  api.patch("/api/notifications/read-all", {}, authHeader(token));

// ════════ PROJECT ENDPOINTS ════════════════════════════════════════════════
export const getProjects = (token) => api.get("/api/projects", authHeader(token));
export const createProject = (token, data) => api.post("/api/projects", data, authHeader(token));
export const updateProject = (token, id, data) => api.put(`/api/projects/${id}`, data, authHeader(token));
export const deleteProject = (token, id) => api.delete(`/api/projects/${id}`, authHeader(token));

export default api;