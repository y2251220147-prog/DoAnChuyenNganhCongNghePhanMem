import api from "./api";

export const getGuests = () => api.get("/guests");
export const getGuestsByEvent = (eventId) => api.get(`/guests/event/${eventId}`);
export const createGuest = (data) => api.post("/guests", data);
export const deleteGuest = (id) => api.delete(`/guests/${id}`);
