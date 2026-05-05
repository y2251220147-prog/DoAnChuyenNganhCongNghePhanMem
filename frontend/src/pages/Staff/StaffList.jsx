import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getDepartments } from "../../services/departmentService";
import {
    getEventDepartments,
    assignDepartmentToEvent,
    removeEventDepartment,
    updateEventDepartment
} from "../../services/eventDepartmentService";
import "../../styles/global.css";

const ROLE_OPTIONS = [
    "Đảm nhiệm tổ chức",
    "Hỗ trợ kỹ thuật",
    "Truyền thông & Marketing",
    "Hậu cần",
    "An ninh",
    "Lễ tân & Tiếp khách",
    "Tài chính",
];

const STATUS_COLORS = {
    upcoming:   { bg: "#dbeafe", color: "#1d4ed8", label: "Sắp diễn ra" },
    ongoing:    { bg: "#dcfce7", color: "#15803d", label: "Đang diễn ra" },
    completed:  { bg: "#f3f4f6", color: "#6b7280", label: "Đã kết thúc" },
    cancelled:  { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
};

export default function StaffList() {
    const [assignments, setAssignments] = useState([]);
    const [events, setEvents]           = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading]         = useState(true);

    // Modal phân công
    const [modalOpen, setModalOpen]     = useState(false);
    const [editTarget, setEditTarget]   = useState(null);  // null = thêm mới
    const [form, setForm]               = useState({ event_id: "", department_id: "", role: "Đảm nhiệm tổ chức", note: "" });
    const [submitting, setSubmitting]   = useState(false);
    const [formError, setFormError]     = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // Bộ lọc
    const [filterEvent, setFilterEvent] = useState("");
    const [filterDept,  setFilterDept]  = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [aR, eR, dR] = await Promise.all([
                getEventDepartments(),
                getEvents(),
                getDepartments()
            ]);
            setAssignments(aR.data || []);
            setEvents(eR.data      || []);
            setDepartments(dR.data || []);
        } catch (err) {
            console.error("Load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openAdd = () => {
        setEditTarget(null);
        setForm({ event_id: "", department_id: "", role: "Đảm nhiệm tổ chức", note: "" });
        setFormError(""); setFormSuccess("");
        setModalOpen(true);
    };

    const openEdit = (a) => {
        setEditTarget(a);
        setForm({ event_id: a.event_id, department_id: a.department_id, role: a.role, note: a.note || "" });
        setFormError(""); setFormSuccess("");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(""); setFormSuccess(""); setSubmitting(true);
        try {
            if (editTarget) {
                const res = await updateEventDepartment(editTarget.id, { role: form.role, note: form.note });
                setFormSuccess(res.data.message);
            } else {
                const res = await assignDepartmentToEvent(form);
                setFormSuccess(res.data.message);
                setForm(prev => ({ ...prev, department_id: "", note: "" }));
            }
            loadData();
        } catch (err) {
            setFormError(err.response?.data?.message || "Thao tác thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (a) => {
        if (!window.confirm(`Hủy phân công phòng ban "${a.department_name}" khỏi sự kiện "${a.event_name}"?`)) return;
        try {
            await removeEventDepartment(a.id);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Xóa thất bại");
        }
    };

    // Lọc
    const filtered = assignments.filter(a => {
        if (filterEvent && String(a.event_id) !== filterEvent) return false;
        if (filterDept  && String(a.department_id) !== filterDept) return false;
        return true;
    });

    return (
        <Layout>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 className="gradient-text">🏢 Phân công Phòng ban</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Giao trách nhiệm tổ chức sự kiện cho từng phòng ban · {assignments.length} phân công
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={openAdd}
                        style={{ borderRadius: 12, padding: "10px 22px" }}>
                        🏢 + Phân công phòng ban
                    </button>
                )}
            </div>

            {/* Bộ lọc */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <select className="form-control" style={{ maxWidth: 240, height: 38, fontSize: 13 }}
                    value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                    <option value="">-- Lọc theo sự kiện --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <select className="form-control" style={{ maxWidth: 220, height: 38, fontSize: 13 }}
                    value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="">-- Lọc theo phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>🏢 {d.name}</option>)}
                </select>
                {(filterEvent || filterDept) && (
                    <button className="btn btn-outline btn-sm"
                        onClick={() => { setFilterEvent(""); setFilterDept(""); }}
                        style={{ height: 38, fontSize: 13 }}>✕ Xóa lọc</button>
                )}
            </div>

            {/* Bảng */}
            <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)", overflow: "hidden" }}>
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: 36 }}>🏢</span>
                        <p>{assignments.length === 0 ? "Chưa có phân công phòng ban nào." : "Không có kết quả phù hợp."}</p>
                        {canManage && assignments.length === 0 && (
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openAdd}>
                                Thêm phân công đầu tiên
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 20, width: 48 }}>#</th>
                                <th>Phòng ban</th>
                                <th>Sự kiện</th>
                                <th>Vai trò / Nhiệm vụ</th>
                                <th>Trưởng phòng</th>
                                <th style={{ textAlign: "center" }}>Nhân sự</th>
                                {canManage && <th style={{ textAlign: "right", paddingRight: 20 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a, i) => {
                                const st = STATUS_COLORS[a.event_status] || STATUS_COLORS.upcoming;
                                return (
                                    <tr key={a.id}>
                                        <td style={{ color: "var(--text-muted)", paddingLeft: 20 }}>{String(i + 1).padStart(2, "0")}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏢</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.department_name}</div>
                                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                        {new Date(a.assigned_at).toLocaleDateString("vi-VN")}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-primary)" }}>🎯 {a.event_name}</div>
                                                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: st.bg, color: st.color }}>
                                                    {st.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>{a.role}</div>
                                            {a.note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, maxWidth: 180 }}>{a.note}</div>}
                                        </td>
                                        <td>
                                            {a.manager_name ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(251,191,36,0.2)", color: "#d97706", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        {a.manager_name[0]?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.manager_name}</span>
                                                </div>
                                            ) : <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Chưa phân công</span>}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999, background: "rgba(99,102,241,0.1)", color: "#4338ca" }}>
                                                {a.employee_count} người
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 16 }}>
                                                <button className="btn btn-sm btn-outline"
                                                    onClick={() => openEdit(a)}
                                                    style={{ marginRight: 6 }}>✏️</button>
                                                <button className="btn btn-sm"
                                                    onClick={() => handleDelete(a)}
                                                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>🗑️</button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal phân công / sửa */}
            <Modal
                title={editTarget ? "✏️ Sửa phân công phòng ban" : "🏢 Phân công phòng ban vào sự kiện"}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setFormError(""); setFormSuccess(""); }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {formError   && <div className="alert alert-error">{formError}</div>}
                    {formSuccess && (
                        <div style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
                            ✅ {formSuccess}
                        </div>
                    )}

                    {/* Sự kiện — disabled khi edit */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Sự kiện tiếp nhận <span style={{ color: "#ef4444" }}>*</span></label>
                        <select className="form-control" value={form.event_id}
                            onChange={e => setForm({ ...form, event_id: e.target.value })}
                            required disabled={!!editTarget}>
                            <option value="">-- Chọn sự kiện --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    🎯 {ev.name} ({new Date(ev.start_date).toLocaleDateString("vi-VN")})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Phòng ban — disabled khi edit */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Phòng ban đảm nhiệm <span style={{ color: "#ef4444" }}>*</span></label>
                        <select className="form-control" value={form.department_id}
                            onChange={e => setForm({ ...form, department_id: e.target.value })}
                            required disabled={!!editTarget}>
                            <option value="">-- Chọn phòng ban --</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>
                                    🏢 {d.name}
                                    {d.manager_name ? ` — TP: ${d.manager_name}` : ""}
                                    {" "}({d.employee_count || 0} người)
                                </option>
                            ))}
                        </select>
                        {!editTarget && (
                            <small style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, display: "block" }}>
                                Phòng ban sẽ chịu trách nhiệm tổ chức sự kiện này
                            </small>
                        )}
                    </div>

                    {/* Vai trò */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Vai trò / Nhiệm vụ</label>
                        <select className="form-control" value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}>
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Ghi chú */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Ghi chú <span style={{ color: "var(--text-muted)", fontSize: 11 }}>(tuỳ chọn)</span></label>
                        <textarea className="form-control" rows={2}
                            placeholder="VD: Phụ trách setup phòng, âm thanh ánh sáng..."
                            value={form.note}
                            onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>

                    <div style={{ padding: "12px 0 0", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button type="button" className="btn btn-outline"
                            onClick={() => { if (formSuccess) { setModalOpen(false); } else { setModalOpen(false); } }}
                            style={{ borderRadius: 12, padding: "10px 22px" }}>
                            {formSuccess ? "Đóng" : "Hủy"}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}
                            style={{ borderRadius: 12, padding: "10px 26px" }}>
                            {submitting ? "Đang lưu..." : editTarget ? "Cập nhật" : "✅ Xác nhận phân công"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
