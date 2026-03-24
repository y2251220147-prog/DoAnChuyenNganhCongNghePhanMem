import api from "./api";
export const getNotifications = () => api.get("/notifications");
export const getUnreadCount = () => api.get("/notifications/count");
export const markRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch("/notifications/read-all");
export const deleteNotif = (id) => api.delete(`/notifications/${id}`);
