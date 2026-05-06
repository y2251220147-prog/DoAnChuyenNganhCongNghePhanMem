import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";
import Modal from "../components/UI/Modal";
import { changeRole, createUser, deleteUser, getUsers } from "../services/userService";
import "../styles/global.css";

const ROLES = ["user", "organizer", "admin"];
const ROLE_BADGE = {
    admin: "badge badge-admin",
    organizer: "badge badge-organizer",
    user: "badge badge-user",
};

function getInitials(name = "") {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function AdminUsers() {
    const { getAvatarUrl } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [formError, setFormError] = useState("");

    const loadUsers = async () => {
        setLoading(true);
        try { const res = await getUsers(); setUsers(res.data || []); }
        catch {/***/ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleRoleChange = async (id, newRole) => {
        setUpdating(id);
        try {
            await changeRole(id, newRole);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch {/***/ }
        finally { setUpdating(null); }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setFormError(""); setSubmitting(true);
        try {
            await createUser(formData);
            setModalOpen(false);
            setFormData({ name: "", email: "", password: "", role: "user" });
            loadUsers();
        } catch (err) { setFormError(err.response?.data?.message || "Create failed"); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try { await deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
        catch (err) { alert(err.response?.data?.message || "Delete failed"); }
    };

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">👤 Quản trị thành viên</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Quản lý quyền hạn và thông tin của {users.length} người dùng trong hệ thống.
                    </p>
                    <span className="badge badge-admin" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
                         🛡️ Tài khoản quản trị hệ thống
                    </span>
                </div>
                <button className="btn btn-primary" onClick={() => { setFormError(""); setModalOpen(true); }} style={{ borderRadius: 12, padding: "10px 24px" }}>
                    + Thêm thành viên mới
                </button>
            </div>

            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                <input
                    className="form-control"
                    placeholder="🔍 Tìm kiếm theo tên hoặc email thành viên..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 400, borderRadius: 12 }}
                />
            </div>

            <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tải danh sách...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><span>👥</span><p>Không tìm thấy thành viên nào</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>Thành viên</th>
                                <th>Địa chỉ Email</th>
                                <th>Ngày tham gia</th>
                                <th>Vai trò</th>
                                <th>Điều chỉnh quyền</th>
                                <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td style={{ paddingLeft: 24 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                            <div style={{ 
                                                width: 44, height: 44, borderRadius: "50%", 
                                                background: "var(--color-primary)", 
                                                color: "white", fontWeight: 700, fontSize: 14, 
                                                display: "flex", alignItems: "center", justifyContent: "center", 
                                                flexShrink: 0, overflow: "hidden",
                                                border: "2px solid #fff",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                            }}>
                                                {u.avatar ? (
                                                    <img src={getAvatarUrl(u.avatar)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : getInitials(u.name)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{u.name}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>ID: #{u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{u.email}</td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                        📅 {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                                    </td>
                                    <td><span className={ROLE_BADGE[u.role] || "badge badge-default"} style={{ border: "none", padding: "6px 12px", borderRadius: 8 }}>{u.role?.toUpperCase()}</span></td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                                disabled={updating === u.id}
                                                className="form-control"
                                                style={{ width: 140, padding: "8px 12px", fontSize: 13, borderRadius: 10, border: "1px solid #e2e8f0" }}
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            {updating === u.id && <span className="loader-sm" style={{ width: 16, height: 16 }}></span>}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right", paddingRight: 24 }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(u.id, u.name)} title="Xóa tài khoản" style={{ color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 8 }}>🗑 Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="✨ Tạo tài khoản thành viên" isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {formError && <div className="alert alert-error">{formError}</div>}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Họ và tên thành viên</label>
                        <input className="form-control" placeholder="VD: Nguyễn Văn A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Địa chỉ Email</label>
                        <input type="email" className="form-control" placeholder="example@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Mật khẩu đăng nhập</label>
                        <input type="password" className="form-control" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Phân quyền hệ thống</label>
                        <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="user">Người dùng (User)</option>
                            <option value="organizer">Người tổ chức (Organizer)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                    </div>
                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} style={{ borderRadius: 12, padding: "10px 24px" }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 32px" }} disabled={submitting}>
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận tạo tài khoản"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
