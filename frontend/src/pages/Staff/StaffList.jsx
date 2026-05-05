import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { assignStaff, getStaff, removeStaff } from "../../services/staffService";
import { getUsers, getUsersAvailableForEvent } from "../../services/userService";
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
    const [users, setUsers] = useState([]);         // tất cả users (cho bảng hiện tại)
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", user_id: "", role: "volunteer" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Danh sách users KHẢ DỤNG (lọc sẵn từ server) cho event đang chọn
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

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
        if (!window.confirm("Xác nhận xóa nhân sự khỏi sự kiện?")) return;
        try {
            await removeStaff(id);
            setStaff(staff.filter(s => s.id !== id));
        } catch { alert("Xóa thất bại"); }
    };

    // Khi chọn sự kiện → gọi API server để lấy danh sách users KHẢ DỤNG
    const handleEventChange = async (eventId) => {
        setFormData(prev => ({ ...prev, event_id: eventId, user_id: "" }));
        setAvailableUsers([]);
        if (!eventId) return;

        setLoadingAvailable(true);
        try {
            const res = await getUsersAvailableForEvent(eventId);
            setAvailableUsers(res.data || []);
        } catch (err) {
            console.error("[StaffAssign] Failed to load available users:", err);
            setAvailableUsers([]);
        } finally {
            setLoadingAvailable(false);
        }
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
            setFormData({ event_id: "", user_id: "", role: "volunteer" });
            setAvailableUsers([]);
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

    const hiddenCount = formData.event_id
        ? (users.length - availableUsers.length)
        : 0;

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
                    <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                ) : staff.length === 0 ? (
                    <div className="empty-state">
                        <span>👥</span>
                        <p>Chưa có nhân sự nào được phân công{canManage ? ". Nhấn \"+ Phân công nhân sự\" để bắt đầu!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>#</th>
                                <th>Thành viên</th>
                                <th>Sự kiện tham gia</th>
                                <th>Vai trò (Sự kiện)</th>
                                <th>Phòng ban</th>
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
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
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
                                        <td>
                                            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                                                {s.department_name || (matchedUser ? matchedUser.department_name : "—") || "—"}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    style={{ border: "1px solid #fee2e2", color: "#ef4444", borderRadius: 8, padding: "6px 10px" }}
                                                    onClick={() => handleDelete(s.id)}
                                                    title="Xóa khỏi sự kiện"
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

            <Modal title="Phân công nhân sự vào sự kiện" isOpen={isModalOpen} onClose={() => { setModalOpen(false); setError(""); setFormData({ event_id: "", user_id: "", role: "volunteer" }); setAvailableUsers([]); }}>
                <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* ── Chọn sự kiện ── */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Chọn sự kiện tiếp nhận</label>
                        <select
                            className="form-control"
                            value={formData.event_id}
                            onChange={e => handleEventChange(e.target.value)}
                            required
                        >
                            <option value="">-- Chọn sự kiện trong danh sách --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.start_date).toLocaleDateString("vi-VN")})</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Chọn nhân sự (lọc từ server) ── */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            Chọn nhân sự
                            {formData.event_id && !loadingAvailable && hiddenCount > 0 && (
                                <span style={{
                                    fontSize: 11, background: "#f0fdf4", color: "#16a34a",
                                    border: "1px solid #bbf7d0", borderRadius: 20,
                                    padding: "2px 8px", fontWeight: 600
                                }}>
                                    ✓ Đã ẩn {hiddenCount} người đã đăng ký tham gia
                                </span>
                            )}
                        </label>

                        {!formData.event_id ? (
                            /* Chưa chọn sự kiện */
                            <div style={{
                                padding: "16px", background: "#f8fafc", borderRadius: 10,
                                border: "2px dashed #cbd5e1", color: "#94a3b8",
                                fontSize: 13, textAlign: "center"
                            }}>
                                ☝️ Vui lòng chọn sự kiện trước để xem danh sách nhân sự khả dụng
                            </div>
                        ) : loadingAvailable ? (
                            /* Đang tải */
                            <div style={{
                                padding: "16px", background: "#eff6ff", borderRadius: 10,
                                border: "1px solid #bfdbfe", color: "#3b82f6",
                                fontSize: 13, textAlign: "center"
                            }}>
                                ⏳ Đang kiểm tra danh sách nhân sự khả dụng...
                            </div>
                        ) : availableUsers.length === 0 ? (
                            /* Không còn ai */
                            <div style={{
                                padding: "16px", background: "#fffbeb", borderRadius: 10,
                                border: "1px solid #fde68a", color: "#92400e",
                                fontSize: 13, textAlign: "center"
                            }}>
                                ⚠️ Tất cả nhân viên đã đăng ký tham gia hoặc được phân công cho sự kiện này
                            </div>
                        ) : (
                            /* Danh sách đã lọc */
                            <select
                                className="form-control"
                                value={formData.user_id}
                                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                required
                            >
                                <option value="">-- Chọn thành viên --</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} - {u.email} {u.department_name ? `(Phòng: ${u.department_name})` : `(${u.role})`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* ── Vai trò ── */}
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
                            disabled={submitting || availableUsers.length === 0 || !formData.event_id}
                        >
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận phân công"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
