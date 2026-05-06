import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent } from "../../services/taskService";
import { changeStatus } from "../../services/eventService";
import { getAllUsers } from "../../services/userService";
import { getDepartments } from "../../services/departmentService";
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
    todo:        { label: "Chuẩn Bị",  color: "#6366f1" },
    in_progress: { label: "Đang Làm",  color: "#f59e0b" },
    done:        { label: "Hoàn Thành", color: "#10b981" },
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
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("overview");

    // Modal Bulk Invite
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({ guests: "", subject: "", content: "" });
    const [bulkSending, setBulkSending] = useState(false);

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


    const loadAll = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [evR, stR, tlR, buR, atR, deR, tkR] = await Promise.allSettled([
                api.get(`/events/${id}`),
                api.get(`/staff/event/${id}`),
                api.get(`/timeline/event/${id}`),
                api.get(`/budgets/event/${id}`),
                api.get(`/attendees/event/${id}`),
                getDepartments(),
                getTasksByEvent(id),
            ]);
            if (evR.status === "rejected") { setError("Không tìm thấy sự kiện."); setLoading(false); return; }
            setEvent(evR.value.data);
            setStaff(stR.status === "fulfilled" ? (stR.value.data || []) : []);
            setTimeline(tlR.status === "fulfilled" ? (tlR.value.data || []) : []);
            setBudget(buR.status === "fulfilled"
                ? buR.value.data
                : { items: [], total: 0, stats: { planned: 0, total_estimated: 0, total_paid: 0 } });
            setAttendees(atR.status === "fulfilled" ? (atR.value.data || []) : []);
            setDepartments(deR.status === "fulfilled" ? (deR.value.data || []) : []);
            setTasks(tkR.status === "fulfilled" ? (tkR.value.data || []) : []);
        } catch (err) {
            console.error("loadAll error:", err);
            setError("Lỗi khi tải dữ liệu.");
        }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadAll(); fetchUsers(); }, [loadAll, fetchUsers]);

    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    const externalGuests = attendees.filter(a => a.attendee_type === "external");
    const internalStaff = attendees.filter(a => a.attendee_type === "internal");
    const totalParticipants = attendees.length;
    const checkedIn = attendees.filter(a => a.checked_in).length;
    const checkinPct = totalParticipants > 0 ? Math.round((checkedIn / totalParticipants) * 100) : 0;
    const taskDone = tasks.filter(t => t.status === 'done').length;
    const taskProgress = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

    // ── Workflow ──────────────────────────────────────────────
    const handleChangeStatus = async (newStatus) => {
        const labels = { planning: "Lên kế hoạch", approved: "Duyệt", running: "Bắt đầu chạy", completed: "Hoàn thành", cancelled: "Hủy" };
        if (!window.confirm(`Chuyển trạng thái sang "${labels[newStatus]}"?`)) return;
        try {
            await changeStatus(id, newStatus);
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
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

            const r = await api.post("/attendees/bulk-external", {
                event_id: Number(id),
                guests: parsedGuests,
                note: bulkForm.content
            });
            alert(`Đã hoàn thành! Thêm thành công ${r.data.count}/${r.data.total} khách mời.`);
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
                    
                    <div className="grid-3" style={{ gap: 12, background: "rgba(0,0,0,0.1)", padding: 16, borderRadius: 24, backdropFilter: "blur(10px)" }}>
                        {[
                            { icon: "✅", label: "Công việc", value: `${taskDone}/${tasks.length}` },
                            { icon: "🎟️", label: "Tham gia", value: totalParticipants },
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
                    <div className="card-stat-info"><h3>{tasks.length}</h3><p>Tổng công việc</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">✅</div>
                    <div className="card-stat-info"><h3>{taskProgress}%</h3><p>Tiến độ công việc</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">🎟️</div>
                    <div className="card-stat-info"><h3>{checkinPct}%</h3><p>Tỷ lệ Check-in</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon amber">👥</div>
                    <div className="card-stat-info"><h3>{staff.length}</h3><p>Nhân sự phụ trách</p></div>
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
                <div className="grid-3" style={{ alignItems: "start" }}>
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
                            { label: "Phòng ban phụ trách", value: event.department_name || "—" },
                            { label: "Sức chứa", value: event.capacity ? `${event.capacity} người` : "—" },
                            { label: "Ngân sách dự kiến", value: <strong style={{color:"var(--color-primary)"}}>{fmtVND(event.total_budget || 0)}</strong> },
                            { label: "Trạng thái", value: <StatusBadge status={event.status} /> },
                            { label: "Người tổ chức", value: event.organizer_name || "—" },

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
                        {/* Tiến độ công việc */}
                        <div className="card" style={{ background: "linear-gradient(to bottom right, #ffffff, #f8fafc)" }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>✅ Tiến độ công việc</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{taskDone}/{tasks.length} hoàn thành</span>
                                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)" }}>{taskProgress}%</span>
                            </div>
                            <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
                                <div style={{ height: "100%", width: `${taskProgress}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))", borderRadius: 6, transition: "width 1s ease-out" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {[
                                    { label: "📋 Chuẩn Bị",  count: tasks.filter(t => t.status === 'todo').length,        color: "#6366f1" },
                                    { label: "⚡ Đang Làm",  count: tasks.filter(t => t.status === 'in_progress').length,  color: "#f59e0b" },
                                    { label: "✅ Hoàn Thành", count: tasks.filter(t => t.status === 'done').length,         color: "#10b981" },
                                ].map(s => (
                                    <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: 8, background: s.color + "12" }}>
                                        <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.count}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                <button className="btn btn-primary w-full" style={{ background: "rgba(255,255,255,0.1)", border: "none" }}
                                    onClick={() => setTab("tasks")}>
                                    ✅ Xem công việc
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
                        {externalGuests.length === 0
                            ? <div className="empty-state"><span>🎟️</span><p>Chưa có khách mời bên ngoài</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Phòng ban / Công ty</th><th>Trạng thái</th></tr></thead>
                                <tbody>
                                    {externalGuests.map((g, i) => (
                                        <tr key={g.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{g.checked_in ? "✅" : "⏳"} {g.name}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                            <td>{g.organization || "—"}</td>
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
                        {internalStaff.length === 0
                            ? <div className="empty-state"><span>🏢</span><p>Chưa có nhân viên đăng ký tham gia</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Phòng ban</th><th>Trạng thái</th></tr></thead>
                                <tbody>
                                    {internalStaff.map((a, i) => (
                                        <tr key={a.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{a.checked_in ? "✅" : "⏳"} {a.name}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{a.email}</td>
                                            <td>{a.user_department || "—"}</td>
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

            {/* ════ TAB: STAFF ════ */}
            {tab === "staff" && (
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>👥 Nhân sự phụ trách</h3>
                    {staff.length === 0
                        ? <div className="empty-state"><span>👥</span><p>Chưa có nhân sự</p></div>
                        : <table className="data-table">
                            <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Vai trò</th></tr></thead>
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
                                            <td style={{ fontWeight: 600 }}>👤 {s.user_name || "—"}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{s.user_email || "—"}</td>
                                            <td><span className={`badge ${roleColor}`}>{s.role || "—"}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    }
                </div>
            )}

            {/* ════ TAB: TIMELINE ════ */}
            {tab === "timeline" && (
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🗓️ Lịch trình trong ngày</h3>
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
                <div className="card" style={{ border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                    <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>💰 Quản lý Tài chính Thực tế</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Phân tích sự sai lệch giữa kế hoạch, dự trù và chi tiêu thực tế.</p>
                    </div>

                    {/* Budget Overview Cards */}
                    <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
                        <div style={{ padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Ngân sách kế hoạch</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--color-primary)" }}>{fmtVND(budget?.stats?.planned || 0)}</div>
                        </div>
                        <div style={{ padding: 20, background: "#fffbeb", borderRadius: 16, border: "1px solid #fde68a" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 8 }}>Tổng dự trù (Ước tính)</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: "#d97706" }}>{fmtVND(budget?.stats?.total_estimated || 0)}</div>
                            <div style={{ fontSize: 10, color: "#b45309", marginTop: 4 }}>Bao gồm cả các dự trù chưa chi</div>
                        </div>
                        <div style={{ 
                            padding: 20, background: (budget?.stats?.total_paid > (budget?.stats?.planned || 0)) ? "#fef2f2" : "#f0fdf4", 
                            borderRadius: 16, border: `1px solid ${(budget?.stats?.total_paid > (budget?.stats?.planned || 0)) ? "#fecaca" : "#bbf7d0"}` 
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: (budget?.stats?.total_paid > (budget?.stats?.planned || 0)) ? "#991b1b" : "#166534", textTransform: "uppercase", marginBottom: 8 }}>Thực tế đã chi</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: (budget?.stats?.total_paid > (budget?.stats?.planned || 0)) ? "#dc2626" : "#10b981" }}>{fmtVND(budget?.stats?.total_paid || 0)}</div>
                            {budget?.stats?.total_paid > (budget?.stats?.planned || 0) && (
                                <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 4 }}>⚠️ VƯỢT NGÂN SÁCH</div>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                            <span style={{ color: "var(--text-secondary)" }}>Tỉ lệ giải ngân thực tế</span>
                            <span style={{ color: "var(--color-primary)" }}>
                                {Math.round((budget?.stats?.total_paid / (budget?.stats?.planned || 1)) * 100)}%
                            </span>
                        </div>
                        <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ 
                                height: "100%", 
                                width: `${Math.min(100, (budget?.stats?.total_paid / (budget?.stats?.planned || 1)) * 100)}%`,
                                background: (budget?.stats?.total_paid > (budget?.stats?.planned || 0)) ? "#ef4444" : "linear-gradient(90deg, #6366f1, #10b981)",
                                borderRadius: 6, transition: "width 1s ease-in-out"
                            }} />
                        </div>
                    </div>

                    <div className="data-table-wrapper" style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                        <table className="data-table">
                            <thead style={{ background: "#f8fafc" }}>
                                <tr>
                                    <th>Hạng mục chi tiêu</th>
                                    <th>Loại</th>
                                    <th style={{ textAlign: "right" }}>Dự kiến</th>
                                    <th style={{ textAlign: "right" }}>Thực chi</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(budget.items || []).map((b) => (
                                    <tr key={b.id} className="table-row-hover">
                                        <td style={{ fontWeight: 600 }}>{b.item}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "3px 8px", borderRadius: 6,
                                                background: String(b.id).startsWith('task-') ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)",
                                                color: String(b.id).startsWith('task-') ? "var(--color-primary)" : "#b45309",
                                                border: `1px solid ${String(b.id).startsWith('task-') ? "rgba(99,102,241,0.2)" : "rgba(245,158,11,0.2)"}`
                                            }}>
                                                {String(b.id).startsWith('task-') ? "Công việc" : "Trực tiếp"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right", color: "#64748b" }}>{fmtVND(b.estimated_cost || 0)}</td>
                                        <td style={{ textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                                            {b.status === 'paid' ? fmtVND(b.cost || 0) : "—"}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                                                color: b.status === 'paid' ? "#10b981" : "#f59e0b"
                                            }}>
                                                {b.status === 'paid' ? "✅ Đã chi" : "⏳ Dự kiến"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* ════ TAB: TASKS (Kanban) ════ */}
            {tab === "tasks" && (
                <TaskBoard 
                    eventId={id} 
                    eventStaff={staff} 
                    allUsers={users}
                    departments={departments}
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
                                placeholder={"Nguyễn Văn A, anguyen@gmail.com\nTrần Thị B, btran@gmail.com"}
                                value={bulkForm.guests}
                                onChange={e => setBulkForm({ ...bulkForm, guests: e.target.value })}
                                required />
                        </div>
                        <div className="form-group">
                            <label>Lời nhắn trong thư mời</label>
                            <textarea className="form-control" style={{ height: "calc(100% - 28px)" }}
                                placeholder="VD: Trân trọng kính mời bạn đến tham dự buổi lễ ra mắt sản phẩm mới..."
                                value={bulkForm.content}
                                onChange={e => setBulkForm({ ...bulkForm, content: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ background: "rgba(99,102,241,0.07)", padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                        💡 Hệ thống sẽ tự động tạo mã QR Check-in duy nhất cho từng khách mời và gửi kèm trong email.
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={bulkSending}>
                        {bulkSending ? "Đang gửi email..." : "🚀 Gửi lời mời hàng loạt"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
