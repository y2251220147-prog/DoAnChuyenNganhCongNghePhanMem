import { useState } from "react";
import Modal from "../../components/UI/Modal";
import { createTask, updateTaskStatus, deleteTask } from "../../services/taskService";

// ── Kanban 3 cột chuẩn theo schema (status enum: todo | in_progress | done) ──
const COLS = [
    { key: "todo",        label: "Chuẩn bị",   color: "#94a3b8", bg: "#f8fafc", icon: "📋" },
    { key: "in_progress", label: "Đang làm",   color: "#f59e0b", bg: "#fffbeb", icon: "⚡" },
    { key: "done",        label: "Hoàn thành", color: "#10b981", bg: "#f0fdf4", icon: "✅" },
];

const PRIORITY_CFG = {
    high:   { label: "Cao",       color: "#ef4444", bg: "#fef2f2" },
    medium: { label: "Trung bình", color: "#f59e0b", bg: "#fffbeb" },
    low:    { label: "Thấp",      color: "#10b981", bg: "#f0fdf4" },
};

// Format dd/mm/yyyy — chuẩn hiển thị toàn hệ thống
const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const isOverdue = (d, status) =>
    d && status !== "done" && new Date(d) < new Date();

const EMPTY_FORM = {
    title: "",
    description: "",
    priority: "medium",
    due_date: "",           // BẮT BUỘC — NOT NULL theo schema
    assign_type: "user",   // "user" | "dept"
    assigned_to: "",
    assigned_dept_id: "",
};

