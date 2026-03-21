import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import {
    getUsers,
    changeRole,
    createUser,
    updateUser,
    deleteUser
} from "../services/userService";

export default function AdminUsers() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user"
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch (err) {
            showMessage(err.response?.data?.message || "Lỗi tải danh sách", "error");
        }
    };

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "user" });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(editingUser.id, {
                    name: formData.name,
                    email: formData.email
                });
                if (formData.role !== editingUser.role) {
                    await changeRole(editingUser.id, formData.role);
                }
                showMessage("Cập nhật user thành công!");
            } else {
                await createUser(formData);
                showMessage("Thêm user thành công!");
            }
            setShowModal(false);
            loadUsers();
        } catch (err) {
            showMessage(err.response?.data?.message || "Có lỗi xảy ra", "error");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUser(confirmDelete.id);
            showMessage("Xoá user thành công!");
            setConfirmDelete(null);
            loadUsers();
        } catch (err) {
            showMessage(err.response?.data?.message || "Có lỗi xảy ra", "error");
        }
    };

    const handleRoleChange = async (id, role) => {
        try {
            await changeRole(id, role);
            showMessage("Cập nhật quyền thành công!");
            loadUsers();
        } catch (err) {
            showMessage(err.response?.data?.message || "Có lỗi xảy ra", "error");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <h2 className="page-title">Quản lý người dùng</h2>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="table-container">

                <div className="table-header">
                    <h3>Danh sách Users ({filteredUsers.length})</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                            className="search-input"
                            placeholder="🔍 Tìm kiếm user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={openAddModal}>
                            ➕ Thêm User
                        </button>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <p>Không có user nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <select
                                            className="form-control"
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            style={{
                                                width: "auto",
                                                padding: "4px 30px 4px 10px",
                                                fontSize: "12px",
                                                display: "inline-block"
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="organizer">Organizer</option>
                                            <option value="user">User</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => openEditModal(u)}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setConfirmDelete(u)}
                                            >
                                                🗑️ Xoá
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingUser ? "✏️ Sửa User" : "➕ Thêm User Mới"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Tên</label>
                                <input
                                    className="form-control"
                                    placeholder="Nhập tên"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Nhập email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            {!editingUser && (
                                <div className="form-group">
                                    <label>Mật khẩu</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Nhập mật khẩu"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Vai trò</label>
                                <select
                                    className="form-control"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="organizer">Organizer</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Huỷ
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? "Cập nhật" : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>⚠️ Xác nhận xoá</h3>
                        <p className="confirm-text">
                            Bạn có chắc chắn muốn xoá user <strong>{confirmDelete.name}</strong> ({confirmDelete.email})?
                        </p>
                        <p className="confirm-text" style={{ fontSize: "13px", color: "#64748b" }}>
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>
                                Huỷ
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                🗑️ Xoá
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Layout>

    );

}