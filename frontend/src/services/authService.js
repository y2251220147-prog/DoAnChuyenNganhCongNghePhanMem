import api from "./api";

export const register = (data) => {
    return api.post("/auth/register", data);
};

export const login = (data) => {
    return api.post("auth/login", data);
};

export const verifyToken = () => {
    return api.get("/verify");
};

export const resetPassword = (data) => {
    return api.put("/reset-password", data);
};