import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getUsers } from "../../services/userService";
import { getStaff, assignStaff, removeStaff } from "../../services/staffService";
import "../../styles/global.css";

const ROLE_OPTIONS = [
    { value: "manager", label: "Quản lý (Manager)" },
    { value: "marketing", label: "Marketing" },
    { value: "technical", label: "Kỹ thuật (Technical)" },
    { value: "support", label: "Hỗ trợ (Support)" },
    { value: "volunteer", label: "Tình nguyện viên (Volunteer)" },
];

const STATUS_COLORS = {
    upcoming:   { bg: "#dbeafe", color: "#1d4ed8", label: "Sắp diễn ra" },
    ongoing:    { bg: "#dcfce7", color: "#15803d", label: "Đang diễn ra" },
    completed:  { bg: "#f3f4f6", color: "#6b7280", label: "Đã kết thúc" },
    cancelled:  { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
};

export default function StaffList() {
    const [staffList, setStaffList] = useState([]);
    const [events, setEvents]       = useState([]);
    const [allUsers, setAllUsers]   = useState([]);
    const [loading, setLoading]     = useState(true);

    // Modal phân công
    const [modalOpen, setModalOpen]     = useState(false);
    const [form, setForm]               = useState({ event_id: "", user_id: "", role: "support" });
    const [submitting, setSubmitting]   = useState(false);
    const [formError, setFormError]     = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // Bộ lọc
    const [filterEvent, setFilterEvent] = useState("");
    const [filterUser,  setFilterUser]  = useState("");

    const { user: currentUser } = useContext(AuthContext);
    const canManage = currentUser?.role === "admin" || currentUser?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [sR, eR, uR] = await Promise.all([
                getStaff(),
                getEvents(),
                getUsers()
            ]);
            setStaffList(sR.data || []);
            setEvents(eR.data    || []);
            setAllUsers(uR.data  || []);
        } catch (err) {
            console.error("Load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openAdd = () => {
        setForm({ event_id: "", user_id: "", role: "support" });
        setFormError(""); setFormSuccess("");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(""); setFormSuccess(""); setSubmitting(true);
        try {
            const res = await assignStaff(form);
            setFormSuccess(res.data.message || "Đã thêm nhân sự thành công!");
            setForm(prev => ({ ...prev, user_id: "" }));
            loadData();
        } catch (err) {
            setFormError(err.response?.data?.message || "Thao tác thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (s) => {
        if (!window.confirm(`Xóa nhân viên "${s.user_name}" khỏi ban tổ chức sự kiện "${s.event_name}"?`)) return;
        try {
            await removeStaff(s.id);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Xóa thất bại");
        }
    };

    // Lọc
    const filtered = staffList.filter(s => {
        if (filterEvent && String(s.event_id) !== filterEvent) return false;
        if (filterUser  && !s.user_name.toLowerCase().includes(filterUser.toLowerCase())) return false;
        return true;
    });

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 className="gradient-text">👥 Nhân sự tổ chức</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Quản lý danh sách nhân viên tham gia thực hiện các sự kiện · {staffList.length} nhân sự
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={openAdd}
                        style={{ borderRadius: 12, padding: "10px 22px" }}>
                        👤 + Thêm nhân sự
                    </button>
                )}
            </div>

            {/* Filters Row */}
            <div style={{
                display: "flex", gap: 12, marginBottom: 24, padding: "16px 20px",
                background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)",
                alignItems: "center", flexWrap: "wrap", boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
            }}>
                <select className="form-control" style={{ minWidth: 240, height: 42, borderRadius: 10 }}
                    value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                    <option value="">📅 Tất cả sự kiện</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
                    <input className="form-control" placeholder="Tìm theo tên nhân sự..."
                        value={filterUser} onChange={e => setFilterUser(e.target.value)} 
                        style={{ width: "100%", height: 42, paddingLeft: 38, borderRadius: 10 }} />
                </div>
                {(filterEvent || filterUser) && (
                    <button className="btn btn-sm btn-ghost"
                        onClick={() => { setFilterEvent(""); setFilterUser(""); }}
                        style={{ height: 42, color: "#dc2626", fontWeight: 700 }}>✕ XÓA LỌC</button>
                )}
            </div>

            {/* Main Table Section */}
            <div style={{ 
                background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)", 
                overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" 
            }}>
                {loading ? (
                    <div className="empty-state" style={{ padding: "80px 0" }}><span>⏳</span><p>Đang tải dữ liệu...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state" style={{ padding: "80px 0" }}>
                        <span style={{ fontSize: 48, marginBottom: 16 }}>👤</span>
                        <p style={{ fontWeight: 600 }}>{staffList.length === 0 ? "Chưa có nhân sự nào được phân công." : "Không có kết quả phù hợp."}</p>
                        {canManage && staffList.length === 0 && (
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openAdd}>
                                + Thêm nhân sự đầu tiên
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24, width: 60 }}>#</th>
                                <th>Nhân sự</th>
                                <th>Sự kiện tiếp nhận</th>
                                <th>Vai trò tổ chức</th>
                                <th>Phòng ban gốc</th>
                                {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => {
                                const st = STATUS_COLORS[s.event_status] || STATUS_COLORS.upcoming;
                                const roleInfo = ROLE_OPTIONS.find(r => r.value === s.role) || { label: s.role };
                                return (
                                    <tr key={s.id} className="table-row-hover">
                                        <td style={{ color: "var(--text-muted)", paddingLeft: 24, fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ 
                                                    width: 40, height: 40, borderRadius: 12, 
                                                    background: "linear-gradient(135deg, #6366f1, #a855f7)", 
                                                    color: "white", display: "flex", alignItems: "center", 
                                                    justifyContent: "center", fontWeight: 800, fontSize: 15,
                                                    boxShadow: "0 4px 10px rgba(99,102,241,0.2)"
                                                }}>
                                                    {s.user_name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{s.user_name}</div>
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-primary)" }}>🎯 {s.event_name}</div>
                                                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: st.bg, color: st.color, textTransform: "uppercase", marginTop: 4, display: "inline-block" }}>
                                                    {st.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ 
                                                fontSize: 12, fontWeight: 700, color: "#4f46e5", 
                                                background: "#f5f3ff", padding: "4px 12px", 
                                                borderRadius: 10, display: "inline-block", border: "1px solid #e0e7ff"
                                            }}>
                                                {roleInfo.label}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                                                🏢 {s.department_name || "Vãng lai"}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.role_in_dept || "Thành viên"}</div>
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 20 }}>
                                                <button className="btn btn-sm btn-ghost"
                                                    onClick={() => handleDelete(s)}
                                                    style={{ padding: 8, borderRadius: 10, color: "#dc2626" }}
                                                    title="Xóa nhân sự">
                                                    🗑️
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

            {/* Modal Add Staff */}
            <Modal
                title="👤 Thêm nhân sự vào sự kiện"
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setFormError(""); setFormSuccess(""); }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {formError   && <div className="alert alert-error">{formError}</div>}
                    {formSuccess && (
                        <div style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
                            ✅ {formSuccess}
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Chọn sự kiện <span style={{ color: "#ef4444" }}>*</span></label>
                        <select className="form-control" value={form.event_id}
                            onChange={e => setForm({ ...form, event_id: e.target.value })}
                            required>
                            <option value="">-- Chọn sự kiện --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    🎯 {ev.name} ({new Date(ev.start_date).toLocaleDateString("vi-VN")})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Chọn nhân viên <span style={{ color: "#ef4444" }}>*</span></label>
                        <select className="form-control" value={form.user_id}
                            onChange={e => setForm({ ...form, user_id: e.target.value })}
                            required>
                            <option value="">-- Chọn nhân viên --</option>
                            {allUsers
                                .filter(u => u.role === 'user') // Chỉ hiện role user (nhân viên)
                                .map(u => (
                                    <option key={u.id} value={u.id}>
                                        👤 {u.name} ({u.email}) — 🏢 {u.department_name || "Chưa có PB"}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Vai trò trong ban tổ chức</label>
                        <select className="form-control" value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}>
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div style={{ padding: "12px 0 0", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button type="button" className="btn btn-outline"
                            onClick={() => setModalOpen(false)}
                            style={{ borderRadius: 12, padding: "10px 22px" }}>
                            {formSuccess ? "Đóng" : "Hủy"}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}
                            style={{ borderRadius: 12, padding: "10px 26px" }}>
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận thêm"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
