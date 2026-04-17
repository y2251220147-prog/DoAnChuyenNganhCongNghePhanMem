import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent } from "../../services/taskService";
import { changeStatus, createDeadline, deleteDeadline } from "../../services/eventService";
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

const DL_STATUS_CFG = {
    pending: { label: "Chờ", bg: "#f1f5f9", color: "#64748b" },
    working: { label: "Đang làm", bg: "#dbeafe", color: "#2563eb" },
    completed: { label: "Hoàn thành", bg: "#ede9fe", color: "#7c3aed" },
    done: { label: "Đã xong", bg: "#d1fae5", color: "#059669" },
    problem: { label: "Vấn đề", bg: "#fee2e2", color: "#dc2626" },
};

const TASK_STATUS_CFG = {
    todo: { label: "Chưa bắt đầu", color: "#94a3b8" },
    in_progress: { label: "Đang làm", color: "#f59e0b" },
    review: { label: "Chờ duyệt", color: "#6366f1" },
    done: { label: "Hoàn thành", color: "#10b981" },
    cancelled: { label: "Đã hủy", color: "#ef4444" },
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
    const [attendees, setAttendees] = useState([]);
    const [staff, setStaff] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [budget, setBudget] = useState({ items: [], total: 0 });
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("overview");
    const [taskFilterDeadlineId, setTaskFilterDeadlineId] = useState(null);
    const [expandedDlId, setExpandedDlId] = useState(null);
    const [dlModal, setDlModal] = useState(false);
    const [dlForm, setDlForm] = useState({ title: "", due_date: "", note: "", assigned_to: "" });
    const [dlSaving, setDlSaving] = useState(false);

    // Modal Báo cáo vấn đề
    const [dlProbModal, setDlProbModal] = useState(false);
    const [dlProbId, setDlProbId] = useState(null);
    const [dlProbNote, setDlProbNote] = useState("");

    // Modal Bulk Invite
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({ guests: "", subject: "", content: "" });
    const [bulkSending, setBulkSending] = useState(false);
    const [viewProbModal, setViewProbModal] = useState(false);
    const [viewProbDl, setViewProbDl] = useState(null);

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
            const [evR, guR, stR, tlR, buR, dlR, atR] = await Promise.allSettled([
                api.get(`/events/${id}`),
                api.get(`/guests/event/${id}`),
                api.get(`/staff/event/${id}`),
                api.get(`/timeline/event/${id}`),
                api.get(`/budgets/event/${id}`),
                api.get(`/events/${id}/deadlines`),
                api.get(`/attendees/event/${id}`),
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

    const doneCount = deadlines.filter(d => d.status === 'done').length;
    const dlProgress = deadlines.length > 0 ? Math.round((doneCount / deadlines.length) * 100) : 0;
    const totalParticipants = guests.length + attendees.length;
    const checkedIn = guests.filter(g => g.checked_in).length + attendees.filter(a => a.checked_in).length;
    const checkinPct = totalParticipants > 0 ? Math.round((checkedIn / totalParticipants) * 100) : 0;

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
    const handleUpdateDlStatus = async (dlId, status, note) => {
        try {
            await api.patch(`/events/${id}/deadlines/${dlId}`, { status, note });
            loadAll();
            setDlProbModal(false);
            setDlProbId(null);
            setDlProbNote("");
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
    };

    const handleOpenViewProb = (dl) => {
        setViewProbDl(dl);
        setViewProbModal(true);
    };

    const handleOpenProbModal = (dl) => {
        setDlProbId(dl.id);
        setDlProbNote(dl.note || "");
        setDlProbModal(true);
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
            setDlModal(false); setDlForm({ title: "", due_date: "", note: "", assigned_to: "" });
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thêm thất bại"); }
        finally { setDlSaving(false); }
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

            const r = await api.post("/guests/bulk-invite", {
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
        { key: "deadlines", label: `🔥 Deadlines (${doneCount}/${deadlines.length})` },
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
                                    const allDlDone = deadlines.every(d => d.status === 'done');
                                    if (isApproveStatus && isAdmin && !allDlDone) return (
                                        <button key={s} className="btn btn-sm" disabled style={{ opacity: 0.6, background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.4)", color: "white", cursor: "not-allowed" }}>
                                            🔒 Duyệt (chưa xong deadline)
                                        </button>
                                    );
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
                            { icon: "🔥", label: "Deadlines", value: `${doneCount}/${deadlines.length}` },
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
                    <div className="card-stat-icon indigo">📡</div>
                    <div className="card-stat-info"><h3>{dlProgress}%</h3><p>Tiến độ dự án</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">✅</div>
                    <div className="card-stat-info"><h3>{checkinPct}%</h3><p>Tỷ lệ Check-in</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon amber">⏳</div>
                    <div className="card-stat-info"><h3>{deadlines.length - doneCount}</h3><p>Việc còn lại</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon rose">⚠️</div>
                    <div className="card-stat-info"><h3>{deadlines.filter(d => d.status === 'problem').length}</h3><p>Đang có vấn đề</p></div>
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
                        {/* Tiến độ deadline */}
                        <div className="card" style={{ background: "linear-gradient(to bottom right, #ffffff, #f8fafc)" }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>🔥 Tiến độ Deadline</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{doneCount}/{deadlines.length} công việc</span>
                                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)" }}>{dlProgress}%</span>
                            </div>
                            <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
                                <div style={{
                                    height: "100%", width: `${dlProgress}%`,
                                    background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                                    borderRadius: 6, transition: "width 1s ease-out"
                                }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {deadlines.slice(0, 5).map(dl => {
                                    const due = new Date(dl.due_date);
                                    const now = new Date();
                                    const isToday = due.toDateString() === now.toDateString();
                                    const isOverdue = dl.status !== 'done' && dl.status !== 'completed' && due < now && !isToday;
                                    return (
                                        <div key={dl.id} style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "10px 14px", borderRadius: 12, border: "1px solid #f1f5f9",
                                            background: "white"
                                        }}>
                                            <span style={{ fontSize: 14 }}>{dl.status === 'done' ? "✅" : isOverdue ? "🔴" : "⏳"}</span>
                                            <span className="truncate" style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{dl.title}</span>
                                        </div>
                                    );
                                })}
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
                                    onClick={() => setDlModal(true)}>
                                    ➕ Thêm Deadline mới
                                </button>
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
                                <tr><th>Hạng mục</th><th>Hạn chót</th><th>Người thực hiện</th><th>Ghi chú</th><th>Trạng thái</th>
                                    {canManage && <th>Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {deadlines.map(dl => {
                                    const dueObj = new Date(dl.due_date);
                                    const nowObj = new Date();
                                    const isToday = dueObj.toDateString() === nowObj.toDateString();
                                    const isOverdue = dl.status !== 'done' && dl.status !== 'completed' && dueObj < nowObj && !isToday;
                                    const st = DL_STATUS_CFG[dl.status] || DL_STATUS_CFG.pending;

                                    return (
                                    <>
                                        <tr key={dl.id}>
                                            <td style={{ fontWeight: 800 }}>
                                                <button 
                                                    onClick={() => setExpandedDlId(expandedDlId === dl.id ? null : dl.id)}
                                                    style={{ 
                                                        background: "none", border: "none", padding: 0, 
                                                        color: "var(--color-primary)", fontWeight: 800, 
                                                        cursor: "pointer", textDecoration: "none",
                                                        textAlign: "left", display: "flex", alignItems: "center", gap: 6
                                                    }}>
                                                    <span>{expandedDlId === dl.id ? "▼" : "▶"}</span>
                                                    {dl.title}
                                                </button>
                                            </td>
                                            <td style={{ color: isOverdue ? "#dc2626" : "var(--text-primary)", fontWeight: isOverdue ? 700 : 400 }}>
                                                {fmtDT(dl.due_date)} {isOverdue && "⚠️"}
                                            </td>
                                            <td style={{ fontSize: 13, fontWeight: 600 }}>👤 {dl.assigned_name || "—"}</td>
                                            <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{dl.note || "—"}</td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{
                                                        display: "inline-flex", padding: "3px 10px", borderRadius: 4,
                                                        fontSize: 11, fontWeight: 700, background: st.bg, color: st.color
                                                    }}>
                                                        {isOverdue && dl.status === 'pending' ? "🔴 Trễ hạn" : st.label}
                                                    </span>
                                                    {dl.status === 'problem' && (
                                                        <button className="btn btn-sm btn-outline" 
                                                            style={{ padding: "0 6px", fontSize: 10, height: 22 }}
                                                            onClick={() => handleOpenViewProb(dl)}
                                                            title="Xem chi tiết vấn đề">👁</button>
                                                    )}
                                                </div>
                                            </td>
                                            {canManage && (
                                                <td>
                                                    <div className="actions" style={{ gap: 4 }}>
                                                        {/* Nút dành riêng cho Organizer (Người thực hiện) */}
                                                        {isOrganizer && (
                                                            <>
                                                                {dl.status === 'pending' && (
                                                                    <button className="btn btn-sm btn-outline"
                                                                        onClick={() => handleUpdateDlStatus(dl.id, 'working')}>▶ Bắt đầu</button>
                                                                )}
                                                                {(dl.status === 'working' || dl.status === 'problem' || dl.status === 'pending') && (
                                                                    <button className="btn btn-sm btn-success"
                                                                        onClick={() => handleUpdateDlStatus(dl.id, 'completed')}>✓ Hoàn thành</button>
                                                                )}
                                                                {dl.status !== 'done' && dl.status !== 'problem' && (
                                                                    <button className="btn btn-sm btn-warning"
                                                                        onClick={() => handleOpenProbModal(dl)}>⚠️ Báo lỗi</button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Nút dành riêng cho Admin (Người phê duyệt) */}
                                                        {isAdmin && (
                                                            <>
                                                                {dl.status === 'completed' && (
                                                                    <button className="btn btn-sm btn-primary"
                                                                        onClick={() => handleUpdateDlStatus(dl.id, 'done')}>⭐ Phê duyệt</button>
                                                                )}
                                                                {dl.status === 'done' && (
                                                                    <button className="btn btn-sm btn-outline"
                                                                        onClick={() => handleUpdateDlStatus(dl.id, 'working')}>↩ Hoàn tác</button>
                                                                )}
                                                            </>
                                                        )}

                                                        <button className="btn btn-danger btn-sm"
                                                            onClick={() => handleDeleteDl(dl.id)} title="Xóa">🗑</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        {expandedDlId === dl.id && (
                                            <tr key={`expanded-${dl.id}`} style={{ background: "#f8fafc" }}>
                                                <td colSpan={canManage ? 6 : 5} style={{ padding: "0 40px 16px" }}>
                                                    <div style={{
                                                        border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden",
                                                        background: "white", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                                                    }}>
                                                        <div style={{ padding: "10px 16px", background: "#f1f5f9", fontSize: 13, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                                                            <span>📋 Công việc liên quan ({tasks.filter(t => t.deadline_id === dl.id).length})</span>
                                                            <button className="btn btn-sm" onClick={() => setTab("tasks")} style={{ fontSize: 11, height: 24, padding: "0 10px" }}>👉 Xem trên bảng</button>
                                                        </div>
                                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                                            <thead>
                                                                <tr style={{ background: "white", borderBottom: "1px solid #f1f5f9" }}>
                                                                    <th style={{ textAlign: "left", padding: "8px 16px" }}>Nội dung</th>
                                                                    <th style={{ textAlign: "left", padding: "8px 16px" }}>Phân công</th>
                                                                    <th style={{ textAlign: "left", padding: "8px 16px" }}>Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {tasks.filter(t => t.deadline_id === dl.id).map(t => (
                                                                    <tr key={t.id} style={{ borderBottom: "1px dashed #f1f5f9" }}>
                                                                        <td style={{ padding: "8px 16px", fontWeight: 600 }}>{t.title}</td>
                                                                        <td style={{ padding: "8px 16px" }}>👤 {t.assigned_name || "—"}</td>
                                                                        <td style={{ padding: "8px 16px" }}>
                                                                            {(() => {
                                                                                const s = TASK_STATUS_CFG[t.status] || { label: t.status, color: "#64748b" };
                                                                                return (
                                                                                    <span style={{ 
                                                                                        fontSize: 11, padding: "2px 10px", borderRadius: 999,
                                                                                        background: s.color + "20", color: s.color, fontWeight: 700
                                                                                    }}>{s.label}</span>
                                                                                );
                                                                            })()}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {tasks.filter(t => t.deadline_id === dl.id).length === 0 && (
                                                                    <tr><td colSpan={3} style={{ textAlign: "center", padding: 12, color: "var(--text-muted)" }}>Chưa có nhiệm vụ nào được liên kết</td></tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                )}
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

                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🏢 Nhân viên tham gia (Nội bộ)</h3>
                        </div>
                        {attendees.length === 0
                            ? <div className="empty-state"><span>🏢</span><p>Chưa có nhân viên tham gia</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Phòng ban</th><th>Trạng thái</th></tr></thead>
                                <tbody>
                                    {attendees.map((a, i) => (
                                        <tr key={a.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{a.checked_in ? "✅" : "⏳"} {a.name}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{a.email}</td>
                                            <td>{a.department || "—"}</td>
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
                    staffList={staff} 
                    canManage={canManage} 
                    deadlines={deadlines} 
                    externalFilterDeadlineId={taskFilterDeadlineId}
                    onClearExternalFilter={() => setTaskFilterDeadlineId(null)}
                    onRefreshParent={loadAll}
                />
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
                        <label>Người thực hiện <span style={{ color: "red" }}>*</span></label>
                        <select className="form-control" value={dlForm.assigned_to}
                            onChange={e => setDlForm({ ...dlForm, assigned_to: e.target.value })} required>
                            <option value="">-- Chọn nhân sự --</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
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

            {/* ── Modal Báo cáo vấn đề ── */}
            <Modal title="⚠️ Báo cáo vấn đề / Thiếu kinh phí" isOpen={dlProbModal} onClose={() => setDlProbModal(false)}>
                <div className="form-group">
                    <label>Lý do / Tình trạng chi tiết</label>
                    <textarea className="form-control" rows="4"
                        placeholder="VD: Hiện tại đang thiếu khoảng 5 triệu kinh phí cho hạng mục này..."
                        value={dlProbNote} onChange={e => setDlProbNote(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDlProbModal(false)}>Hủy</button>
                    <button className="btn btn-danger" style={{ flex: 1 }}
                        onClick={() => handleUpdateDlStatus(dlProbId, 'problem', dlProbNote)}>
                        Gửi báo cáo
                    </button>
                </div>
            </Modal>
            {/* ── Modal Xem chi tiết vấn đề ── */}
            <Modal title="📝 Chi tiết vấn đề" isOpen={viewProbModal} onClose={() => setViewProbModal(false)}>
                {viewProbDl && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: 16 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                ⚠️ Hạng mục: {viewProbDl.title}
                            </p>
                            <p style={{ fontSize: 14, color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                {viewProbDl.note || "Không có nội dung mô tả chi tiết."}
                            </p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                            <span>👤 Người báo cáo: <strong>{viewProbDl.assigned_name}</strong></span>
                            <span>⏰ Hạn gốc: {fmtDT(viewProbDl.due_date)}</span>
                        </div>
                        <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={() => setViewProbModal(false)}>
                            Đã hiểu
                        </button>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}
