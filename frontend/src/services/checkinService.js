import api from "./api";

export const checkin = (qr_code) => api.post("/checkin", { qr_code });
