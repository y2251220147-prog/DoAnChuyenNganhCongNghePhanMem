import api from "./api";

export const getUsers = () => {
    return api.get("/users");
};

export const changeRole = (id, role) => {
    return api.put(`/users/${id}/role`, { role });
};

export const getProfile = () => {
    return api.get("/profile");
};

export const updateProfile = (data) => {
    return api.put("/profile", data);
};

export const createUser = (data) => {
    return api.post("/users", data);
};

export const updateUser = (id, data) => {
    return api.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
    return api.delete(`/users/${id}`);
};