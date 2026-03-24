import { useEffect, useState } from "react";
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
                    <h2>User Management</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {users.length} user{users.length !== 1 ? "s" : ""} registered
                    </p>
                    <span className="badge badge-admin" style={{ marginTop: 8, display: "inline-block" }}>🔧 Admin Only</span>
                </div>
                <button className="btn btn-primary" onClick={() => { setFormError(""); setModalOpen(true); }}>
                    + Add User
                </button>
            </div>

            <div style={{ marginBottom: 16 }}>
                <input
                    className="form-control"
                    placeholder="🔍 Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                />
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading users...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><span>👥</span><p>No users found</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>User</th><th>Email</th><th>Joined</th><th>Current Role</th><th>Change Role</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#06b6d4)", color: "white", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {getInitials(u.name)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                                    </td>
                                    <td><span className={ROLE_BADGE[u.role] || "badge badge-default"}>{u.role}</span></td>
                                    <td>
                                        <select
                                            value={u.role}
                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                            disabled={updating === u.id}
                                            className="form-control"
                                            style={{ width: 130, padding: "6px 10px", fontSize: 13 }}
                                        >
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        {updating === u.id && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>Saving…</span>}
                                    </td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)} title="Delete user">🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="Create New User" isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleCreate}>
                    {formError && <div className="alert alert-error">{formError}</div>}
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="Min. 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} disabled={submitting}>
                        {submitting ? "Creating..." : "Create User"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
