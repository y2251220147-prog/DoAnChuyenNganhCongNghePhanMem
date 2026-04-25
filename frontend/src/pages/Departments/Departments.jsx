import { useState, useEffect } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentUsers, setDepartmentUsers } from '../../services/departmentService';
import api from '../../services/api';
import Layout from '../../components/Layout/Layout';
import './Departments.css';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);

    // Modal state
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

    const [editingDept, setEditingDept] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const [selectedDept, setSelectedDept] = useState(null);
    const [deptUsers, setDeptUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const data = await getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await api.get('/users');
            setAllUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch all users", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchAllUsers();
    }, []);

    const handleOpenDeptModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({ name: dept.name, description: dept.description || '' });
        } else {
            setEditingDept(null);
            setFormData({ name: '', description: '' });
        }
        setIsDeptModalOpen(true);
    };

    const handleSaveDept = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await updateDepartment(editingDept.id, formData);
            } else {
                await createDepartment(formData);
            }
            setIsDeptModalOpen(false);
            fetchDepartments();
        } catch (error) {
            alert("Lỗi khi lưu phòng ban");
        }
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa phòng ban này?")) return;
        try {
            await deleteDepartment(id);
            fetchDepartments();
        } catch (error) {
            alert("Lỗi khi xóa phòng ban");
        }
    };

    const handleOpenUsersModal = async (dept) => {
        setSelectedDept(dept);
        setIsUsersModalOpen(true);
        try {
            const users = await getDepartmentUsers(dept.id);
            setDeptUsers(users);
            setSelectedUserIds(users.map(u => u.id));
        } catch (error) {
            console.error("Failed to fetch department users", error);
        }
    };

    const handleSaveUsers = async () => {
        try {
            await setDepartmentUsers(selectedDept.id, selectedUserIds);
            alert("Cập nhật nhân sự thành công!");
            setIsUsersModalOpen(false);
            fetchAllUsers(); // Refresh the user list to update department_id states
        } catch (error) {
            alert("Lỗi khi cập nhật nhân sự");
        }
    };

    const toggleUserSelection = (userId) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    return (
        <Layout>
            <div className="departments-page">
                <div className="page-header">
                    <h2>Quản lý phòng ban</h2>
                    <button className="btn btn-primary" onClick={() => handleOpenDeptModal()}>
                        + Thêm phòng ban
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : (
                    <div className="departments-grid">
                        {departments.map(dept => (
                            <div key={dept.id} className="department-card">
                                <h3>{dept.name}</h3>
                                <p>{dept.description || 'Chưa có mô tả'}</p>
                                <div className="card-actions">
                                    <button className="btn btn-sm" onClick={() => handleOpenUsersModal(dept)}>
                                        👥 Quản lý nhân sự
                                    </button>
                                    <button className="btn btn-sm btn-outline" onClick={() => handleOpenDeptModal(dept)}>Sửa</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDept(dept.id)}>Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Thêm/Sửa Phòng Ban */}
            {isDeptModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingDept ? "Sửa phòng ban" : "Thêm phòng ban"}</h3>
                        <form onSubmit={handleSaveDept}>
                            <div className="form-group">
                                <label>Tên phòng ban</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                ></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setIsDeptModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Quản Lý Nhân Sự */}
            {isUsersModalOpen && selectedDept && (
                <div className="modal-overlay">
                    <div className="modal-content users-modal">
                        <h3>Nhân sự: {selectedDept.name}</h3>
                        
                        <div className="users-section">
                            <h4>Thành viên hiện tại</h4>
                            <div className="users-list">
                                {allUsers.filter(u => selectedUserIds.includes(u.id)).length === 0 ? (
                                    <p style={{ color: '#888', padding: '10px' }}>Chưa có nhân sự nào</p>
                                ) : (
                                    allUsers.filter(u => selectedUserIds.includes(u.id)).map(user => (
                                        <label key={user.id} className="user-item">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                            <div className="user-info">
                                                <strong>{user.name}</strong>
                                                <span>{user.email} - {user.role}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="users-section" style={{ marginTop: '20px' }}>
                            <h4>Thêm nhân sự mới (những người chưa có phòng ban)</h4>
                            <div className="users-list">
                                {allUsers.filter(u => !selectedUserIds.includes(u.id) && (u.department_id === null || u.department_id === selectedDept.id)).length === 0 ? (
                                    <p style={{ color: '#888', padding: '10px' }}>Không có nhân sự nào trống</p>
                                ) : (
                                    allUsers.filter(u => !selectedUserIds.includes(u.id) && (u.department_id === null || u.department_id === selectedDept.id)).map(user => (
                                        <label key={user.id} className="user-item">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                            <div className="user-info">
                                                <strong>{user.name}</strong>
                                                <span>{user.email} - {user.role}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setIsUsersModalOpen(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleSaveUsers}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
