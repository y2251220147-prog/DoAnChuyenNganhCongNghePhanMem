import api from "./api";

export const getEvents = () => api.get("/events");

export const createEvent = (data) => api.post("/events", data);

export const updateEvent = (id, data) =>
    api.put(`/events/${id}`, data);

export const joinEvent = (data) => api.post(`/events/join`, data);

export const deleteEvent = (id) =>
    api.delete(`/events/${id}`);