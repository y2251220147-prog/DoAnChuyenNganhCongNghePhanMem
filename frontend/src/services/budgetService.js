import api from "./api";

export const getBudget = () => api.get("/budgets");
export const createBudget = (data) => api.post("/budgets", data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
