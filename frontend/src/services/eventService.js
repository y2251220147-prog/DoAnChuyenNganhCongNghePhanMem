import api from "./api";

export const getEvents = () => api.get("/events");
export const getAvailableEvents = () => api.get("/events/user/available");
export const getRegisteredEvents = () => api.get("/events/user/registered");
export const getEventById = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post("/events", data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Workflow — chuyển trạng thái
export const changeStatus = (id, status) => api.patch(`/events/${id}/status`, { status });

// Deadlines nội bộ
export const getDeadlines = (id) => api.get(`/events/${id}/deadlines`);
export const createDeadline = (id, data) => api.post(`/events/${id}/deadlines`, data);
export const toggleDeadline = (id, dlId, done) => api.patch(`/events/${id}/deadlines/${dlId}`, { done });
export const deleteDeadline = (id, dlId) => api.delete(`/events/${id}/deadlines/${dlId}`);
