import api from "./api";

export const getTimeline = () => api.get("/timeline");
export const createTimeline = (data) => api.post("/timeline", data);
export const deleteTimeline = (id) => api.delete(`/timeline/${id}`);
