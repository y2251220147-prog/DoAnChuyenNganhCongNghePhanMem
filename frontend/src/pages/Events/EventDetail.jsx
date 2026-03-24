import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent, createTask, updateTaskStatus, deleteTask } from "../../services/taskService";
import {
    changeStatus,
    createDeadline, deleteDeadline, getDeadlines, toggleDeadline
} from "../../services/eventService";
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
    const [guests, setGuests] = useState([]);
    const [staff, setStaff] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [budget, setBudget] = useState({ items: [], total: 0 });
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("overview");

    // Modal thêm deadline
    const [dlModal, setDlModal] = useState(false);
    const [dlForm, setDlForm] = useState({ title: "", due_date: "", note: "" });
    const [dlSaving, setDlSaving] = useState(false);

    const isAdmin = user?.role === "admin";
    const canManage = user?.role === "admin" || user?.role === "organizer";
    const nextStatuses = event ? (WORKFLOW_NEXT[event.status] || []) : [];

    useEffect(() => { loadAll(); loadTasks(); }, [id]);

    const loadTasks = async () => {
        try {
            const r = await getTasksByEvent(id);
            setTasks(r.data || []);
        } catch {/**/ }
    };

    const loadAll = async () => {
        setLoading(true); setError("");
        try {
            const [evR, guR, stR, tlR, buR, dlR] = await Promise.allSettled([
                api.get(`/events/${id}`),
                api.get(`/guests/event/${id}`),
                api.get(`/staff/event/${id}`),
                api.get(`/timeline/event/${id}`),
                api.get(`/budgets/event/${id}`),
                api.get(`/events/${id}/deadlines`),
                api.get(`/tasks/event/${id}`),
            ]);
            if (evR.status === "rejected") { setError("Không tìm thấy sự kiện."); setLoading(false); return; }
            setEvent(evR.value.data);
            setGuests(guR.status === "fulfilled" ? (guR.value.data || []) : []);
            setStaff(stR.status === "fulfilled" ? (stR.value.data || []) : []);
            setTimeline(tlR.status === "fulfilled" ? (tlR.value.data || []) : []);
            setBudget(buR.status === "fulfilled"
                ? { items: buR.value.data.items || [], total: buR.value.data.total || 0 }
                : { items: [], total: 0 });
            setDeadlines(dlR.status === "fulfilled" ? (dlR.value.data || []) : []);
            const taskR = arguments[6]; // handled below
            setTasks([]);
        } catch { setError("Lỗi khi tải dữ liệu."); }
        finally { setLoading(false); }
    };

    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    const doneCount = deadlines.filter(d => d.done).length;
    const dlProgress = deadlines.length > 0 ? Math.round((doneCount / deadlines.length) * 100) : 0;
    const checkedIn = guests.filter(g => g.checked_in).length;
    const checkinPct = guests.length > 0 ? Math.round((checkedIn / guests.length) * 100) : 0;

    // ── Workflow ──────────────────────────────────────────────
    const handleChangeStatus = async (newStatus) => {
        const labels = { planning: "Lên kế hoạch", approved: "Duyệt", running: "Bắt đầu chạy", completed: "Hoàn thành", cancelled: "Hủy" };
        if (!window.confirm(`Chuyển trạng thái sang "${labels[newStatus]}"?`)) return;
        try {
            await changeStatus(id, newStatus);
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
    };

    // ── Deadlines ─────────────────────────────────────────────
    const handleToggleDl = async (dlId, done) => {
        try { await toggleDeadline(id, dlId, !done); loadAll(); }
        catch { alert("Cập nhật thất bại"); }
    };

    const handleDeleteDl = async (dlId) => {
        if (!window.confirm("Xóa deadline này?")) return;
        try { await deleteDeadline(id, dlId); loadAll(); }
        catch { alert("Xóa thất bại"); }
    };

    const handleAddDeadline = async (e) => {
        e.preventDefault(); setDlSaving(true);
        try {
            await createDeadline(id, dlForm);
            setDlModal(false); setDlForm({ title: "", due_date: "", note: "" });
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thêm thất bại"); }
        finally { setDlSaving(false); }
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
        { key: "deadlines", label: `🔥 Deadlines (${doneCount}/${deadlines.length})` },
        { key: "guests", label: `🎟️ Khách (${guests.length})` },
        { key: "staff", label: `👥 Staff (${staff.length})` },
        { key: "timeline", label: `🗓️ Timeline (${timeline.length})` },
        { key: "budget", label: "💰 Ngân sách" },
    ];

    return (
        <Layout>
            {/* ── Header ── */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate("/events")}>← Quay lại</button>
                    <div>
                        <h2>🎪 {event.name}</h2>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                            {event.event_type && <span style={{ marginRight: 8 }}>🏷️ {event.event_type}</span>}
                            ID #{event.id}
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusBadge status={event.status} />
                    {/* Nút chuyển trạng thái */}
                    {canManage && nextStatuses.length > 0 && (
                        <div style={{ display: "flex", gap: 6 }}>
                            {nextStatuses.map(s => {
                                const isApprove = s === "approved";
                                if (isApprove && !isAdmin) return (
                                    <span key={s} className="btn btn-outline btn-sm"
                                        style={{ opacity: 0.4, cursor: "not-allowed" }}
                                        title="Chỉ Admin mới duyệt được">
                                        ✅ Duyệt (cần Admin)
                                    </span>
                                );
                                const btnCfg = {
                                    planning: { label: "→ Lên kế hoạch", cls: "btn-outline" },
                                    approved: { label: "✅ Duyệt", cls: "btn-primary" },
                                    running: { label: "▶ Bắt đầu", cls: "btn-success" },
                                    completed: { label: "🏁 Hoàn thành", cls: "btn-outline" },
                                    cancelled: { label: "✕ Hủy", cls: "btn-danger" },
                                }[s] || { label: s, cls: "btn-outline" };
                                return (
                                    <button key={s} className={`btn btn-sm ${btnCfg.cls}`}
                                        onClick={() => handleChangeStatus(s)}>
                                        {btnCfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Hero Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
                borderRadius: 14, padding: "20px 28px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
                <div>
                    <p style={{
                        color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                    }}>
                        Thông tin sự kiện
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", marginBottom: 4 }}>
                        <span style={{ color: "white", fontSize: 13 }}>📅 {fmtDT(event.start_date)} → {fmtDT(event.end_date)}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                        {event.venue_type === "online"
                            ? <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🌐 Online</span>
                            : event.location && <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>📍 {event.location}</span>
                        }
                        {event.capacity && <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>👤 Sức chứa: {event.capacity}</span>}
                        {event.owner_name && <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>🧑‍💼 Phụ trách: {event.owner_name}</span>}
                    </div>
                    {event.description && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 8, maxWidth: 480 }}>{event.description}</p>}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                        { icon: "🔥", label: "Deadlines", value: `${doneCount}/${deadlines.length}` },
                        { icon: "🎟️", label: "Khách", value: guests.length },
                        { icon: "👥", label: "Staff", value: staff.length },
                        { icon: "💰", label: "Ngân sách", value: fmtVND(event.total_budget || 0) },
                    ].map(c => (
                        <div key={c.label} style={{
                            background: "rgba(255,255,255,0.15)", borderRadius: 10,
                            padding: "10px 14px", textAlign: "center", minWidth: 70
                        }}>
                            <div style={{ fontSize: 18 }}>{c.icon}</div>
                            <div style={{ color: "white", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{c.value}</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{c.label}</div>
                        </div>
                    ))}
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
                <div className="grid-2" style={{ alignItems: "start" }}>
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Thông tin chung</h3>
                        {[
                            { label: "Tên sự kiện", value: event.name },
                            { label: "Loại", value: event.event_type || "—" },
                            { label: "Người phụ trách", value: event.owner_name || "—" },
                            { label: "Bắt đầu", value: fmtDT(event.start_date) },
                            { label: "Kết thúc", value: fmtDT(event.end_date) },
                            { label: "Hình thức", value: event.venue_type === "online" ? "🌐 Online" : "🏢 Offline" },
                            { label: "Địa điểm", value: event.location || "—" },
                            { label: "Sức chứa", value: event.capacity ? `${event.capacity} người` : "—" },
                            { label: "Ngân sách dự kiến", value: fmtVND(event.total_budget || 0) },
                            { label: "Trạng thái", value: <StatusBadge status={event.status} /> },
                            { label: "Người duyệt", value: event.approver_name || "—" },
                            { label: "Ngày duyệt", value: fmtDate(event.approved_at) },
                            { label: "Ngày tạo", value: fmtDate(event.created_at) },
                        ].map(row => (
                            <div key={row.label} style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "flex-start", padding: "9px 0",
                                borderBottom: "1px solid var(--border-color)", gap: 12
                            }}>
                                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
                                <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "right" }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Tiến độ deadline */}
                        <div className="card">
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🔥 Tiến độ Deadline nội bộ</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{doneCount}/{deadlines.length} hoàn thành</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>{dlProgress}%</span>
                            </div>
                            <div style={{ height: 10, background: "var(--border-color)", borderRadius: 5, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: `${dlProgress}%`,
                                    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                                    borderRadius: 5, transition: "width 0.6s ease"
                                }} />
                            </div>
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                                {deadlines.map(dl => {
                                    const overdue = !dl.done && new Date(dl.due_date) < new Date();
                                    return (
                                        <div key={dl.id} style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "6px 10px", borderRadius: 8,
                                            background: dl.done ? "rgba(16,185,129,0.07)" : overdue ? "rgba(239,68,68,0.07)" : "var(--bg-main)"
                                        }}>
                                            <span style={{ fontSize: 14 }}>{dl.done ? "✅" : overdue ? "🔴" : "⏳"}</span>
                                            <span style={{
                                                flex: 1, fontSize: 13, fontWeight: dl.done ? 400 : 600,
                                                textDecoration: dl.done ? "line-through" : "none",
                                                color: dl.done ? "var(--text-muted)" : "var(--text-primary)"
                                            }}>
                                                {dl.title}
                                            </span>
                                            <span style={{ fontSize: 11, color: overdue ? "#dc2626" : "var(--text-muted)" }}>
                                                {fmtDate(dl.due_date)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Check-in */}
                        <div className="card">
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>✅ Tỷ lệ Check-in</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{checkedIn}/{guests.length} khách</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>{checkinPct}%</span>
                            </div>
                            <div style={{ height: 10, background: "var(--border-color)", borderRadius: 5, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: `${checkinPct}%`,
                                    background: "linear-gradient(90deg, var(--color-primary), #818cf8)",
                                    borderRadius: 5, transition: "width 0.6s ease"
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ TAB: DEADLINES ════ */}
            {tab === "deadlines" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🔥 Deadlines nội bộ</h3>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                Các mốc quan trọng trước ngày diễn ra sự kiện
                            </p>
                        </div>
                        {canManage && (
                            <button className="btn btn-primary btn-sm" onClick={() => setDlModal(true)}>+ Thêm deadline</button>
                        )}
                    </div>
                    {deadlines.length === 0 ? (
                        <div className="empty-state"><span>🔥</span><p>Chưa có deadline nào</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Hạng mục</th><th>Hạn chót</th><th>Ghi chú</th><th>Trạng thái</th>
                                    {canManage && <th>Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {deadlines.map(dl => {
                                    const overdue = !dl.done && new Date(dl.due_date) < new Date();
                                    return (
                                        <tr key={dl.id}>
                                            <td style={{ fontWeight: 600 }}>{dl.title}</td>
                                            <td style={{ color: overdue ? "#dc2626" : "var(--text-primary)", fontWeight: overdue ? 700 : 400 }}>
                                                {fmtDT(dl.due_date)} {overdue && "⚠️"}
                                            </td>
                                            <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{dl.note || "—"}</td>
                                            <td>
                                                {dl.done
                                                    ? <span className="badge badge-success">✅ Hoàn thành</span>
                                                    : overdue
                                                        ? <span className="badge badge-danger">🔴 Trễ hạn</span>
                                                        : <span className="badge badge-default">⏳ Chờ</span>
                                                }
                                            </td>
                                            {canManage && (
                                                <td>
                                                    <div className="actions">
                                                        <button className={`btn btn-sm ${dl.done ? "btn-outline" : "btn-success"}`}
                                                            onClick={() => handleToggleDl(dl.id, dl.done)}>
                                                            {dl.done ? "↩ Hoàn tác" : "✓ Xong"}
                                                        </button>
                                                        <button className="btn btn-danger btn-sm"
                                                            onClick={() => handleDeleteDl(dl.id)}>🗑</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ════ TAB: GUESTS ════ */}
            {tab === "guests" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>🎟️ Danh sách khách mời</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{checkedIn}/{guests.length} đã check-in</span>
                    </div>
                    {guests.length === 0
                        ? <div className="empty-state"><span>🎟️</span><p>Chưa có khách mời</p></div>
                        : <table className="data-table">
                            <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>SĐT</th><th>Trạng thái</th></tr></thead>
                            <tbody>
                                {guests.map((g, i) => (
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
                <TaskBoard eventId={id} staffList={staff} canManage={canManage} />
            )}
            {/* ── Modal thêm deadline ── */}
            <Modal title="Thêm Deadline" isOpen={dlModal} onClose={() => setDlModal(false)}>
                <form onSubmit={handleAddDeadline}>
                    <div className="form-group">
                        <label>Tiêu đề <span style={{ color: "red" }}>*</span></label>
                        <input className="form-control" placeholder="VD: Chốt danh sách khách mời"
                            value={dlForm.title} onChange={e => setDlForm({ ...dlForm, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Hạn chót <span style={{ color: "red" }}>*</span></label>
                        <input type="datetime-local" className="form-control"
                            value={dlForm.due_date} onChange={e => setDlForm({ ...dlForm, due_date: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Ghi chú</label>
                        <textarea className="form-control" rows="2"
                            value={dlForm.note} onChange={e => setDlForm({ ...dlForm, note: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={dlSaving}>
                        {dlSaving ? "Đang lưu..." : "Thêm deadline"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
