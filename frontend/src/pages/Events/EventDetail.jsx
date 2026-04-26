import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent } from "../../services/taskService";
import { changeStatus, createDeadline, deleteDeadline, toggleDeadline } from "../../services/eventService";
import "../../styles/global.css";
import TaskBoard from "../Tasks/TaskBoard";
import EventOverview from "./components/EventOverview";
import EventDeadlines from "./components/EventDeadlines";
import EventGuests from "./components/EventGuests";
import EventStaff from "./components/EventStaff";
import EventTimeline from "./components/EventTimeline";
import EventBudget from "./components/EventBudget";

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
            const r = await api.get(`/events/${id}/details`);
            const data = r.data;
            setEvent(data.event);
            setGuests(data.guests || []);
            setStaff(data.staff || []);
            setTimeline(data.timeline || []);
            setBudget(data.budget || { items: [], total: 0 });
            setDeadlines(data.deadlines || []);
            setTasks(data.tasks || []);
        } catch (err) { 
            setError("Lỗi khi tải dữ liệu."); 
        } finally { 
            setLoading(false); 
        }
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
        { key: "tasks", label: "📁 Nhiệm vụ" },
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
            {tab === "overview" && <EventOverview event={event} deadlines={deadlines} guests={guests} />}

            {/* ════ TAB: DEADLINES ════ */}
            {tab === "deadlines" && (
                <EventDeadlines 
                    deadlines={deadlines} 
                    canManage={canManage} 
                    handleToggleDl={handleToggleDl} 
                    handleDeleteDl={handleDeleteDl} 
                    setDlModal={setDlModal} 
                />
            )}

            {/* ════ TAB: GUESTS ════ */}
            {tab === "guests" && <EventGuests guests={guests} />}

            {/* ════ TAB: STAFF ════ */}
            {tab === "staff" && <EventStaff staff={staff} />}

            {/* ════ TAB: TIMELINE ════ */}
            {tab === "timeline" && <EventTimeline timeline={timeline} />}

            {/* ════ TAB: BUDGET ════ */}
            {tab === "budget" && <EventBudget budget={budget} event={event} />}

            {/* ════ TAB: TASKS (Kanban) ════ */}
            {tab === "tasks" && (
                <TaskBoard eventId={id} staffList={staff} canManage={canManage} />
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
