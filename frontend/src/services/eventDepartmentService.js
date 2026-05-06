import api from "./api";

export const getEventDepartments = () => api.get("/event-departments");
export const getEventDepartmentsByEvent = (eventId) => api.get(`/event-departments/event/${eventId}`);
export const assignDepartmentToEvent = (data) => api.post("/event-departments", data);
export const updateEventDepartment = (id, data) => api.put(`/event-departments/${id}`, data);
export const removeEventDepartment = (id) => api.delete(`/event-departments/${id}`);
