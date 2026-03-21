import api from "./api";

export const register = (data) => {
    return api.post("auth/register", data);
};

export const login = (data) => {
    return api.post("auth/login", data);
};

export const verifyToken = () => {
    return api.get("auth/verify");
};

export const resetPassword = (data) => {
    return api.put("auth/reset-password", data);
};