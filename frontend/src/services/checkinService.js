import api from "./api";

export const checkin = (qr_code, event_id) => api.post("/checkin", { qr_code, event_id });
export const getStats = (eventId) => api.get(`/checkin/stats/${eventId}`);
export const getCheckinList = (eventId) => api.get(`/checkin/list/${eventId}`);
