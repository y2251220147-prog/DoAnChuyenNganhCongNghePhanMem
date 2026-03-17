import api from "./api";

export const getUsers = () => {
    return api.get("/users");
};

export const changeRole = (id, role) => {
    return api.put(`/users/${id}/role`, { role });
};