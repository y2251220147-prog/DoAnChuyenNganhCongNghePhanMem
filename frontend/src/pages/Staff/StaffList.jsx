import { useContext, useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { assignStaff, getStaff, removeStaff } from "../../services/staffService";
import { getUsers } from "../../services/userService";
import { getDepartments } from "../../services/departmentService";
import "../../styles/global.css";

const ROLE_BADGE = {
    manager: "badge badge-admin",
    marketing: "badge badge-warning",
    technical: "badge badge-organizer",
    support: "badge badge-user",
    volunteer: "badge badge-default",
};

export default function StaffList() {
    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", user_id: "", role: "volunteer" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [filterEventId, setFilterEventId] = useState("all");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [staffRes, usersRes, eventsRes, deptRes] = await Promise.all([
                getStaff(), getUsers(), getEvents(), getDepartments()
            ]);
            setStaff(staffRes.data || []);
            setUsers(usersRes.data || []);
            setEvents(eventsRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error("Failed to load staff data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id) => {
        if (!window.confirm("Loại bỏ nhân sự này khỏi dự án?")) return;
        try {
            await removeStaff(id);
            setStaff(prev => prev.filter(s => s.id !== id));
        } catch { alert("Thao tác thất bại"); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.event_id) return setError("Vui lòng chọn sự kiện.");
        if (!formData.user_id) return setError("Vui lòng chọn nhân sự.");
        setSubmitting(true);
        try {
            await assignStaff(formData);
            setModalOpen(false);
            setFormData(prev => ({ ...prev, user_id: "", role: "volunteer" }));
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Phân công thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const getEventName = (eventId) => {
        const ev = events.find(e => e.id === eventId);
        return ev ? ev.name : `Sự kiện #${eventId}`;
    };

    // Lọc staff theo sự kiện
    const filteredStaff = filterEventId === "all" 
        ? staff 
        : staff.filter(s => String(s.event_id) === String(filterEventId));

    // Group staff by department
    const staffByDept = departments.map(dept => {
        const members = filteredStaff.filter(s => {
            const matchedUser = users.find(u => u.id === s.user_id);
            return matchedUser && matchedUser.department_id === dept.id;
        });
        return { ...dept, members };
    });

    // Staff không thuộc phòng ban nào
    const unassignedStaff = filteredStaff.filter(s => {
        const matchedUser = users.find(u => u.id === s.user_id);
        return !matchedUser || !matchedUser.department_id;
    });

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">👥 Nhân sự Sự kiện (Theo Phòng ban)</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Quản lý phân công nhân sự theo từng bộ phận chuyên môn cho các dự án
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <select 
                        className="form-control" 
                        value={filterEventId} 
                        onChange={e => setFilterEventId(e.target.value)}
                        style={{ width: 220, borderRadius: 12 }}
                    >
                        <option value="all">Tất cả sự kiện</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                    {canManage && (
                        <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ borderRadius: 12, padding: "10px 24px" }}>
                            + Phân công nhân sự
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải dữ liệu nhân sự...</p></div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))", gap: 24 }}>
                    {staffByDept.filter(d => d.members.length > 0).map(dept => (
                        <div key={dept.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "16px 24px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>🏢 {dept.name}</h3>
                                <span className="badge badge-primary">{dept.members.length} thành viên</span>
                            </div>
                            <div style={{ padding: 0 }}>
                                <table className="data-table" style={{ margin: 0, border: "none" }}>
                                    <thead>
                                        <tr style={{ background: "transparent" }}>
                                            <th style={{ paddingLeft: 24, fontSize: 11 }}>Thành viên</th>
                                            <th style={{ fontSize: 11 }}>Sự kiện</th>
                                            <th style={{ fontSize: 11 }}>Vai trò</th>
                                            {canManage && <th style={{ textAlign: "right", paddingRight: 24, fontSize: 11 }}></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dept.members.map(s => {
                                            const matchedUser = users.find(u => u.id === s.user_id);
                                            return (
                                                <tr key={s.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                                    <td style={{ paddingLeft: 24 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>
                                                                {(s.user_name || (matchedUser ? matchedUser.name : "U"))[0].toUpperCase()}
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.user_name || matchedUser?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{getEventName(s.event_id)}</span>
                                                    </td>
                                                    <td>
                                                        <span className={ROLE_BADGE[s.role] || "badge badge-default"} style={{ fontSize: 10, padding: "2px 8px" }}>
                                                            {s.role?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    {canManage && (
                                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                            <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>🗑</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {unassignedStaff.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "16px 24px", background: "#fff5f5", borderBottom: "1px solid #fee2e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e53e3e" }}>❓ Chưa phân phòng ban</h3>
                                <span className="badge" style={{ background: "#e53e3e", color: "white" }}>{unassignedStaff.length} thành viên</span>
                            </div>
                            <div style={{ padding: 0 }}>
                                <table className="data-table" style={{ margin: 0, border: "none" }}>
                                    <tbody>
                                        {unassignedStaff.map(s => {
                                            const matchedUser = users.find(u => u.id === s.user_id);
                                            return (
                                                <tr key={s.id}>
                                                    <td style={{ paddingLeft: 24 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#cbd5e1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>
                                                                {(s.user_name || (matchedUser ? matchedUser.name : "U"))[0].toUpperCase()}
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.user_name || matchedUser?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td><span style={{ fontSize: 12 }}>{getEventName(s.event_id)}</span></td>
                                                    <td><span className={ROLE_BADGE[s.role] || "badge badge-default"} style={{ fontSize: 10 }}>{s.role?.toUpperCase()}</span></td>
                                                    {canManage && (
                                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                            <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>🗑</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {staff.length === 0 && !loading && (
                <div className="empty-state">
                    <span>👥</span>
                    <p>Chưa có nhân sự nào được phân công{canManage ? ". Hãy nhấn nút Phân công ngay!" : "."}</p>
                </div>
            )}

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
                            <option value="">-- Chọn sự kiện --</option>
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
                            <option value="">-- Chọn thành viên --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} - {u.department_name || "Chưa có phòng ban"}</option>
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
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận phân công"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
