import { useState } from "react";
import Modal from "../../components/UI/Modal";
import { createTask, updateTaskStatus, deleteTask, updateTask } from "../../services/taskService";

const COLS = [
    { key: "todo", label: "Cần làm", color: "#94a3b8" },
    { key: "in_progress", label: "Đang làm", color: "#f59e0b" },
    { key: "done", label: "Đã xong", color: "#10b981" },
    { key: "cancelled", label: "Đã hủy", color: "#ef4444" },
];
const PRIORITY_CFG = {
    high: { label: "Cao", color: "#ef4444", dot: "#ef4444" },
    medium: { label: "TB", color: "#f59e0b", dot: "#f59e0b" },
    low: { label: "Thấp", color: "#10b981", dot: "#10b981" },
};

const EMPTY_FORM = { title: "", description: "", priority: "medium", due_date: "", assigned_to: "" };

export default function TaskKanban({ tasks = [], eventId, canManage, onRefresh }) {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [drag, setDrag] = useState(null); // dragged task id

    const tasksByCol = (status) => tasks.filter(t => t.status === status);

    const handleCreate = async (e) => {
        e.preventDefault(); setError(""); setSaving(true);
        try {
            await createTask({ ...form, event_id: eventId });
            setModal(false); setForm(EMPTY_FORM); onRefresh();
        } catch (err) { setError(err.response?.data?.message || "Tạo thất bại"); }
        finally { setSaving(false); }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try { await updateTaskStatus(taskId, newStatus); onRefresh(); }
        catch { alert("Cập nhật thất bại"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa nhiệm vụ này?")) return;
        try { await deleteTask(id); onRefresh(); }
        catch { alert("Xóa thất bại"); }
    };

    // Drag & drop handlers
    const onDragStart = (e, taskId) => { setDrag(taskId); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const onDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!drag) return;
        const task = tasks.find(t => t.id === drag);
        if (task && task.status !== newStatus) {
            await handleStatusChange(drag, newStatus);
        }
        setDrag(null);
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : null;
    const isOverdue = (d, status) => d && status !== "done" && status !== "cancelled" && new Date(d) < new Date();

    return (
        <div>
            {/* Header */}
            {canManage && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <button className="btn btn-primary btn-sm"
                        onClick={() => { setForm(EMPTY_FORM); setError(""); setModal(true); }}>
                        + Thêm nhiệm vụ
                    </button>
                </div>
            )}

            {/* Kanban board */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12, alignItems: "start"
            }}>
                {COLS.map(col => {
                    const colTasks = tasksByCol(col.key);
                    return (
                        <div key={col.key}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.key)}
                            style={{
                                background: "var(--bg-main)",
                                borderRadius: "var(--border-radius)",
                                padding: 10, minHeight: 200,
                                border: drag ? "2px dashed var(--border-color)" : "2px solid transparent",
                                transition: "border 0.15s",
                            }}>
                            {/* Column header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{col.label}</span>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: col.color,
                                    background: col.color + "20", padding: "1px 7px", borderRadius: 999
                                }}>{colTasks.length}</span>
                            </div>

                            {/* Tasks */}
                            {colTasks.map(task => {
                                const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
                                const overdue = isOverdue(task.due_date, task.status);
                                return (
                                    <div key={task.id}
                                        draggable={canManage}
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        style={{
                                            background: "var(--bg-card)",
                                            border: `1px solid ${overdue ? "#fca5a5" : "var(--border-color)"}`,
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                            marginBottom: 8,
                                            cursor: canManage ? "grab" : "default",
                                            opacity: task.status === "cancelled" ? 0.5 : 1,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                        }}>
                                        {/* Priority + Delete */}
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 600, color: p.color,
                                                background: p.color + "18", padding: "1px 7px", borderRadius: 999
                                            }}>{p.label}</div>
                                            {canManage && (
                                                <button onClick={() => handleDelete(task.id)}
                                                    style={{
                                                        background: "none", border: "none", color: "var(--text-muted)",
                                                        cursor: "pointer", fontSize: 12, padding: 2
                                                    }}>✕</button>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6, color: "var(--text-primary)" }}>
                                            {task.title}
                                        </div>

                                        {/* Meta */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            {task.assigned_name && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <div style={{
                                                        width: 20, height: 20, borderRadius: "50%",
                                                        background: "rgba(99,102,241,0.15)", color: "var(--color-primary)",
                                                        fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
                                                    }}>
                                                        {task.assigned_name.split(" ").slice(-1)[0]?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {task.assigned_name}
                                                    </span>
                                                </div>
                                            )}
                                            {task.due_date && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, fontFamily: "monospace",
                                                    color: overdue ? "#dc2626" : "var(--text-muted)",
                                                }}>
                                                    {overdue ? "⚠️ " : ""}{fmtDate(task.due_date)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick status change */}
                                        {canManage && task.status !== "done" && task.status !== "cancelled" && (
                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-color)" }}>
                                                <select
                                                    className="form-control"
                                                    style={{ fontSize: 11, padding: "2px 6px", height: 24 }}
                                                    value={task.status}
                                                    onChange={e => handleStatusChange(task.id, e.target.value)}>
                                                    <option value="todo">Cần làm</option>
                                                    <option value="in_progress">Đang làm</option>
                                                    <option value="done">Đã xong</option>
                                                    <option value="cancelled">Hủy</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {colTasks.length === 0 && (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: "20px 0" }}>
                                    Không có nhiệm vụ
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal tạo task */}
            <Modal title="Thêm nhiệm vụ" isOpen={modal} onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group">
                        <label>Tiêu đề *</label>
                        <input className="form-control" placeholder="VD: Chuẩn bị slides tổng kết..."
                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" rows={2}
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ưu tiên</label>
                            <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="high">🔴 Cao</option>
                                <option value="medium">🟡 Trung bình</option>
                                <option value="low">🟢 Thấp</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Hạn chót</label>
                            <input type="datetime-local" className="form-control"
                                value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                        {saving ? "Đang tạo..." : "Tạo nhiệm vụ"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
