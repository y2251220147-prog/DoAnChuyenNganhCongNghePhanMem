import api from "./api";

export const getUsers = () => api.get("/users");
export const createUser = (data) => api.post("/users", data);
export const changeRole = (id, role) => api.put(`/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/users/${id}`);

// --- Profile actions ---
export const getProfile = () => api.get("/users/profile");
export const updateProfile = (data) => api.put("/users/profile", data);
