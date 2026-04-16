import api from "./api";
export { api };

// Phases
export const getPhases = (eid) => api.get(`/tasks/phases/event/${eid}`);
export const createPhase = (d) => api.post("/tasks/phases", d);
export const updatePhase = (id, d) => api.put(`/tasks/phases/${id}`, d);
export const deletePhase = (id) => api.delete(`/tasks/phases/${id}`);

// Tasks
export const getTasksByEvent = (eid) => api.get(`/tasks/event/${eid}`);
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const getTaskStats = (eid) => api.get(`/tasks/stats/${eid}`);
export const createTask = (d) => api.post("/tasks", d);
export const updateTask = (id, d) => api.put(`/tasks/${id}`, d);
export const updateTaskStatus = (id, s) => api.patch(`/tasks/${id}/status`, { status: s });
export const updateTaskProgress = (id, p) => api.patch(`/tasks/${id}/progress`, { progress: p });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Comments
export const getComments = (tid) => api.get(`/tasks/${tid}/comments`);
export const addComment = (tid, content) => api.post(`/tasks/${tid}/comments`, { content });
export const deleteComment = (tid, cid) => api.delete(`/tasks/${tid}/comments/${cid}`);

// History
export const getHistory = (tid) => api.get(`/tasks/${tid}/history`);
