import api from "./api";
export const getOverview = () => api.get("/reports/overview");
export const getEventsByMonth = (y) => api.get(`/reports/events-by-month?year=${y || ''}`);
export const getAttendeeReport = () => api.get("/reports/attendees");
export const getBudgetReport = () => api.get("/reports/budget");
export const getTaskStats = () => api.get("/reports/tasks");
export const getEventsByType = () => api.get("/reports/events-by-type");
