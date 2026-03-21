import api from "./api";

export const getGuests = () => api.get("/guests");
export const createGuest = (data) => api.post("/guests", data);
export const deleteGuest = (id) => api.delete(`/guests/${id}`);
