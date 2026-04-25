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

const TABS = [
    { key: "overview", label: "📊 Tổng quan" },
    { key: "tasks", label: "📋 Công việc" },
    { key: "participants", label: "👥 Người tham gia" },
    { key: "staff", label: "👷 Ban tổ chức" },
    { key: "timeline", label: "🗓️ Lịch trình" },
    { key: "budget", label: "💰 Ngân sách" },
];

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

    // Modal Xem vấn đề & Mời khách
    const [viewProbDl, setViewProbDl] = useState(null);
    const [viewProbModal, setViewProbModal] = useState(false);
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({ guests: "", subject: "", content: "" });
    const [bulkSending, setBulkSending] = useState(false);
    
    const [staffModal, setStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({ user_id: "", role: "support" });
    const [staffSaving, setStaffSaving] = useState(false);

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
            const r = await api.get(`/tasks/event/${id}?t=${Date.now()}`);
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

    const refreshData = useCallback(async () => {
        await Promise.all([loadAll(), loadTasks()]);
    }, [loadAll, loadTasks]);

    useEffect(() => { refreshData(); fetchUsers(); }, [refreshData, fetchUsers]);

    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    const doneCount = deadlines.filter(d => d.status === 'done').length;
    const dlProgress = deadlines.length > 0 ? Math.round((doneCount / deadlines.length) * 100) : 0;
    
    // Tiến độ dựa trên nhiệm vụ (Task Progress)
    const taskDoneCount = tasks.filter(t => t.status === 'done').length;
    const taskScore = tasks.reduce((acc, t) => {
        if (t.status === "done") return acc + 100;
        if (t.status === "review" || t.status === "in_progress") return acc + 50;
        return acc;
    }, 0);
    const taskProgress = tasks.length > 0 ? Math.round(taskScore / tasks.length) : 0;
    const isAllTasksDone = tasks.length > 0 && taskDoneCount === tasks.length;

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

    const handleAssignStaff = async (e) => {
        e.preventDefault();
        if (!staffForm.user_id) return alert("Vui lòng chọn nhân viên");
        setStaffSaving(true);
        try {
            await api.post("/staff", { ...staffForm, event_id: id });
            setStaffModal(false); setStaffForm({ user_id: "", role: "support" });
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Gán nhân sự thất bại"); }
        finally { setStaffSaving(false); }
    };

    const handleRemoveStaff = async (staffId) => {
        if (!window.confirm("Loại bỏ nhân sự này khỏi sự kiện?")) return;
        try {
            await api.delete(`/staff/${staffId}`);
            loadAll();
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
    };

    const handleCompleteEvent = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn kết thúc sự kiện này? Tất cả công việc đã hoàn thành.")) return;
        try {
            await changeStatus(id, "completed");
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
                <div style={{ marginBottom: 32 }}>
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
                    {/* Nút hoàn tất sự kiện tự động khi xong việc */}
                    {canManage && event.status !== 'completed' && (
                        <div style={{ 
                            marginBottom: 24, padding: 24, borderRadius: 24, 
                            background: isAllTasksDone ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "white",
                            color: isAllTasksDone ? "white" : "inherit",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            border: isAllTasksDone ? "none" : "1px solid var(--border-color)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                <div style={{ 
                                    width: 56, height: 56, borderRadius: 16, 
                                    background: isAllTasksDone ? "rgba(255,255,255,0.2)" : "rgba(16,185,129,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
                                }}>
                                    {isAllTasksDone ? "🎉" : "📋"}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Trạng thái vận hành sự kiện</h4>
                                    <p style={{ fontSize: 14, opacity: 0.8 }}>
                                        {isAllTasksDone 
                                            ? "Tất cả nhiệm vụ đã hoàn thành! Bạn có thể đóng hồ sơ sự kiện ngay bây giờ."
                                            : `Tiến độ công việc: ${taskProgress}%. Hoàn thành tất cả ${tasks.length} nhiệm vụ để kết thúc sự kiện.`}
                                    </p>
                                </div>
                            </div>
                            <button className="btn" 
                                disabled={!isAllTasksDone}
                                onClick={handleCompleteEvent}
                                style={{ 
                                    background: isAllTasksDone ? "white" : "#f1f5f9", 
                                    color: isAllTasksDone ? "#059669" : "#94a3b8",
                                    fontWeight: 800, padding: "14px 28px", borderRadius: 16, border: "none", 
                                    cursor: isAllTasksDone ? "pointer" : "not-allowed",
                                    boxShadow: isAllTasksDone ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                                }}>
                                {isAllTasksDone ? "XÁC NHẬN HOÀN TẤT" : "CHƯA THỂ KẾT THÚC"}
                            </button>
                        </div>
                    )}

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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

            {/* ════ TAB: TASKS ════ */}
            {tab === "tasks" && (
                <TaskBoard 
                    eventId={id} 
                    staffList={staff} 
                    canManage={canManage}
                    deadlines={deadlines}
                    externalFilterDeadlineId={taskFilterDeadlineId}
                    onClearExternalFilter={() => setTaskFilterDeadlineId(null)}
                    onRefreshParent={refreshData}
                />
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>👥 Nhân sự tham gia dự án</h3>
                        {canManage && (
                            <button className="btn btn-primary btn-sm" onClick={() => setStaffModal(true)}>+ Thêm nhân sự</button>
                        )}
                    </div>
                    
                    {staff.length === 0
                        ? <div className="empty-state"><span>👥</span><p>Chưa có nhân sự được gán vào sự kiện này</p></div>
                        : <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th><th>Nhân viên</th><th>Vai trò</th><th>Công việc (Xong/Tổng)</th><th>Tiến độ</th>
                                        {canManage && <th>Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((s, i) => {
                                        const sId = s.user_id || s.id;
                                        const sTasks = tasks.filter(t => String(t.assigned_to) === String(sId));
                                        
                                        const sScore = sTasks.reduce((acc, t) => {
                                            if (t.status === "done") return acc + 100;
                                            if (t.status === "review" || t.status === "in_progress") return acc + 50;
                                            return acc;
                                        }, 0);
                                        
                                        const sDone = sTasks.filter(t => t.status === "done").length;
                                        const sPct = sTasks.length > 0 ? Math.round(sScore / sTasks.length) : 0;
                                        const roleColor = {
                                            manager: "badge-admin",
                                            marketing: "badge-warning",
                                            technical: "badge-organizer",
                                            volunteer: "badge-success",
                                        }[s.role] || "badge-default";

                                        return (
                                            <tr key={s.id}>
                                                <td>{i + 1}</td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                                                            {s.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{s.user_name}</div>
                                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.user_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${roleColor}`}>{s.role}</span></td>
                                                <td style={{ textAlign: "center", fontWeight: 700 }}>
                                                    <span style={{ color: sDone === sTasks.length && sTasks.length > 0 ? "#10b981" : "inherit" }}>
                                                        {sDone} / {sTasks.length}
                                                    </span>
                                                </td>
                                                <td style={{ minWidth: 120 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ flex: 1, height: 6, background: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
                                                            <div style={{ height: "100%", width: `${sPct}%`, background: sPct === 100 ? "#10b981" : "var(--color-primary)" }} />
                                                        </div>
                                                        <span style={{ fontSize: 11, fontWeight: 800, width: 35 }}>{sPct}%</span>
                                                    </div>
                                                </td>
                                                {canManage && (
                                                    <td>
                                                        <button className="btn btn-outline btn-sm" onClick={() => handleRemoveStaff(s.id)} style={{ color: "#dc2626", borderColor: "#fee2e2" }}>
                                                            Loại bỏ
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
            {/* ── Modal Thêm nhân sự ── */}
            <Modal title="👥 Thêm nhân sự vào dự án" isOpen={staffModal} onClose={() => setStaffModal(false)}>
                <form onSubmit={handleAssignStaff}>
                    <div className="form-group">
                        <label>Chọn nhân viên *</label>
                        <select className="form-control" 
                            value={staffForm.user_id} 
                            onChange={e => setStaffForm({ ...staffForm, user_id: e.target.value })} 
                            required>
                            <option value="">-- Chọn tài khoản --</option>
                            {users.filter(u => !staff.find(s => s.user_id === u.id)).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Vai trò trong dự án *</label>
                        <select className="form-control" 
                            value={staffForm.role} 
                            onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} 
                            required>
                            <option value="manager">Manager (Quản lý)</option>
                            <option value="marketing">Marketing (Truyền thông)</option>
                            <option value="technical">Technical (Kỹ thuật)</option>
                            <option value="support">Support (Hỗ trợ)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} disabled={staffSaving}>
                        {staffSaving ? "Đang xử lý..." : "Xác nhận thêm"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
