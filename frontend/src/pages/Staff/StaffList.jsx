import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { assignStaff, getStaff, removeStaff } from "../../services/staffService";
import { getUsers } from "../../services/userService";
import "../../styles/global.css";

const ROLE_BADGE = {
    manager: "badge badge-admin",
    marketing: "badge badge-warning",
    technical: "badge badge-organizer",
    support: "badge badge-user",
    volunteer: "badge badge-default",
};

export default function StaffList() {

    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", user_id: "", role: "volunteer" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffRes, usersRes, eventsRes] = await Promise.all([
                getStaff(), getUsers(), getEvents()
            ]);
            setStaff(staffRes.data || []);
            setUsers(usersRes.data || []);
            setEvents(eventsRes.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this staff member?")) return;
        try {
            await removeStaff(id);
            setStaff(staff.filter(s => s.id !== id));
        } catch { alert("Remove failed"); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.event_id) return setError("Please select an event.");
        if (!formData.user_id) return setError("Please select a user.");
        setSubmitting(true);
        try {
            await assignStaff(formData);
            setModalOpen(false);
            setFormData(prev => ({ ...prev, user_id: "", role: "volunteer" }));
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Assignment failed");
        } finally {
            setSubmitting(false);
        }
    };

    const getEventName = (eventId) => {
        const ev = events.find(e => e.id === eventId);
        return ev ? ev.name : `Event #${eventId}`;
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">👥 Nhân sự sự kiện</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Quản lý và phân công đội ngũ nhân sự cho các dự án {staff.length > 0 && `(${staff.length} thành viên)`}
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ borderRadius: 12, padding: "10px 24px" }}>
                        + Phân công nhân sự
                    </button>
                )}
            </div>

            <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading staff...</p></div>
                ) : staff.length === 0 ? (
                    <div className="empty-state">
                        <span>👥</span>
                        <p>No staff assigned yet{canManage ? ". Assign staff above!" : "."}</p>
                    </div>
                ) : (
                        <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>#</th>
                                <th>Thành viên</th>
                                <th>Sự kiện tham gia</th>
                                <th>Vai trò</th>
                                {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s, i) => {
                                const matchedUser = users.find(u => u.id === s.user_id);
                                return (
                                    <tr key={s.id}>
                                        <td style={{ color: "var(--text-muted)", paddingLeft: 24 }}>{String(i + 1).padStart(2, '0')}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyCenter: "center", fontWeight: 700, fontSize: 13, justifyContent: "center" }}>
                                                    {(s.user_name || (matchedUser ? matchedUser.name : "U"))[0].toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                                    {s.user_name || (matchedUser ? matchedUser.name : `Cán bộ #${s.user_id}`)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                                🏢 {getEventName(s.event_id)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={ROLE_BADGE[s.role] || "badge badge-default"} style={{ border: "none", padding: "6px 12px", borderRadius: 8 }}>
                                                {s.role?.toUpperCase() || "—"}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    style={{ border: "1px solid #fee2e2", color: "#ef4444", borderRadius: 8, padding: "6px 10px" }}
                                                    onClick={() => handleDelete(s.id)}
                                                    title="Xóa khỏi dự án"
                                                >
                                                    🗑
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="Phân công nhân sự vào sự kiện" isOpen={isModalOpen} onClose={() => { setModalOpen(false); setError(""); }}>
                <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Chọn sự kiện tiếp nhận</label>
                        <select
                            className="form-control"
                            value={formData.event_id}
                            onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                            required
                        >
                            <option value="">-- Chọn sự kiện trong danh sách --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.start_date).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Chọn nhân sự</label>
                        <select
                            className="form-control"
                            value={formData.user_id}
                            onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                            required
                        >
                            <option value="">-- Chọn thành viên từ danh sách nhân viên --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} - {u.email} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Vai trò đảm nhiệm</label>
                        <select
                            className="form-control"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="manager">Quản lý (Manager)</option>
                            <option value="marketing">Tiếp thị (Marketing)</option>
                            <option value="technical">Kỹ thuật (Technical)</option>
                            <option value="support">Hỗ trợ (Support)</option>
                            <option value="volunteer">Tình nguyện viên (Volunteer)</option>
                        </select>
                    </div>
                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} style={{ borderRadius: 12, padding: "10px 24px" }}>Hủy</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ borderRadius: 12, padding: "10px 32px" }}
                            disabled={submitting}
                        >
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận phân công"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
