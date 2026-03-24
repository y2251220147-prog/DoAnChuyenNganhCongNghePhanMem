import api from "./api";
export const getAllAttendees = () => api.get("/attendees");
export const getAttendeesByEvent = (eid) => api.get(`/attendees/event/${eid}`);
export const getAttendeeStats = (eid) => api.get(`/attendees/stats/${eid}`);
export const checkRegistration = (eid) => api.get(`/attendees/check/${eid}`);
export const selfRegister = (eid) => api.post(`/attendees/register/${eid}`);
export const addExternal = (d) => api.post("/attendees/external", d);
export const removeAttendee = (id) => api.delete(`/attendees/${id}`);
