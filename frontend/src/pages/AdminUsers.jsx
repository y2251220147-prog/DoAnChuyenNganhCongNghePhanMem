/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import Modal from "../components/UI/Modal";
import { changeRole, createUser, getUsers } from "../services/userService";
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

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);

    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
    const [submitting, setSubmitting] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            setUsers(res.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleRoleChange = async (id, newRole) => {
        setUpdating(id);
        try {
            await changeRole(id, newRole);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch { /* empty */ }
        finally { setUpdating(null); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createUser(formData);
            setModalOpen(false);
            setFormData({ name: "", email: "", password: "", role: "user" });
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Create failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>User Management</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Manage user accounts and roles
                    </p>
                    <div className="badge badge-admin" style={{ padding: "6px 14px", fontSize: "12px", marginTop: "8px", display: "inline-block" }}>
                        🔧 Admin Only
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    + Add User
                </button>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading users...</p></div>
                ) : users.length === 0 ? (
                    <div className="empty-state"><span>👥</span><p>No users found</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Current Role</th>
                                <th>Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{
                                                width: "34px", height: "34px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                                                color: "white", fontWeight: 700, fontSize: "13px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                {getInitials(u.name)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                                    <td>
                                        <span className={ROLE_BADGE[u.role] || "badge badge-default"}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={updating === u.id}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: "8px",
                                                border: "1.5px solid var(--border-color)",
                                                fontSize: "13px",
                                                fontFamily: "Inter, sans-serif",
                                                cursor: "pointer",
                                                background: "white",
                                                color: "var(--text-primary)",
                                                outline: "none",
                                            }}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        {updating === u.id && (
                                            <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                Saving...
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="Create New User" isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            className="form-control"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select
                            className="form-control"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={submitting}
                    >
                        {submitting ? "Creating..." : "Create User"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}