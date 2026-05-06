import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent } from "../../services/taskService";
import { changeStatus } from "../../services/eventService";
import { getAllUsers } from "../../services/userService";
import "../../styles/global.css";
import TaskBoard from "../Tasks/TaskBoard";

const STATUS_CFG = {
    draft: { label: "Bản nháp", bg: "#f1f5f9", color: "#64748b" },
    planning: { label: "Lên kế hoạch", bg: "#fef3c7", color: "#d97706" },
    approved: { label: "Đã duyệt", bg: "#ede9fe", color: "#7c3aed" },
    running: { label: "Đang diễn ra", bg: "#d1fae5", color: "#059669" },
    completed: { label: "Hoàn thành", bg: "#dbeafe", color: "#2563eb" },
    cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#dc2626" },
};

const TASK_STATUS_CFG = {
    todo: { label: "Chuẩn bị", color: "#94a3b8" },
    in_progress: { label: "Đang làm", color: "#f59e0b" },
    done: { label: "Hoàn thành", color: "#10b981" },
};

const WORKFLOW_NEXT = {
    draft: ["planning", "cancelled"],
    planning: ["approved", "cancelled"],
    approved: ["running", "cancelled"],
    running: ["completed", "cancelled"],
    completed: [], cancelled: [],
};

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
    return (
        <span style={{
            display: "inline-flex", padding: "4px 14px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color
        }}>
            {cfg.label}
        </span>
    );
}

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [staff, setStaff] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [budget, setBudget] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("overview");

    // Modal Bulk Invite
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({ guests: "", subject: "", content: "" });
    const [bulkSending, setBulkSending] = useState(false);
    
    // Modal Add Staff
    const [staffModal, setStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({ user_id: "", role: "volunteer" });
    const [submittingStaff, setSubmittingStaff] = useState(false);

    // Modal Timeline
    const [timelineModal, setTimelineModal] = useState(false);
    const [timelineForm, setTimelineForm] = useState({ 
        title: "", description: "", start_time: "", end_time: "",
        category: "general", location: "", pic_name: "" 
    });
    const [submittingTimeline, setSubmittingTimeline] = useState(false);

    const role = user?.role?.toLowerCase();
    const isAdmin = role === "admin";
    const isOrganizer = role === "organizer";
    const canManage = isAdmin || isOrganizer;
    const nextStatuses = event ? (WORKFLOW_NEXT[event.status] || []) : [];

    const fetchUsers = useCallback(async () => {
        try {
            const r = await getAllUsers();
            setUsers(r.data || []);
        } catch (err) {
            console.error("fetchUsers error:", err);
        }
    }, []);

    const loadTasks = useCallback(async () => {
        try {
            const r = await getTasksByEvent(id);
            setTasks(r.data || []);
        } catch (err) {
            console.error("loadTasks error:", err);
        }
    }, [id]);

    const loadAll = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [evR, stR, tlR, buR, atR] = await Promise.allSettled([
                api.get(`/events/${id}`),
                api.get(`/staff/event/${id}`),
                api.get(`/timeline/event/${id}`),
                api.get(`/budgets/event/${id}`),
                api.get(`/attendees/event/${id}`),
            ]);
            if (evR.status === "rejected") { setError("Không tìm thấy sự kiện."); setLoading(false); return; }
            setEvent(evR.value.data);
            setStaff(stR.status === "fulfilled" ? (stR.value.data || []) : []);
            setTimeline(tlR.status === "fulfilled" ? (tlR.value.data || []) : []);
            setBudget(buR.status === "fulfilled"
                ? { items: buR.value.data.items || [], total: buR.value.data.total || 0 }
                : { items: [], total: 0 });
            setAttendees(atR.status === "fulfilled" ? (atR.value.data || []) : []);
        } catch (err) {
            console.error("loadAll error:", err);
            setError("Lỗi khi tải dữ liệu.");
        }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadAll(); loadTasks(); fetchUsers(); }, [loadAll, loadTasks, fetchUsers]);

    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    const totalParticipants = attendees.length;
    const checkedIn = attendees.filter(a => a.checked_in).length;
    const checkinPct = totalParticipants > 0 ? Math.round((checkedIn / totalParticipants) * 100) : 0;

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const problemTasks = tasks.filter(t => t.feedback_status === 'rejected').length;

    const externalAttendees = attendees.filter(a => a.attendee_type === 'external');
    const internalAttendees = attendees.filter(a => a.attendee_type === 'internal');



    const handleChangeStatus = async (newStatus) => {
        const labels = { planning: "Lên kế hoạch", approved: "Duyệt", running: "Bắt đầu chạy", completed: "Hoàn thành", cancelled: "Hủy" };
        if (!window.confirm(`Chuyển trạng thái sang "${labels[newStatus]}"?`)) return;
        try {
            await changeStatus(id, newStatus);
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
    };



    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!staffForm.user_id) return;
        setSubmittingStaff(true);
        try {
            await api.post("/staff", { ...staffForm, event_id: id });
            setStaffModal(false);
            setStaffForm({ user_id: "", role: "volunteer" });
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Thêm nhân sự thất bại");
        } finally {
            setSubmittingStaff(false);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (!window.confirm("Bạn có chắc muốn gỡ nhân sự này khỏi sự kiện?")) return;
        try {
            await api.delete(`/staff/${staffId}`);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Gỡ thất bại");
        }
    };

    const handleAddTimeline = async (e) => {
        e.preventDefault();
        setSubmittingTimeline(true);
        try {
            await api.post("/timeline", { ...timelineForm, event_id: id });
            setTimelineModal(false);
            setTimelineForm({ title: "", description: "", start_time: "", end_time: "" });
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Thêm lịch trình thất bại");
        } finally {
            setSubmittingTimeline(false);
        }
    };

    const handleBulkInvite = async (e) => {
        e.preventDefault();
        setBulkSending(true);
        try {
            const lines = bulkForm.guests.split("\n").filter(l => l.trim());
            const parsedGuests = lines.map(line => {
                const parts = line.split(",").map(p => p.trim());
                return { name: parts[0], email: parts[1] };
            }).filter(g => g.name && g.email);

            if (parsedGuests.length === 0) throw new Error("Danh sách khách mời không hợp lệ");

            const r = await api.post("/attendees/bulk-invite", {
                event_id: id,
                guests: parsedGuests,
                subject: bulkForm.subject,
                content: bulkForm.content
            });
            alert(`Đã hoàn thành! Thành công: ${r.data.stats.success}, Thất bại: ${r.data.stats.failed}`);
            setBulkModal(false);
            setBulkForm({ guests: "", subject: "", content: "" });
            loadAll();
        } catch (err) {
            alert(err.message || "Gửi mail hàng loạt thất bại");
        } finally {
            setBulkSending(false);
        }
    };

    if (loading) return <Layout><div className="empty-state"><span>⏳</span><p>Đang tải...</p></div></Layout>;
    if (error || !event) return (
        <Layout>
            <div className="page-header">
                <button className="btn btn-outline btn-sm" onClick={() => navigate("/events")}>← Quay lại</button>
            </div>
            <div className="empty-state"><span>⚠️</span><p>{error || "Không tìm thấy sự kiện."}</p></div>
        </Layout>
    );

    const TABS = [
        { key: "overview", label: "📋 Tổng quan" },
        { key: "tasks", label: `✅ Công việc (${tasks.length})` },
        { key: "participants", label: `🎟️ Người tham gia (${totalParticipants})` },
        { key: "staff", label: `👥 Staff (${staff.length})` },
        { key: "timeline", label: `🗓️ Timeline (${timeline.length})` },
        { key: "budget", label: "💰 Ngân sách" },
    ];

    return (
        <Layout>
            {/* ── Unified Premium Header Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, var(--color-primary), #4338ca, var(--color-accent))",
                margin: "-32px -40px 32px", padding: "40px", color: "white",
                borderRadius: "0 0 32px 32px", boxShadow: "var(--shadow-lg)",
                position: "relative", border: "none"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                    <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => navigate("/events")}>
                        ← Quay lại danh sách
                    </button>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <StatusBadge status={event.status} />
                        {canManage && nextStatuses.length > 0 && (
                            <div style={{ display: "flex", gap: 8 }}>
                                {nextStatuses.map(s => {
                                    const isApproveStatus = s === "approved";
                                    if (isApproveStatus && !isAdmin) return (
                                        <button key={s} className="btn btn-sm" disabled style={{ opacity: 0.5, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                                            ✅ Duyệt (cần Admin)
                                        </button>
                                    );
                                    const btnCfg = {
                                        planning: { label: "→ Lên kế hoạch", cls: "" },
                                        approved: { label: "✅ Duyệt ngay", cls: "btn-primary" },
                                        running: { label: "▶ Bắt đầu chạy", cls: "btn-success" },
                                        completed: { label: "🏁 Hoàn thành", cls: "" },
                                        cancelled: { label: "✕ Hủy bỏ", cls: "btn-danger" },
                                    }[s] || { label: s, cls: "" };
                                    return (
                                        <button key={s} className={`btn btn-sm ${btnCfg.cls}`} 
                                            style={{ background: btnCfg.cls ? undefined : "rgba(255,255,255,0.15)", color: "white", border: btnCfg.cls ? "none" : "1px solid rgba(255,255,255,0.3)" }} 
                                            onClick={() => handleChangeStatus(s)}>
                                            {btnCfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
                    <div style={{ flex: 1, minWidth: 300 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                                {event.event_type || "Sự kiện"}
                            </span>
                            <span style={{ opacity: 0.7, fontSize: 12 }}>ID #{event.id}</span>
                        </div>
                        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 16, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>
                            {event.name}
                        </h1>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", opacity: 0.9, fontSize: 14 }}>
                            <span>📅 {fmtDT(event.start_date)} → {fmtDT(event.end_date)}</span>
                            {event.location && <span>📍 {event.location}</span>}
                            {event.owner_name && <span>🧑‍💼 Phụ trách: <strong>{event.owner_name}</strong></span>}
                        </div>
                    </div>
                    
                    <div className="grid-4" style={{ gap: 12, background: "rgba(0,0,0,0.1)", padding: 16, borderRadius: 24, backdropFilter: "blur(10px)" }}>
                        {[
                            { icon: "✅", label: "Công việc", value: `${doneTasks}/${totalTasks}` },
                            { icon: "🎟️", label: "Tham gia", value: totalParticipants },
                            { icon: "👥", label: "Staff", value: staff.length },
                            { icon: "💰", label: "Ngân sách", value: fmtVND(event.total_budget || 0) },
                        ].map(c => (
                            <div key={c.label} style={{ textAlign: "center", minWidth: 90 }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{c.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: 18, color: "white", lineHeight: 1 }}>{c.value}</div>
                                <div style={{ opacity: 0.6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{c.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
                <div className="card-stat">
                    <div className="card-stat-icon indigo">📋</div>
                    <div className="card-stat-info"><h3>{taskProgress}%</h3><p>Tiến độ công việc</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">✅</div>
                    <div className="card-stat-info"><h3>{checkinPct}%</h3><p>Tỷ lệ Check-in</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon amber">⏳</div>
                    <div className="card-stat-info"><h3>{totalTasks - doneTasks}</h3><p>Việc chưa xong</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon rose">⚠️</div>
                    <div className="card-stat-info"><h3>{problemTasks}</h3><p>Cần chỉnh sửa</p></div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {TABS.map(t => (
                    <button key={t.key}
                        className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ════ TAB: OVERVIEW ════ */}
            {tab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 24, alignItems: "start" }}>
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 20 }}>📋</span> Thông tin chung
                        </h3>
                        {[
                            { label: "Tên sự kiện", value: event.name },
                            { label: "Loại", value: event.event_type || "—" },
                            { label: "Người phụ trách", value: event.owner_name || "—" },
                            { label: "Bắt đầu", value: fmtDT(event.start_date) },
                            { label: "Kết thúc", value: fmtDT(event.end_date) },
                            { label: "Hình thức", value: event.venue_type === "online" ? "🌐 Online" : "🏢 Offline" },
                            { label: "Địa điểm", value: event.location || "—" },
                            { label: "Địa chỉ cụ thể", value: (event.venue_type === 'offline' && event.venue_id) ? (event.detailed_location || event.venue_address || "Đang cập nhật địa chỉ...") : "—" },
                            { label: "Đơn vị điều phối", value: event.coordination_unit || "—" },
                            { label: "Sức chứa", value: event.capacity ? `${event.capacity} người` : "—" },
                            { label: "Ngân sách dự kiến", value: <strong style={{color:"var(--color-primary)"}}>{fmtVND(event.total_budget || 0)}</strong> },
                            { label: "Trạng thái", value: <StatusBadge status={event.status} /> },
                            { label: "Người tổ chức", value: event.organizer_name || "—" },
                            { label: "Người quản lý", value: event.manager_name || "—" },
                            { label: "Admin duyệt", value: event.approver_name || "—" },
                        ].map(row => (
                            <div key={row.label} style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "12px 0", borderBottom: "1px solid #f1f5f9", gap: 12
                            }}>
                                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{row.label}</span>
                                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, textAlign: "right" }}>{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Check-in Card */}
                        <div className="card" style={{ border: "2px solid var(--color-primary)", position: "relative" }}>
                            <div style={{ position: "absolute", top: 12, right: 12, fontSize: 24 }}>📈</div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>✅ Tỷ lệ Check-in</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{checkedIn}/{totalParticipants} khách</span>
                                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)" }}>{checkinPct}%</span>
                            </div>
                            <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: `${checkinPct}%`,
                                    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                                    borderRadius: 6, transition: "width 1s ease-out"
                                }} />
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="card" style={{ background: "var(--text-primary)", color: "white" }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "white" }}>⚡ Thao tác nhanh</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <button className="btn btn-primary w-full" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                                    onClick={() => setBulkModal(true)}>
                                    💌 Mời khách hàng loạt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* ════ TAB: PARTICIPANTS (GUESTS & ATTENDEES) ════ */}
            {tab === "participants" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🎟️ Khách mời bên ngoài</h3>
                            {canManage && (
                                <button className="btn btn-primary btn-sm" onClick={() => setBulkModal(true)}>
                                    💌 Mời khách hàng loạt
                                </button>
                            )}
                        </div>
                        {externalAttendees.length === 0
                            ? <div className="empty-state"><span>🎟️</span><p>Chưa có khách mời</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>SĐT</th><th>Trạng thái</th></tr></thead>
                                <tbody>
                                    {externalAttendees.map((g, i) => (
                                        <tr key={g.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{g.checked_in ? "✅" : "⏳"} {g.name}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                            <td>{g.phone || "—"}</td>
                                            <td>{g.checked_in
                                                ? <span className="badge badge-success">Đã check-in</span>
                                                : <span className="badge badge-default">Chờ</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🏢 Nhân viên tham gia (Nội bộ)</h3>
                        </div>
                        {internalAttendees.length === 0
                            ? <div className="empty-state"><span>🏢</span><p>Chưa có nhân viên tham gia</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Phòng ban</th><th>Trạng thái</th></tr></thead>
                                <tbody>
                                    {internalAttendees.map((a, i) => (
                                        <tr key={a.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{a.checked_in ? "✅" : "⏳"} {a.name}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{a.email}</td>
                                            <td>{a.department_name || "—"}</td>
                                            <td>{a.checked_in
                                                ? <span className="badge badge-success">Đã check-in</span>
                                                : <span className="badge badge-default">Chờ</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    </div>
                </div>
            )}

            {tab === "staff" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>👥 Nhân sự phụ trách</h3>
                        {canManage && (
                            <button className="btn btn-primary btn-sm" onClick={() => setStaffModal(true)}>
                                + Thêm nhân sự
                            </button>
                        )}
                    </div>
                    {staff.length === 0
                        ? <div className="empty-state"><span>👥</span><p>Chưa có nhân sự</p></div>
                        : <table className="data-table">
                            <thead><tr><th>#</th><th>Tên</th><th>Phòng ban</th><th>Vai trò</th>{canManage && <th style={{ textAlign: "right" }}>Thao tác</th>}</tr></thead>
                            <tbody>
                                {staff.map((s, i) => {
                                    const roleColor = {
                                        manager: "badge-admin",
                                        marketing: "badge-warning",
                                        technical: "badge-organizer",
                                        support: "badge-default",
                                        volunteer: "badge-default",
                                    }[s.role] || "badge-default";
                                    return (
                                        <tr key={s.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>👤 {s.user_name || "—"}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.user_email}</div>
                                            </td>
                                            <td style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>{s.department_name || "—"}</td>
                                            <td><span className={`badge ${roleColor}`}>{s.role || "—"}</span></td>
                                            {canManage && (
                                                <td style={{ textAlign: "right" }}>
                                                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "red", opacity: 0.6 }} onClick={() => handleRemoveStaff(s.id)}>🗑</button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    }
                </div>
            )}

            {tab === "timeline" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>🗓️ Lịch trình trong ngày</h3>
                        {canManage && (
                            <button className="btn btn-primary btn-sm" onClick={() => setTimelineModal(true)}>
                                + Thêm lịch trình
                            </button>
                        )}
                    </div>
                    {timeline.length === 0
                        ? <div className="empty-state"><span>🗓️</span><p>Chưa có lịch trình</p></div>
                        : <div style={{ position: "relative", paddingLeft: 28 }}>
                            <div style={{
                                position: "absolute", left: 9, top: 4, bottom: 4,
                                width: 2, background: "var(--border-color)", borderRadius: 2
                            }} />
                            {timeline.map((item, i) => (
                                <div key={item.id} style={{ position: "relative", marginBottom: i < timeline.length - 1 ? 20 : 0 }}>
                                    <div style={{
                                        position: "absolute", left: -24, top: 4, width: 12, height: 12,
                                        borderRadius: "50%", background: "var(--color-primary)",
                                        border: "2px solid white", boxShadow: "0 0 0 2px var(--color-primary)"
                                    }} />
                                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "12px 16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</span>
                                            <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                                {fmtDT(item.start_time)}{item.end_time && ` → ${fmtDT(item.end_time)}`}
                                            </span>
                                        </div>
                                        {item.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{item.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            {/* ════ TAB: BUDGET ════ */}
            {tab === "budget" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>💰 Ngân sách sự kiện</h3>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Dự kiến</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>{fmtVND(event.total_budget || 0)}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 6 }}>Thực tế</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>{fmtVND(budget.total)}</p>
                        </div>
                    </div>
                    {/* So sánh ngân sách */}
                    {(event.total_budget || 0) > 0 && (
                        <div style={{
                            marginBottom: 20, padding: "10px 14px", borderRadius: 8,
                            background: budget.total > event.total_budget ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)"
                        }}>
                            <span style={{
                                fontSize: 13, fontWeight: 600,
                                color: budget.total > event.total_budget ? "#dc2626" : "#059669"
                            }}>
                                {budget.total > event.total_budget
                                    ? `⚠️ Vượt ngân sách ${fmtVND(budget.total - event.total_budget)}`
                                    : `✅ Còn lại ${fmtVND(event.total_budget - budget.total)}`}
                            </span>
                        </div>
                    )}
                    {budget.items.length === 0
                        ? <div className="empty-state"><span>💰</span><p>Chưa có khoản chi</p></div>
                        : <table className="data-table">
                            <thead><tr><th>#</th><th>Khoản mục</th><th>Ghi chú</th><th style={{ textAlign: "right" }}>Chi phí</th></tr></thead>
                            <tbody>
                                {budget.items.map((b, i) => (
                                    <tr key={b.id}>
                                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{b.item}</td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{b.note || "—"}</td>
                                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>{fmtVND(b.cost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: "2px solid var(--border-color)" }}>
                                    <td colSpan={3} style={{ fontWeight: 700, fontSize: 13, padding: "12px 16px" }}>Tổng cộng</td>
                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: 15, color: "var(--color-primary)", padding: "12px 16px" }}>
                                        {fmtVND(budget.total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    }
                </div>
            )}


            {/* ════ TAB: TASKS (Kanban) ════ */}
            {tab === "tasks" && (
                <TaskBoard 
                    eventId={id} 
                    staffList={staff.filter(s => !attendees.some(a => (a.user_id && a.user_id === s.user_id) || a.email === s.user_email))} 
                    canManage={canManage} 
                    onRefreshParent={loadAll}
                />
            )}

            {/* ── Modal Bulk Invite ── */}
            <Modal title="💌 Mời khách hàng loạt" isOpen={bulkModal} onClose={() => setBulkModal(false)} maxWidth="800px">
                <form onSubmit={handleBulkInvite}>
                    <div className="grid-2" style={{ gap: 24 }}>
                        <div className="form-group">
                            <label>Danh sách khách mời <span style={{ color: "red" }}>*</span></label>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                                Nhập mỗi dòng: <strong>Tên, Email</strong> (ngăn cách bởi dấu phẩy)
                            </p>
                            <textarea className="form-control" rows="6"
                                placeholder="Nguyễn Văn A, anguyen@gmail.com&#10;Trần Thị B, btran@gmail.com"
                                value={bulkForm.guests}
                                onChange={e => setBulkForm({ ...bulkForm, guests: e.target.value })}
                                required />
                        </div>
                        
                        <div className="form-group">
                            <label>Lời nhắn trong thư mời</label>
                            <textarea className="form-control" style={{ height: "calc(100% - 28px)" }}
                                placeholder="VD: Trân trọng kính mời bạn đến tham dự buổi lễ ra mắt sản phẩm mới của chúng tôi..."
                                value={bulkForm.content}
                                onChange={e => setBulkForm({ ...bulkForm, content: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ background: "rgba(99,102,241,0.07)", padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                        💡 Hệ thống sẽ tự động tạo mã QR Check-in duy nhất cho từng khách mời và gửi kèm trong email.
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={bulkSending}>
                        {bulkSending ? " đang gửi email... (vui lòng đợi)" : "🚀 Gửi lời mời hàng loạt"}
                    </button>
                </form>
            </Modal>
            {/* ── Modal Add Staff ── */}
            <Modal title="Phân công nhân sự vào sự kiện" isOpen={staffModal} onClose={() => setStaffModal(false)}>
                <form onSubmit={handleAddStaff} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                        <label>Chọn nhân sự</label>
                        <select className="form-control" value={staffForm.user_id} onChange={e => setStaffForm({ ...staffForm, user_id: e.target.value })} required>
                            <option value="">-- Chọn thành viên --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} - {u.department_name || "Chưa có phòng ban"}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Vai trò trong sự kiện</label>
                        <select className="form-control" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                            <option value="manager">Manager (Quản lý)</option>
                            <option value="marketing">Marketing (Truyền thông)</option>
                            <option value="technical">Technical (Kỹ thuật)</option>
                            <option value="support">Support (Hỗ trợ)</option>
                            <option value="volunteer">Volunteer (Tình nguyện viên)</option>
                        </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setStaffModal(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={submittingStaff}>
                            {submittingStaff ? "Đang xử lý..." : "✅ Xác nhận thêm"}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* ── Modal Timeline ── */}
            <Modal title="🗓️ Thêm lịch trình mới" isOpen={timelineModal} onClose={() => setTimelineModal(false)} maxWidth="800px">
                <form onSubmit={handleAddTimeline} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                        <label>Tiêu đề hoạt động *</label>
                        <input className="form-control" type="text" value={timelineForm.title} onChange={e => setTimelineForm({ ...timelineForm, title: e.target.value })} required placeholder="VD: Khai mạc, Teabreak..." />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Bắt đầu *</label>
                            <input className="form-control" type="datetime-local" value={timelineForm.start_time} onChange={e => setTimelineForm({ ...timelineForm, start_time: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Kết thúc</label>
                            <input className="form-control" type="datetime-local" value={timelineForm.end_time} onChange={e => setTimelineForm({ ...timelineForm, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Loại hoạt động</label>
                            <select className="form-control" value={timelineForm.category} onChange={e => setTimelineForm({ ...timelineForm, category: e.target.value })}>
                                <option value="general">Mục chung</option>
                                <option value="opening">Khai mạc / Chào mừng</option>
                                <option value="performance">Tiết mục văn nghệ</option>
                                <option value="speech">Phát biểu / Tham luận</option>
                                <option value="award">Trao giải / Vinh danh</option>
                                <option value="break">Giải lao / Teabreak</option>
                                <option value="closing">Bế mạc / Kết thúc</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Người phụ trách (PIC)</label>
                            <select className="form-control" value={timelineForm.pic_name} onChange={e => setTimelineForm({ ...timelineForm, pic_name: e.target.value })}>
                                <option value="">-- Chọn nhân sự --</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.user_name}>
                                        {s.user_name} [{s.department_name || "N/A"}]
                                    </option>
                                ))}
                                <option value="Khác">Khác (Ngoài hệ thống...)</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Địa điểm / Vị trí</label>
                        <input className="form-control" type="text" value={timelineForm.location} onChange={e => setTimelineForm({ ...timelineForm, location: e.target.value })} placeholder="VD: Sân khấu chính, Sảnh A..." />
                    </div>
                    <div className="form-group">
                        <label>Mô tả chi tiết kịch bản</label>
                        <textarea className="form-control" rows="3" value={timelineForm.description} onChange={e => setTimelineForm({ ...timelineForm, description: e.target.value })} placeholder="Chi tiết diễn biến, lưu ý kỹ thuật..." />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setTimelineModal(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={submittingTimeline}>
                            {submittingTimeline ? "Đang lưu..." : "✅ Lưu lịch trình"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
