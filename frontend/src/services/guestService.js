import api from "./api";

export const getGuests = () => api.get("/guests");
export const getGuestsByEvent = (eventId) => api.get(`/guests/event/${eventId}`);
export const createGuest = (data) => api.post("/guests", data);
export const deleteGuest = (id) => api.delete(`/guests/${id}`);
export const bulkInvite = (data) => api.post("/guests/bulk-invite", data);

// Tra cứu vé khách mời theo email (public — dùng cho GuestPublicPortal)
export const lookupGuestByEmail = (email) => api.get(`/guests/lookup?email=${encodeURIComponent(email)}`);