export default function TaskKanban({ tasks = [], eventId, canManage, onRefresh, users = [], departments = [] }) {
    const [modal, setModal]   = useState(false);
    const [form, setForm]     = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");
    const [drag, setDrag]     = useState(null);

    // Lọc task: bỏ qua task đã huỷ (is_cancelled = 1) khỏi Kanban board
    const activeTasks    = tasks.filter(t => !t.is_cancelled);
    const tasksByCol     = (status) => activeTasks.filter(t => t.status === status);
    const cancelledCount = tasks.filter(t => t.is_cancelled).length;

    // ── Tạo task ────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");

        // Deadline bắt buộc (schema: due_date NOT NULL)
        if (!form.due_date) {
            setError("Deadline (Hạn chót) là bắt buộc — vui lòng nhập ngày.");
            return;
        }

        // Mutually exclusive: chỉ set 1 trong 2 (trigger DB cũng enforce)
        const payload = {
            title:       form.title,
            description: form.description,
            priority:    form.priority,
            due_date:    form.due_date,
            event_id:    eventId,
            assigned_to:      form.assign_type === "user" ? form.assigned_to || null : null,
            assigned_dept_id: form.assign_type === "dept" ? form.assigned_dept_id || null : null,
        };

        setSaving(true);
        try {
            await createTask(payload);
            setModal(false);
            setForm(EMPTY_FORM);
            onRefresh();
        } catch (err) {
            setError(err.response?.data?.message || "Tạo nhiệm vụ thất bại");
        } finally {
            setSaving(false);
        }
    };

    // ── Đổi trạng thái (drag & drop hoặc quick-select) ─────────────────────
    const handleStatusChange = async (taskId, newStatus) => {
        // Chỉ cho phép 3 trạng thái Kanban hợp lệ
        if (!["todo", "in_progress", "done"].includes(newStatus)) return;
        try { await updateTaskStatus(taskId, newStatus); onRefresh(); }
        catch { alert("Cập nhật trạng thái thất bại"); }
    };

    // ── Huỷ task (set is_cancelled = 1, không xoá khỏi DB) ────────────────
    const handleDelete = async (id) => {
        if (!window.confirm("Xoá nhiệm vụ này khỏi hệ thống?")) return;
        try { await deleteTask(id); onRefresh(); }
        catch { alert("Xoá thất bại"); }
    };

    // ── Drag & Drop ─────────────────────────────────────────────────────────
    const onDragStart = (e, taskId) => { setDrag(taskId); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const onDrop      = async (e, newStatus) => {
        e.preventDefault();
        if (!drag) return;
        const task = activeTasks.find(t => t.id === drag);
        if (task && task.status !== newStatus) await handleStatusChange(drag, newStatus);
        setDrag(null);
    };

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {activeTasks.length} nhiệm vụ đang hoạt động
                        {cancelledCount > 0 && ` · ${cancelledCount} đã huỷ`}
                    </span>
                </div>
                {canManage && (
                    <button
                        id="btn-add-task"
                        className="btn btn-primary btn-sm"
                        onClick={() => { setForm(EMPTY_FORM); setError(""); setModal(true); }}
                    >
                        + Thêm nhiệm vụ
                    </button>
                )}
            </div>

            {/* ── Kanban Board (3 cột) ──────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
                {COLS.map(col => {
                    const colTasks = tasksByCol(col.key);
                    return (
                        <div
                            key={col.key}
                            id={`kanban-col-${col.key}`}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.key)}
                            style={{
                                background: col.bg,
                                borderRadius: 14,
                                padding: "12px 10px",
                                minHeight: 220,
                                border: drag
                                    ? `2px dashed ${col.color}60`
                                    : `2px solid ${col.color}20`,
                                transition: "border 0.15s",
                            }}
                        >
                            {/* Column header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        {col.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 800, color: col.color,
                                    background: col.color + "20", padding: "2px 9px", borderRadius: 999,
                                }}>
                                    {colTasks.length}
                                </span>
                            </div>

                            {/* Task cards */}
                            {colTasks.map(task => {
                                const p       = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
                                const overdue = isOverdue(task.due_date, task.status);
                                const assignLabel = task.assigned_name
                                    ? task.assigned_name
                                    : task.assigned_dept_name
                                        ? `🏢 ${task.assigned_dept_name}`
                                        : null;

                                return (
                                    <div
                                        key={task.id}
                                        id={`task-card-${task.id}`}
                                        draggable={canManage}
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        style={{
                                            background: "var(--bg-card, #fff)",
                                            border: `1px solid ${overdue ? "#fca5a5" : "#e5e7eb"}`,
                                            borderLeft: `3px solid ${overdue ? "#ef4444" : col.color}`,
                                            borderRadius: 10,
                                            padding: "11px 13px",
                                            marginBottom: 9,
                                            cursor: canManage ? "grab" : "default",
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                            transition: "box-shadow 0.15s, transform 0.1s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
                                    >
                                        {/* Row 1: Priority badge + Delete */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, color: p.color,
                                                background: p.bg, padding: "2px 8px", borderRadius: 999,
                                            }}>{p.label}</span>
                                            {canManage && (
                                                <button
                                                    id={`btn-delete-task-${task.id}`}
                                                    onClick={() => handleDelete(task.id)}
                                                    title="Xoá nhiệm vụ"
                                                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1 }}
                                                >✕</button>
                                            )}
                                        </div>

                                        {/* Row 2: Title */}
                                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginBottom: 8, color: "#111827" }}>
                                            {task.title}
                                        </div>

                                        {/* Row 3: Assignee */}
                                        {assignLabel && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: "50%",
                                                    background: "rgba(99,102,241,0.12)", color: "#6366f1",
                                                    fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    {task.assigned_name
                                                        ? task.assigned_name.split(" ").slice(-1)[0]?.[0]?.toUpperCase()
                                                        : "🏢"}
                                                </div>
                                                <span style={{ fontSize: 11, color: "#6b7280", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {assignLabel}
                                                </span>
                                            </div>
                                        )}

                                        {/* Row 4: Deadline — format dd/mm/yyyy */}
                                        {task.due_date && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ fontSize: 10 }}>{overdue ? "⚠️" : "📅"}</span>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                                                    color: overdue ? "#dc2626" : "#6b7280",
                                                }}>
                                                    {fmtDate(task.due_date)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Row 5: Quick status changer */}
                                        {canManage && task.status !== "done" && (
                                            <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid #f3f4f6" }}>
                                                <select
                                                    id={`task-status-${task.id}`}
                                                    className="form-control"
                                                    style={{ fontSize: 11, padding: "3px 6px", height: 26, borderRadius: 6, border: "1px solid #e5e7eb" }}
                                                    value={task.status}
                                                    onChange={e => handleStatusChange(task.id, e.target.value)}
                                                >
                                                    <option value="todo">📋 Chuẩn bị</option>
                                                    <option value="in_progress">⚡ Đang làm</option>
                                                    <option value="done">✅ Hoàn thành</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty state */}
                            {colTasks.length === 0 && (
                                <div style={{
                                    textAlign: "center", color: "#9ca3af",
                                    fontSize: 12, padding: "28px 0", userSelect: "none",
                                }}>
                                    <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }}>{col.icon}</div>
                                    Chưa có nhiệm vụ
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Modal Tạo Nhiệm Vụ ────────────────────────────────────── */}
            <Modal
                title="➕ Thêm nhiệm vụ mới"
                isOpen={modal}
                onClose={() => { setModal(false); setError(""); }}
            >
                <form onSubmit={handleCreate}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
                    )}

                    {/* Tiêu đề */}
                    <div className="form-group">
                        <label>Tiêu đề <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <input
                            id="task-title-input"
                            className="form-control"
                            placeholder="VD: Chuẩn bị slides trình chiếu..."
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Mô tả */}
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            id="task-desc-input"
                            className="form-control"
                            rows={2}
                            placeholder="Chi tiết nhiệm vụ..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Ưu tiên + Deadline */}
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ưu tiên</label>
                            <select
                                id="task-priority-select"
                                className="form-control"
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}
                            >
                                <option value="high">🔴 Cao</option>
                                <option value="medium">🟡 Trung bình</option>
                                <option value="low">🟢 Thấp</option>
                            </select>
                        </div>
                        <div className="form-group">
                            {/* Deadline BẮT BUỘC — schema: due_date NOT NULL */}
                            <label>
                                Deadline <span style={{ color: "var(--color-danger)" }}>*</span>
                                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6, fontWeight: 400 }}>
                                    (dd/mm/yyyy)
                                </span>
                            </label>
                            <input
                                id="task-due-date-input"
                                type="date"
                                className="form-control"
                                value={form.due_date}
                                onChange={e => setForm({ ...form, due_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* ── Phân bổ: Cá nhân hoặc Phòng ban ──────────────── */}
                    <div className="form-group">
                        <label>Phân bổ cho</label>
                        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                            {[
                                { v: "user", label: "👤 Nhân viên" },
                                { v: "dept", label: "🏢 Phòng ban" },
                            ].map(opt => (
                                <label
                                    key={opt.v}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        padding: "6px 14px", borderRadius: 8,
                                        background: form.assign_type === opt.v ? "rgba(99,102,241,0.1)" : "#f9fafb",
                                        border: `1px solid ${form.assign_type === opt.v ? "#6366f1" : "#e5e7eb"}`,
                                        color: form.assign_type === opt.v ? "#6366f1" : "#374151",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="assign_type"
                                        value={opt.v}
                                        checked={form.assign_type === opt.v}
                                        onChange={() => setForm({ ...form, assign_type: opt.v, assigned_to: "", assigned_dept_id: "" })}
                                        style={{ display: "none" }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>

                        {/* Dropdown Nhân viên */}
                        {form.assign_type === "user" && (
                            <select
                                id="task-assign-user-select"
                                className="form-control"
                                value={form.assigned_to}
                                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                            >
                                <option value="">— Không gán cụ thể —</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.department_name ? `(${u.department_name})` : ""}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Dropdown Phòng ban */}
                        {form.assign_type === "dept" && (
                            <select
                                id="task-assign-dept-select"
                                className="form-control"
                                value={form.assigned_dept_id}
                                onChange={e => setForm({ ...form, assigned_dept_id: e.target.value })}
                            >
                                <option value="">— Chọn phòng ban —</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        [{d.code}] {d.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <button
                        id="btn-submit-task"
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={saving}
                        style={{ marginTop: 8, height: 44, fontWeight: 700 }}
                    >
                        {saving ? "Đang tạo..." : "✅ Tạo nhiệm vụ"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
