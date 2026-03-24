import api from "./api";

export const getStaff = () => api.get("/staff");
export const assignStaff = (data) => api.post("/staff", data);
export const removeStaff = (id) => api.delete(`/staff/${id}`);
