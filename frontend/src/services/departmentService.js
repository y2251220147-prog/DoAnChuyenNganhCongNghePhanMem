import api from "./api";

export const getDepartments = () => api.get("/departments");
export const getDepartmentById = (id) => api.get(`/departments/${id}`);
export const getEligibleManagers = () => api.get("/departments/eligible-managers");
export const createDepartment = (data) => api.post("/departments", data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// Employee management
export const getDepartmentEmployees = (id) => api.get(`/departments/${id}/employees`);
export const getAvailableUsers = (id) => api.get(`/departments/${id}/available-users`);
export const addEmployeeToDept = (deptId, userId) => api.post(`/departments/${deptId}/employees`, { user_id: userId });
export const removeEmployeeFromDept = (deptId, userId) => api.delete(`/departments/${deptId}/employees/${userId}`);
export const updateEmployeeRole = (deptId, userId, role_in_dept) => api.patch(`/departments/${deptId}/employees/${userId}`, { role_in_dept });
