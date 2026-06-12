import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const loginUser = (email, password) =>
  api.post("/api/auth/login", { email, password });

export const resetPassword = (authToken, tempPassword, newPassword) =>
  api.post(
    "/api/auth/reset-password",
    { tempPassword, newPassword },
    authHeader(authToken)
  );

export const getUsers = (token) => api.get("/api/users", authHeader(token));
export const createUser = (token, data) => api.post("/api/users", data, authHeader(token));
export const updateUser = (token, id, data) => api.put(`/api/users/${id}`, data, authHeader(token));
export const deactivateUser = (token, id) => api.patch(`/api/users/${id}/deactivate`, {}, authHeader(token));

export const getTasks = (token) => api.get("/api/tasks", authHeader(token));
export const createTask = (token, data) => api.post("/api/tasks", data, authHeader(token));
export const updateTask = (token, id, data) => api.put(`/api/tasks/${id}`, data, authHeader(token));
export const deleteTask = (token, id) => api.delete(`/api/tasks/${id}`, authHeader(token));
export const assignTask = (token, taskId, userId) => api.post(`/api/tasks/${taskId}/assign`, { userId }, authHeader(token));

export const getNotifications = (token) => api.get("/api/notifications", authHeader(token));
export const markNotificationRead = (token, id) => api.patch(`/api/notifications/${id}/read`, {}, authHeader(token));

export default api;
