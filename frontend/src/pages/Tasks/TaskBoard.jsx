import { useContext, useEffect, useRef, useState } from "react";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import {
    createPhase, deletePhase, getPhases,
    createTask, updateTask, updateTaskStatus, updateTaskProgress, deleteTask,
    getComments, addComment, deleteComment, getHistory, getTaskStats
} from "../../services/taskService";

// ─── Hằng số ─────────────────────────────────────────────────
const STATUSES = [
    { key: "todo", label: "Chưa bắt đầu", color: "#94a3b8" },
    { key: "in_progress", label: "Đang làm", color: "#f59e0b" },
    { key: "review", label: "Chờ duyệt", color: "#6366f1" },
    { key: "done", label: "Hoàn thành", color: "#10b981" },
    { key: "cancelled", label: "Đã hủy", color: "#ef4444" },
];
const PRIORITY_CFG = {
    high: { label: "Cao", color: "#ef4444", bg: "#fef2f2" },
    medium: { label: "TB", color: "#f59e0b", bg: "#fffbeb" },
    low: { label: "Thấp", color: "#10b981", bg: "#f0fdf4" },
};
const STATUS_BADGE = Object.fromEntries(STATUSES.map(s => [s.key, s]));

const PHASE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
const EMPTY_TASK = {
    title: "", description: "", phase_id: "", parent_id: "",
    assigned_to: "", priority: "medium", status: "todo",
    start_date: "", due_date: "", is_milestone: false,
    estimated_h: "", progress: 0,
    estimated_budget: "", feedback_status: 'none', feedback_note: ""
};

const fmtDT = (d) => d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : null;
const isOverdue = (d, s) => d && !["done", "cancelled"].includes(s) && new Date(d) < new Date();

// ─── Avatar mini ────────────────────────────────────────────
function Avatar({ name, size = 22 }) {
    if (!name) return null;
    const init = name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() || "?";
    return (
        <div title={name} style={{
            width: size, height: size, borderRadius: "50%",
            background: "rgba(99,102,241,0.15)", color: "var(--color-primary)",
            fontSize: size * 0.45, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
        }}>{init}</div>
    );
}

