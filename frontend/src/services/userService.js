import api from "./api";

export const getUsers = () => {
    return api.get("/users");
};

export const createUser = (data) => {
    return api.post("/users", data);
};

export const changeRole = (id, role) => {
    return api.put(`/users/${id}/role`, { role });
};