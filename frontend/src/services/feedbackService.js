import api from "./api";

export const getFeedback = () => api.get("/feedback");
export const getFeedbackByEvent = (eventId) => api.get(`/feedback/event/${eventId}`);
export const submitFeedback = (data) => api.post("/feedback", data);
export const deleteFeedback = (id) => api.delete(`/feedback/${id}`);