// ─── Task Card (Kanban) ──────────────────────────────────────
function TaskCard({ task, canManage, onOpen, onStatusChange, onDragStart }) {
    const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
    const overdue = isOverdue(task.due_date, task.status);
    const subPct = task.subtask_count > 0
        ? Math.round((task.subtask_done / task.subtask_count) * 100) : null;

    return (
        <div
            draggable={canManage}
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={() => onOpen(task)}
            style={{
                background: "var(--bg-card)",
                border: `1.5px solid ${overdue ? "#fca5a5" : task.is_milestone ? "#fbbf24" : "var(--border-color)"}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                opacity: task.status === "cancelled" ? 0.5 : 1,
            }}>
            {/* Milestone badge */}
            {task.is_milestone && (
                <div style={{
                    fontSize: 10, fontWeight: 700, color: "#d97706",
                    background: "#fef3c7", padding: "1px 7px", borderRadius: 999,
                    display: "inline-block", marginBottom: 5
                }}>🏁 Milestone</div>
            )}

            {/* Priority */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, color: p.color,
                    background: p.bg, padding: "1px 7px", borderRadius: 999
                }}>
                    {p.label}
                </span>
                {task.phase_name && (
                    <span style={{
                        fontSize: 9, color: task.phase_color || "var(--text-muted)",
                        background: (task.phase_color || "#6366f1") + "18",
                        padding: "1px 6px", borderRadius: 999, fontWeight: 600
                    }}>
                        {task.phase_name}
                    </span>
                )}
            </div>

            {/* Title */}
            <div style={{
                fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 7,
                color: "var(--text-primary)"
            }}>
                {task.parent_id && <span style={{ color: "var(--text-muted)", marginRight: 4 }}>↳</span>}
                {task.title}
            </div>

            {/* Progress bar */}
            {task.progress > 0 && (
                <div style={{
                    height: 4, background: "var(--border-color)", borderRadius: 2,
                    overflow: "hidden", marginBottom: 7
                }}>
                    <div style={{
                        height: "100%", width: `${task.progress}%`,
                        background: task.progress === 100 ? "#10b981" : "var(--color-primary)",
                        borderRadius: 2, transition: "width 0.4s"
                    }} />
                </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={task.assigned_name} />
                    {task.comment_count > 0 && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>💬 {task.comment_count}</span>
                    )}
                    {task.subtask_count > 0 && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            ☑ {task.subtask_done}/{task.subtask_count}
                        </span>
                    )}
                </div>
                {task.due_date && (
                    <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: overdue ? "#dc2626" : "var(--text-muted)",
                        fontFamily: "monospace"
                    }}>
                        {overdue ? "⚠️ " : ""}{fmtDate(task.due_date)}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────
export default function TaskBoard({ eventId, staffList = [], canManage }) {
    const { user } = useContext(AuthContext);

    const [phases, setPhases] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("kanban"); // kanban | list | gantt

    const [drag, setDrag] = useState(null);

    // Task detail modal
    const [openTask, setOpenTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [history, setHistory] = useState([]);
    const [detailTab, setDetailTab] = useState("detail");
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);

    // Create/Edit modal
    const [formModal, setFormModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_TASK);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState("");

    // Phase modal
    const [phaseModal, setPhaseModal] = useState(false);
    const [phaseForm, setPhaseForm] = useState({ name: "", color: "#6366f1" });

    // Filter
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterAssignee, setFilterAssignee] = useState("all");
    const [search, setSearch] = useState("");

    const loadAll = async () => {
        setLoading(true);
        try {
            const [ph, tk, st] = await Promise.all([
                getPhases(eventId),
                import("../../services/taskService").then(m => m.getTasksByEvent(eventId)),
                import("../../services/taskService").then(m => m.getTaskStats(eventId)),
            ]);
            setPhases(ph.data || []);
            setTasks(tk.data || []);
            setStats(st.data || null);
        } catch {/**/ }
        finally { setLoading(false); }
    };
    useEffect(() => { loadAll(); }, [eventId]);

    // ── Kanban drag & drop ───────────────────────────────────
    const onDragStart = (e, id) => { setDrag(id); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e) => { e.preventDefault(); };
    const onDrop = async (e, status) => {
        e.preventDefault();
        if (!drag) return;
        const task = tasks.find(t => t.id === drag);
        if (task && task.status !== status) {
            setTasks(prev => prev.map(t => t.id === drag ? { ...t, status } : t));
            await updateTaskStatus(drag, status);
            await loadAll();
        }
        setDrag(null);
    };

    const handleUpdateTaskDates = async (id, newStart, newDue) => {
        try {
            await updateTask(id, { start_date: newStart, due_date: newDue, event_id: eventId });
            setTasks(prev => prev.map(t => t.id === id ? { ...t, start_date: newStart, due_date: newDue } : t));
        } catch {/**/}
    };

    // ── Open task detail ─────────────────────────────────────
    const openTaskDetail = async (task) => {
        setOpenTask(task); setDetailTab("detail");
        try {
            const [cR, hR] = await Promise.all([getComments(task.id), getHistory(task.id)]);
            setComments(cR.data || []);
            setHistory(hR.data || []);
        } catch {/**/ }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            await addComment(openTask.id, newComment);
            setNewComment("");
            const r = await getComments(openTask.id);
            setComments(r.data || []);
            setTasks(prev => prev.map(t => t.id === openTask.id ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t));
        } catch {/**/ }
        finally { setSending(false); }
    };

    const handleProgressUpdate = async (progress) => {
        try {
            await updateTaskProgress(openTask.id, progress);
            setOpenTask(prev => ({ ...prev, progress }));
            setTasks(prev => prev.map(t => t.id === openTask.id ? { ...t, progress } : t));
        } catch {/**/ }
    };

    const handleFeedbackUpdate = async (e) => {
        e.preventDefault();
        try {
            await import("../../services/taskService").then(m => m.api.patch(`/tasks/${openTask.id}/feedback`, {
                feedback_status: openTask.feedback_status,
                feedback_note: openTask.feedback_note
            }));
            alert("Đã lưu phản hồi");
            loadAll();
        } catch (err) { alert("Lưu phản hồi thất bại"); }
    };

    // ── Create / Edit task ───────────────────────────────────
    const openCreateForm = (parentId = null, phaseId = null) => {
        setEditId(null);
        setForm({ ...EMPTY_TASK, parent_id: parentId || "", phase_id: phaseId || "" });
        setFormErr(""); setFormModal(true);
    };
    const openEditForm = (task) => {
        setEditId(task.id);
        setForm({
            title: task.title || "",
            description: task.description || "",
            phase_id: task.phase_id || "",
            parent_id: task.parent_id || "",
            assigned_to: task.assigned_to || "",
            priority: task.priority || "medium",
            status: task.status || "todo",
            start_date: task.start_date?.slice(0, 16) || "",
            due_date: task.due_date?.slice(0, 16) || "",
            is_milestone: task.is_milestone || false,
            estimated_h: task.estimated_h || "",
            progress: task.progress || 0,
            estimated_budget: task.estimated_budget || "",
            feedback_status: task.feedback_status || 'none',
            feedback_note: task.feedback_note || "",
        });
        setFormErr(""); setFormModal(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault(); setFormErr(""); setSaving(true);
        try {
            if (editId) await updateTask(editId, { ...form, event_id: eventId });
            else await createTask({ ...form, event_id: eventId });
            setFormModal(false); setOpenTask(null); loadAll();
        } catch (err) { setFormErr(err.response?.data?.message || "Lưu thất bại"); }
        finally { setSaving(false); }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Xóa nhiệm vụ này?")) return;
        try { await deleteTask(id); setOpenTask(null); loadAll(); }
        catch { alert("Xóa thất bại"); }
    };

    // ── Create phase ─────────────────────────────────────────
    const handleCreatePhase = async (e) => {
        e.preventDefault();
        try { await createPhase({ ...phaseForm, event_id: eventId }); setPhaseModal(false); loadAll(); }
        catch {/**/ }
    };

    // ── Filter ───────────────────────────────────────────────
    const applyFilters = (t) => {
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterPriority !== "all" && t.priority !== filterPriority) return false;
        if (filterAssignee !== "all" && String(t.assigned_to) !== String(filterAssignee)) return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    };
    const filtered = tasks.filter(applyFilters);

    // Group by phase for kanban
    const topTasks = (status) => filtered.filter(t => t.status === status && !t.parent_id);

    if (loading) return <div className="empty-state"><span>⏳</span><p>Đang tải nhiệm vụ...</p></div>;

    return (
        <div>
            {/* ── Stats bar ── */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 28 }}>
                    {[
                        { label: "Tổng số", value: stats.total || 0, color: "#64748b", bg: "#f8fafc" },
                        { label: "Đang xử lý", value: stats.in_progress || 0, color: "#f59e0b", bg: "#fffbeb" },
                        { label: "Chờ kiểm duyệt", value: stats.review || 0, color: "#6366f1", bg: "#f5f3ff" },
                        { label: "Đã hoàn tất", value: stats.done || 0, color: "#10b981", bg: "#f0fdf4" },
                        { label: "Quá hạn ⚠️", value: stats.overdue || 0, color: "#ef4444", bg: "#fef2f2" },
                    ].map(s => (
                        <div key={s.label} className="card-stat" style={{ 
                            background: s.bg, border: "1px solid rgba(0,0,0,0.04)", 
                            padding: "20px 24px", borderRadius: 16, display: "flex", 
                            flexDirection: "column", alignItems: "flex-start", gap: 4
                        }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                        </div>
                    ))}
                    {stats.avg_progress > 0 && (
                        <div className="card-stat" style={{ 
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", 
                            padding: "20px 24px", borderRadius: 16, display: "flex", 
                            flexDirection: "column", alignItems: "flex-start", gap: 4
                        }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{stats.avg_progress}%</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tiến độ trung bình</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div style={{ 
                display: "flex", gap: 12, marginBottom: 24, padding: "16px 24px", 
                background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", 
                boxShadow: "var(--shadow-sm)", flexWrap: "wrap", alignItems: "center" 
            }}>
                {/* View mode */}
                <div style={{
                    display: "flex", gap: 4, background: "#f1f5f9",
                    borderRadius: 12, padding: 4
                }}>
                    {[
                        { key: "kanban", icon: "▦", label: "Board" },
                        { key: "list", icon: "≡", label: "List" },
                        { key: "gantt", icon: "▬", label: "Timeline" },
                    ].map(v => (
                        <button key={v.key}
                            className={`btn btn-sm ${viewMode === v.key ? "btn-primary" : ""}`}
                            style={{ 
                                padding: "6px 14px", border: "none", borderRadius: 8, 
                                background: viewMode === v.key ? "var(--color-primary)" : "transparent",
                                color: viewMode === v.key ? "#fff" : "var(--text-secondary)",
                                fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6
                            }}
                            onClick={() => setViewMode(v.key)}>
                            <span style={{ fontSize: 18 }}>{v.icon}</span> {v.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 400 }}>
                    {/* Filters */}
                    <select className="form-control" style={{ maxWidth: 160, borderRadius: 12, fontSize: 13, height: 44, border: "1px solid #e2e8f0" }}
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">Mọi trạng thái</option>
                        {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <select className="form-control" style={{ maxWidth: 160, borderRadius: 12, fontSize: 13, height: 44, border: "1px solid #e2e8f0" }}
                        value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                        <option value="all">Mọi độ ưu tiên</option>
                        <option value="high">🔴 Ưu tiên Cao</option>
                        <option value="medium">🟡 Ưu tiên Trung bình</option>
                        <option value="low">🟢 Ưu tiên Thấp</option>
                    </select>
                    <input className="form-control" placeholder="🔍 Nhập từ khóa tìm nhiệm vụ..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, borderRadius: 12, fontSize: 13, height: 44, border: "1px solid #e2e8f0", paddingLeft: 16 }} />
                </div>

                {canManage && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-outline"
                            style={{ borderRadius: 12, height: 44, fontWeight: 700, padding: "0 20px" }}
                            onClick={() => { setPhaseForm({ name: "", color: "#6366f1" }); setPhaseModal(true); }}>
                            ⚙️ Quản lý Giai đoạn
                        </button>
                        <button className="btn btn-primary" 
                            style={{ borderRadius: 12, height: 44, fontWeight: 700, padding: "0 24px", boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}
                            onClick={() => openCreateForm()}>
                            + THÊM NHIỆM VỤ
                        </button>
                    </div>
                )}
            </div>

            {/* ════ VIEW: KANBAN ════ */}
            {viewMode === "kanban" && (
                <div style={{ 
                    display: "grid", gridTemplateColumns: "repeat(5, minmax(280px, 1fr))", 
                    gap: 16, alignItems: "start", height: "calc(100vh - 350px)", minHeight: 600
                }}>
                    {STATUSES.map(col => {
                        const colTasks = topTasks(col.key);
                        return (
                            <div key={col.key}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, col.key)}
                                style={{
                                    background: "#f1f5f9", borderRadius: 20,
                                    padding: 16, height: "100%", overflowY: "auto",
                                    border: drag ? "2px dashed #94a3b8" : "2px solid transparent",
                                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                                }}>
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    marginBottom: 20, padding: "0 4px", position: "sticky", top: 0, 
                                    background: "#f1f5f9", zIndex: 1, paddingBottom: 12
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color, boxShadow: `0 0 10px ${col.color}` }} />
                                        <span style={{ fontSize: 14, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.label}</span>
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: 900, color: col.color,
                                        background: "#fff", padding: "4px 12px", borderRadius: 10, boxShadow: "var(--shadow-sm)"
                                    }}>
                                        {colTasks.length}
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {colTasks.map(task => (
                                        <TaskCard key={task.id} task={task} canManage={canManage}
                                            onOpen={openTaskDetail} onStatusChange={() => { }}
                                            onDragStart={onDragStart} />
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div style={{ 
                                            padding: 40, textAlign: "center", color: "#94a3b8", 
                                            fontSize: 13, background: "rgba(255,255,255,0.4)", 
                                            borderRadius: 16, border: "2px dashed #e2e8f0" 
                                        }}>
                                            Trống
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ════ VIEW: LIST (Phân cấp theo giai đoạn) ════ */}
            {viewMode === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Tasks không có giai đoạn */}
                    {filtered.filter(t => !t.phase_id && !t.parent_id).length > 0 && (
                        <PhaseSection
                            phase={{ id: null, name: "Không có giai đoạn", color: "#94a3b8" }}
                            tasks={filtered.filter(t => !t.phase_id)}
                            canManage={canManage}
                            onOpen={openTaskDetail}
                            onEdit={openEditForm}
                            onDelete={handleDeleteTask}
                            onAddSub={openCreateForm}
                        />
                    )}
                    {phases.map(phase => (
                        <PhaseSection key={phase.id} phase={phase}
                            tasks={filtered.filter(t => t.phase_id === phase.id)}
                            canManage={canManage}
                            onOpen={openTaskDetail}
                            onEdit={openEditForm}
                            onDelete={handleDeleteTask}
                            onAddSub={(pid) => openCreateForm(pid, phase.id)}
                            onAddTask={() => openCreateForm(null, phase.id)}
                        />
                    ))}
                </div>
            )}

            {/* ════ VIEW: GANTT ════ */}
            {viewMode === "gantt" && (
                <GanttChart 
                    tasks={filtered.filter(t => t.start_date || t.due_date)} 
                    onUpdateDates={handleUpdateTaskDates}
                    canManage={canManage}
                />
            )}

            {/* ════ MODAL: Task Detail ════ */}
            {openTask && (
                <Modal
                    title={openTask.title}
                    isOpen={!!openTask}
                    onClose={() => setOpenTask(null)}
                    maxWidth="680px">
                    {/* Status + Priority row */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {STATUSES.map(s => (
                            <button key={s.key}
                                onClick={async () => {
                                    try {
                                        await updateTaskStatus(openTask.id, s.key);
                                        setOpenTask(p => ({ ...p, status: s.key }));
                                        loadAll();
                                    } catch {/**/ }
                                }}
                                style={{
                                    padding: "4px 12px", borderRadius: 999, fontSize: 11,
                                    fontWeight: 600, border: "none", cursor: "pointer",
                                    background: openTask.status === s.key ? s.color : s.color + "20",
                                    color: openTask.status === s.key ? "white" : s.color,
                                    transition: "all 0.15s"
                                }}>
                                {s.label}
                            </button>
                        ))}
                        {canManage && (
                            <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}
                                onClick={() => { setOpenTask(null); openEditForm(openTask); }}>
                                ✎ Sửa
                            </button>
                        )}
                    </div>

                    {/* Progress slider */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Tiến độ</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)" }}>
                                {openTask.progress || 0}%
                            </span>
                        </div>
                        <input type="range" min={0} max={100} step={5}
                            value={openTask.progress || 0}
                            onChange={e => handleProgressUpdate(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "var(--color-primary)" }} />
                        <div style={{
                            height: 6, background: "var(--border-color)", borderRadius: 3,
                            overflow: "hidden", marginTop: 4
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${openTask.progress || 0}%`,
                                background: `${openTask.progress === 100 ? "#10b981" : "var(--color-primary)"}`,
                                transition: "width 0.3s"
                            }} />
                        </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid-2" style={{ marginBottom: 16, gap: 10 }}>
                        {[
                            { label: "Người phụ trách", value: openTask.assigned_name || "Chưa giao" },
                            { label: "Ưu tiên", value: PRIORITY_CFG[openTask.priority]?.label || "—" },
                            { label: "Bắt đầu", value: fmtDT(openTask.start_date) || "—" },
                            {
                                label: "Hạn chót", value: fmtDT(openTask.due_date) || "—",
                                style: isOverdue(openTask.due_date, openTask.status) ? { color: "#dc2626", fontWeight: 700 } : {}
                            },
                            { label: "Giai đoạn", value: openTask.phase_name || "—" },
                            { label: "Ước tính (giờ)", value: openTask.estimated_h ? `${openTask.estimated_h}h` : "—" },
                            { label: "Dự trù ngân sách", value: openTask.estimated_budget ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(openTask.estimated_budget) : "—" },
                        ].map(row => (
                            <div key={row.label} style={{ padding: "8px 12px", background: "var(--bg-main)", borderRadius: 6 }}>
                                <div style={{
                                    fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
                                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3
                                }}>{row.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, ...row.style }}>{row.value}</div>
                            </div>
                        ))}
                    </div>

                    {openTask.description && (
                        <div style={{
                            padding: "10px 14px", background: "var(--bg-main)", borderRadius: 8,
                            fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16
                        }}>
                            {openTask.description}
                        </div>
                    )}

                    {/* Feedback section - Only visible to manager/admin or if has note */}
                    {(canManage || openTask.feedback_note) && (
                        <div style={{
                            padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8,
                            marginBottom: 16, background: openTask.feedback_status === 'approved' ? "#F0FDF4" : openTask.feedback_status === 'rejected' ? "#FEF2F2" : "#F8FAFF"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>💬 Phản hồi của quản lý</span>
                                {canManage ? (
                                    <select 
                                        value={openTask.feedback_status} 
                                        onChange={e => setOpenTask({...openTask, feedback_status: e.target.value})}
                                        style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="none">Chưa phản hồi</option>
                                        <option value="approved">Duyệt (OK)</option>
                                        <option value="rejected">Cần sửa lại</option>
                                    </select>
                                ) : (
                                    <span style={{ 
                                        fontSize: 11, fontWeight: 700, 
                                        color: openTask.feedback_status === 'approved' ? "#059669" : openTask.feedback_status === 'rejected' ? "#DC2626" : "#64748B"
                                    }}>
                                        {openTask.feedback_status === 'approved' ? "Đã duyệt" : openTask.feedback_status === 'rejected' ? "Cần sửa" : "Chờ phản hồi"}
                                    </span>
                                )}
                            </div>
                            {canManage ? (
                                <>
                                    <textarea 
                                        className="form-control" 
                                        rows="2" 
                                        placeholder="Nhập nhận xét, góp ý..."
                                        style={{ fontSize: 12 }}
                                        value={openTask.feedback_note || ""} 
                                        onChange={e => setOpenTask({...openTask, feedback_note: e.target.value})}
                                    />
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        style={{ marginTop: 8, width: "100%" }}
                                        onClick={handleFeedbackUpdate}
                                    >
                                        Lưu phản hồi
                                    </button>
                                </>
                            ) : (
                                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                                    {openTask.feedback_note || "Chưa có nhận xét."}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Detail tabs */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
                        {[
                            { key: "comments", label: `💬 Bình luận (${comments.length})` },
                            { key: "history", label: `📋 Lịch sử (${history.length})` },
                        ].map(t => (
                            <button key={t.key}
                                className={`btn btn-sm ${detailTab === t.key ? "btn-primary" : "btn-ghost"}`}
                                onClick={() => setDetailTab(t.key)}>{t.label}</button>
                        ))}
                    </div>

                    {/* Comments */}
                    {detailTab === "comments" && (
                        <div>
                            <div style={{
                                maxHeight: 240, overflowY: "auto", marginBottom: 12,
                                display: "flex", flexDirection: "column", gap: 8
                            }}>
                                {comments.length === 0 && (
                                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 16 }}>
                                        Chưa có bình luận nào
                                    </div>
                                )}
                                {comments.map(c => (
                                    <div key={c.id} style={{
                                        display: "flex", gap: 8, alignItems: "flex-start",
                                        padding: "8px 0", borderBottom: "1px solid var(--border-color)"
                                    }}>
                                        <Avatar name={c.user_name} size={26} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700 }}>{c.user_name}</span>
                                                {c.type !== "comment" && (
                                                    <span style={{
                                                        fontSize: 10, color: "var(--text-muted)",
                                                        background: "var(--bg-main)", padding: "1px 6px", borderRadius: 999
                                                    }}>
                                                        {c.type === "status_change" ? "🔄 Đổi trạng thái" : "📝"}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
                                                    {fmtDT(c.created_at)}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                                {c.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input className="form-control" style={{ flex: 1 }}
                                    placeholder="Thêm bình luận..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} />
                                <button className="btn btn-primary btn-sm" disabled={sending || !newComment.trim()}
                                    onClick={handleSendComment}>{sending ? "..." : "Gửi"}</button>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {detailTab === "history" && (
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                            {history.length === 0
                                ? <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 16 }}>Chưa có lịch sử</div>
                                : history.map(h => (
                                    <div key={h.id} style={{
                                        display: "flex", gap: 10, padding: "8px 0",
                                        borderBottom: "1px solid var(--border-color)", alignItems: "flex-start"
                                    }}>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)",
                                            marginTop: 6, flexShrink: 0
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{h.user_name}</span>
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                                {" "}{h.action === "status_change" ? "đổi trạng thái" :
                                                    h.action === "assign" ? "giao cho" :
                                                        h.action === "progress" ? "cập nhật tiến độ" :
                                                            h.action === "due_date" ? "đổi deadline" :
                                                                h.action === "created" ? "tạo nhiệm vụ" : h.action}
                                            </span>
                                            {h.old_value && h.new_value && (
                                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                    {" "}({h.old_value} → <strong style={{ color: "var(--text-primary)" }}>{h.new_value}</strong>)
                                                </span>
                                            )}
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                                {fmtDT(h.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </Modal>
            )}

            {/* ════ MODAL: Create/Edit Task ════ */}
            <Modal title={editId ? "Chỉnh sửa nhiệm vụ" : "Thêm nhiệm vụ mới"}
                isOpen={formModal} onClose={() => setFormModal(false)} maxWidth="560px">
                <form onSubmit={handleSaveTask}>
                    {formErr && <div className="alert alert-error">{formErr}</div>}
                    <div className="form-group">
                        <label>Tiêu đề *</label>
                        <input className="form-control" value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Giai đoạn</label>
                            <select className="form-control" value={form.phase_id}
                                onChange={e => setForm({ ...form, phase_id: e.target.value })}>
                                <option value="">Không có</option>
                                {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nhiệm vụ cha</label>
                            <select className="form-control" value={form.parent_id}
                                onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                                <option value="">Không có</option>
                                {tasks.filter(t => !t.parent_id && t.id !== editId)
                                    .map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Người phụ trách</label>
                            <select className="form-control" value={form.assigned_to}
                                onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                                <option value="">Chưa giao</option>
                                {staffList.map(s => <option key={s.user_id || s.id} value={s.user_id || s.id}>{s.user_name || s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ưu tiên</label>
                            <select className="form-control" value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="high">🔴 Cao</option>
                                <option value="medium">🟡 Trung bình</option>
                                <option value="low">🟢 Thấp</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ngày bắt đầu</label>
                            <input type="datetime-local" className="form-control" value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Hạn chót</label>
                            <input type="datetime-local" className="form-control" value={form.due_date}
                                onChange={e => setForm({ ...form, due_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ước tính (giờ)</label>
                            <input type="number" step="0.5" min="0" className="form-control" value={form.estimated_h}
                                onChange={e => setForm({ ...form, estimated_h: e.target.value })} placeholder="8" />
                        </div>
                        <div className="form-group">
                            <label>Dự trù ngân sách (VND)</label>
                            <input type="number" min="0" className="form-control" value={form.estimated_budget}
                                onChange={e => setForm({ ...form, estimated_budget: e.target.value })} placeholder="500000" />
                        </div>
                    </div>
                    <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <input type="checkbox" id="milestone" checked={form.is_milestone}
                            onChange={e => setForm({ ...form, is_milestone: e.target.checked })} />
                        <label htmlFor="milestone" style={{ cursor: "pointer", fontWeight: 600 }}>🏁 Milestone (Mốc quan trọng)</label>
                    </div>
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" rows={2} value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                        {saving ? "Đang lưu..." : (editId ? "Lưu thay đổi" : "Tạo nhiệm vụ")}
                    </button>
                </form>
            </Modal>

            {/* ════ MODAL: Phase ════ */}
            <Modal title="Thêm giai đoạn" isOpen={phaseModal} onClose={() => setPhaseModal(false)}>
                <form onSubmit={handleCreatePhase}>
                    <div className="form-group">
                        <label>Tên giai đoạn *</label>
                        <input className="form-control" placeholder="VD: Chuẩn bị, Triển khai..."
                            value={phaseForm.name} onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Màu</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {PHASE_COLORS.map(c => (
                                <div key={c} onClick={() => setPhaseForm({ ...phaseForm, color: c })}
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, background: c,
                                        cursor: "pointer", border: `3px solid ${phaseForm.color === c ? "#0f172a" : "transparent"}`,
                                    }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Tạo giai đoạn</button>
                </form>
            </Modal>
        </div>
    );
}

// ─── Phase Section (List view) ──────────────────────────────
function PhaseSection({ phase, tasks, canManage, onOpen, onEdit, onDelete, onAddSub, onAddTask }) {
    const [collapsed, setCollapsed] = useState(false);
    const topTasks = tasks.filter(t => !t.parent_id);
    const done = topTasks.filter(t => t.status === "done").length;
    const pct = topTasks.length > 0 ? Math.round((done / topTasks.length) * 100) : 0;

    return (
        <div>
            {/* Phase header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer" }}
                onClick={() => setCollapsed(!collapsed)}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: phase.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{phase.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {done}/{topTasks.length} hoàn thành
                </span>
                <div style={{ flex: 1, height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: phase.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: phase.color }}>{pct}%</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{collapsed ? "▶" : "▼"}</span>
                {canManage && onAddTask && (
                    <button className="btn btn-outline btn-sm"
                        onClick={e => { e.stopPropagation(); onAddTask(); }}
                        style={{ fontSize: 11, padding: "2px 8px" }}>+ Thêm</button>
                )}
            </div>

            {!collapsed && (
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nhiệm vụ</th><th>Ưu tiên</th><th>Người phụ trách</th>
                                <th>Hạn chót</th><th>Tiến độ</th><th>Trạng thái</th>
                                {canManage && <th>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {topTasks.map(task => {
                                const overdue = isOverdue(task.due_date, task.status);
                                const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
                                const s = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
                                const subtasks = tasks.filter(t => t.parent_id === task.id);
                                return (
                                    <>
                                        <tr key={task.id} style={{ cursor: "pointer" }} onClick={() => onOpen(task)}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    {task.is_milestone && <span style={{ fontSize: 12 }}>🏁</span>}
                                                    <span style={{ fontWeight: 600 }}>{task.title}</span>
                                                    {task.comment_count > 0 && (
                                                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>💬{task.comment_count}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: p.color,
                                                    background: p.bg, padding: "2px 8px", borderRadius: 999
                                                }}>{p.label}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Avatar name={task.assigned_name} />
                                                    <span style={{ fontSize: 12 }}>{task.assigned_name || "—"}</span>
                                                </div>
                                            </td>
                                            <td style={{
                                                fontSize: 12, color: overdue ? "#dc2626" : "var(--text-primary)",
                                                fontWeight: overdue ? 700 : 400
                                            }}>
                                                {overdue && "⚠️ "}{fmtDate(task.due_date) || "—"}
                                            </td>
                                            <td style={{ minWidth: 100 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{
                                                        flex: 1, height: 5, background: "var(--border-color)",
                                                        borderRadius: 3, overflow: "hidden"
                                                    }}>
                                                        <div style={{
                                                            height: "100%", width: `${task.progress || 0}%`,
                                                            background: task.progress === 100 ? "#10b981" : "var(--color-primary)"
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, minWidth: 28,
                                                        color: "var(--text-muted)"
                                                    }}>{task.progress || 0}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: s.color,
                                                    background: s.color + "20", padding: "2px 8px", borderRadius: 999
                                                }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td onClick={e => e.stopPropagation()}>
                                                    <div className="actions">
                                                        <button className="btn btn-outline btn-sm"
                                                            onClick={() => onEdit(task)}>✎</button>
                                                        <button className="btn btn-outline btn-sm"
                                                            onClick={() => onAddSub && onAddSub(task.id)}
                                                            title="Thêm công việc con">+↳</button>
                                                        <button className="btn btn-danger btn-sm"
                                                            onClick={() => onDelete(task.id)}>🗑</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        {/* Sub-tasks */}
                                        {subtasks.map(sub => {
                                            const sp = PRIORITY_CFG[sub.priority] || PRIORITY_CFG.medium;
                                            const ss = STATUS_BADGE[sub.status] || STATUS_BADGE.todo;
                                            const sOverdue = isOverdue(sub.due_date, sub.status);
                                            return (
                                                <tr key={sub.id} style={{ background: "rgba(0,0,0,0.01)", cursor: "pointer" }}
                                                    onClick={() => onOpen(sub)}>
                                                    <td style={{ paddingLeft: 32 }}>
                                                        <span style={{ color: "var(--text-muted)", marginRight: 6 }}>↳</span>
                                                        <span style={{ fontSize: 13 }}>{sub.title}</span>
                                                    </td>
                                                    <td><span style={{
                                                        fontSize: 10, color: sp.color, background: sp.bg,
                                                        padding: "1px 6px", borderRadius: 999
                                                    }}>{sp.label}</span></td>
                                                    <td style={{ fontSize: 12 }}>{sub.assigned_name || "—"}</td>
                                                    <td style={{ fontSize: 11, color: sOverdue ? "#dc2626" : "var(--text-muted)" }}>
                                                        {fmtDate(sub.due_date) || "—"}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                            <div style={{ width: 60, height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${sub.progress || 0}%`, background: "var(--color-primary)" }} />
                                                            </div>
                                                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub.progress || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td><span style={{
                                                        fontSize: 10, color: ss.color, background: ss.color + "20",
                                                        padding: "1px 7px", borderRadius: 999
                                                    }}>{ss.label}</span></td>
                                                    {canManage && (
                                                        <td onClick={e => e.stopPropagation()}>
                                                            <div className="actions">
                                                                <button className="btn btn-outline btn-sm" onClick={() => onEdit(sub)}>✎</button>
                                                                <button className="btn btn-danger btn-sm" onClick={() => onDelete(sub.id)}>🗑</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </>
                                );
                            })}
                            {topTasks.length === 0 && (
                                <tr><td colSpan={canManage ? 7 : 6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 16 }}>
                                    Chưa có nhiệm vụ trong giai đoạn này
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Gantt Chart (CSS-based) ─────────────────────────────────
function GanttChart({ tasks, onUpdateDates, canManage }) {
    const [dragging, setDragging] = useState(null);

    if (tasks.length === 0)
        return <div className="empty-state"><span>📅</span><p>Chưa có nhiệm vụ nào có ngày tháng để hiển thị Gantt</p></div>;

    const dates = tasks.flatMap(t => [t.start_date, t.due_date].filter(Boolean)).map(d => new Date(d));
    const minD = new Date(Math.min(...dates));
    const maxD = new Date(Math.max(...dates));
    minD.setDate(minD.getDate() - 1);
    maxD.setDate(maxD.getDate() + 1);
    const totalDays = Math.ceil((maxD - minD) / 86400000) + 1;
    const today = new Date();

    const getPos = (d) => Math.max(0, Math.ceil((new Date(d) - minD) / 86400000));
    const getWidth = (s, e) => Math.max(1, Math.ceil((new Date(e || s) - new Date(s)) / 86400000) + 1);

    // Generate week labels
    const weeks = [];
    let cur = new Date(minD);
    while (cur <= maxD) {
        weeks.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
    }

    const CELL = 28; // px per day

    const handleMouseDown = (e, task) => {
        if (!canManage) return;
        setDragging({
            taskId: task.id,
            initialStart: task.start_date,
            initialDue: task.due_date,
            startX: e.clientX,
            currentX: e.clientX
        });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        setDragging(prev => ({ ...prev, currentX: e.clientX }));
    };

    const handleMouseUp = () => {
        if (!dragging) return;
        const diffPx = dragging.currentX - dragging.startX;
        const diffDays = Math.round(diffPx / CELL);
        if (diffDays !== 0) {
            const shiftDate = (dateStr, days) => {
                if (!dateStr) return null;
                const d = new Date(dateStr);
                d.setDate(d.getDate() + days);
                return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            };
            const newStart = shiftDate(dragging.initialStart, diffDays);
            const newDue = shiftDate(dragging.initialDue, diffDays);
            onUpdateDates(dragging.taskId, newStart, newDue);
        }
        setDragging(null);
    };

    return (
        <div style={{ overflowX: "auto", userSelect: dragging ? "none" : "auto" }}
            onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div style={{ minWidth: totalDays * CELL + 200 }}>
                {/* Header */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: 4 }}>
                    <div style={{
                        width: 200, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                        padding: "4px 8px"
                    }}>Nhiệm vụ</div>
                    <div style={{ position: "relative", flex: 1, height: 28 }}>
                        {weeks.map((w, i) => (
                            <div key={i} style={{
                                position: "absolute", left: getPos(w) * CELL,
                                fontSize: 9, color: "var(--text-muted)", fontWeight: 600,
                                top: 8, whiteSpace: "nowrap"
                            }}>
                                {w.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                            </div>
                        ))}
                        {/* Today line */}
                        {today >= minD && today <= maxD && (
                            <div style={{
                                position: "absolute", left: getPos(today) * CELL + CELL / 2,
                                top: 0, bottom: 0, width: 1.5, background: "#ef4444", opacity: 0.7
                            }} />
                        )}
                    </div>
                </div>
                {/* Rows */}
                {tasks.map(task => {
                    const start = task.start_date || task.due_date;
                    const end = task.due_date || task.start_date;
                    const left = getPos(start);
                    const width = getWidth(start, end);
                    const overdue = isOverdue(task.due_date, task.status);
                    const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;

                    const barColor = task.status === "done" ? "#10b981"
                        : overdue ? "#ef4444"
                            : task.is_milestone ? "#f59e0b"
                                : "var(--color-primary)";

                    return (
                        <div key={task.id} style={{
                            display: "flex", alignItems: "center",
                            borderBottom: "1px solid var(--border-color)", height: 34
                        }}>
                            {/* Label */}
                            <div style={{
                                width: 200, flexShrink: 0, padding: "0 8px",
                                fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                            }}>
                                {task.parent_id && <span style={{ color: "var(--text-muted)", marginRight: 4 }}>↳</span>}
                                {task.is_milestone && "🏁 "}
                                {task.title}
                            </div>
                            {/* Bar area */}
                            <div style={{ flex: 1, position: "relative", height: "100%" }}>
                                {/* Grid lines */}
                                {Array.from({ length: totalDays }).map((_, i) => (
                                    <div key={i} style={{
                                        position: "absolute", left: i * CELL, top: 0, bottom: 0, width: 1,
                                        background: "var(--border-color)", opacity: 0.3
                                    }} />
                                ))}
                                {/* Today highlight */}
                                {today >= minD && today <= maxD && (
                                    <div style={{
                                        position: "absolute", left: getPos(today) * CELL,
                                        top: 0, bottom: 0, width: CELL,
                                        background: "rgba(239,68,68,0.05)"
                                    }} />
                                )}
                                {/* Task bar */}
                                <div style={{
                                    position: "absolute",
                                    left: left * CELL + 2,
                                    width: width * CELL - 4,
                                    height: 18, top: 8,
                                    background: barColor,
                                    borderRadius: task.is_milestone ? 0 : 4,
                                    transform: task.is_milestone ? "rotate(45deg)" : "none",
                                    opacity: task.status === "cancelled" ? 0.4 : 0.85,
                                    display: "flex", alignItems: "center", overflow: "hidden",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    cursor: canManage ? "ew-resize" : "default"
                                }} onMouseDown={(e) => handleMouseDown(e, task)}>
                                    {/* Progress fill */}
                                    {task.progress > 0 && !task.is_milestone && (
                                        <div style={{
                                            position: "absolute", left: 0, top: 0, bottom: 0,
                                            width: `${task.progress}%`,
                                            background: "rgba(255,255,255,0.25)",
                                        }} />
                                    )}
                                    <span style={{
                                        fontSize: 9, color: "white", fontWeight: 600,
                                        paddingLeft: 4, whiteSpace: "nowrap", overflow: "hidden",
                                        textOverflow: "ellipsis", position: "relative"
                                    }}>
                                        {width > 3 ? task.title : ""}
                                    </span>
                                </div>
                                {dragging?.taskId === task.id && (
                                    <div style={{
                                        position: "absolute",
                                        left: (left + Math.round((dragging.currentX - dragging.startX) / CELL)) * CELL + 2,
                                        width: width * CELL - 4,
                                        height: 18, top: 8,
                                        background: barColor,
                                        borderRadius: task.is_milestone ? 0 : 4,
                                        transform: task.is_milestone ? "rotate(45deg)" : "none",
                                        opacity: 0.5,
                                        display: "flex", alignItems: "center", overflow: "hidden",
                                        boxShadow: "0 0 0 2px var(--color-primary)", zIndex: 10
                                    }}>
                                        <span style={{ fontSize: 9, color: "white", fontWeight: 600, paddingLeft: 4 }}>
                                            {width > 3 ? task.title : ""}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
                <span style={{ color: "#ef4444", marginRight: 12 }}>■ Trễ hạn</span>
                <span style={{ color: "#10b981", marginRight: 12 }}>■ Hoàn thành</span>
                <span style={{ color: "#f59e0b", marginRight: 12 }}>■ Milestone</span>
                <span style={{ color: "var(--color-primary)" }}>■ Đang làm</span>
            </div>
        </div>
    );
}
