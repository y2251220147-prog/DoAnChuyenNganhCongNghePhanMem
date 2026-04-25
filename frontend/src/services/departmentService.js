import api from './api';

export const getDepartments = async () => {
    const response = await api.get('/departments');
    return response.data;
};

export const getDepartmentById = async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
};

export const createDepartment = async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
};

export const updateDepartment = async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
};

export const getDepartmentUsers = async (id) => {
    const response = await api.get(`/departments/${id}/users`);
    return response.data;
};

export const setDepartmentUsers = async (id, userIds) => {
    const response = await api.post(`/departments/${id}/users`, { userIds });
    return response.data;
};
