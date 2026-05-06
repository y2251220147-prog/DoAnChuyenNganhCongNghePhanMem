import { useState, useEffect } from "react";
import Modal from "../../components/UI/Modal";
import { createTask, updateTaskStatus, deleteTask } from "../../services/taskService";
import { getDepartments } from "../../services/departmentService";
import { getAttendeesByEvent } from "../../services/attendeeService";
import { formatDate, isOverdue, daysUntilDeadline } from "../../utils/dateUtils";

// 3 cột Kanban chuẩn
const COLS = [
    { key: "todo", label: "Chuẩn bị", color: "#94a3b8", icon: "📋" },
    { key: "in_progress", label: "Đang làm", color: "#f59e0b", icon: "⚡" },
    { key: "done", label: "Hoàn thành", color: "#10b981", icon: "✅" },
];

const PRIORITY_CFG = {
    high: { label: "Cao", color: "#ef4444", bg: "#fef2f2" },
    medium: { label: "Trung bình", color: "#f59e0b", bg: "#fffbeb" },
    low: { label: "Thấp", color: "#10b981", bg: "#f0fdf4" },
};

const EMPTY_FORM = {
    title: "", description: "", priority: "medium",
    due_date: "", assigned_to: "", assigned_department_id: ""
};

export default function TaskKanban({ tasks = [], eventId, canManage, onRefresh, staffList = [] }) {
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [drag, setDrag] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [attendeeIds, setAttendeeIds] = useState(new Set());

    // Load departments và attendees để filter
    useEffect(() => {
        getDepartments().then(r => setDepartments(r.data || [])).catch(() => { });
        if (eventId) {
            getAttendeesByEvent(eventId)
                .then(r => setAttendeeIds(new Set((r.data || []).map(a => a.user_id).filter(Boolean))))
                .catch(() => { });
        }
    }, [eventId]);

    const tasksByCol = (status) => tasks.filter(t => t.status === status);

    // Staff có thể được gán task (loại bỏ những người đã là attendee)
    const assignableStaff = staffList.filter(s => !attendeeIds.has(s.user_id || s.id));

    const handleCreate = async (e) => {
        e.preventDefault(); setError(""); setSaving(true);
        try {
            if (!form.due_date) { setError("Deadline là bắt buộc khi tạo nhiệm vụ"); setSaving(false); return; }
            await createTask({ ...form, event_id: eventId });
            setModal(false); setForm(EMPTY_FORM); onRefresh();
        } catch (err) { setError(err.response?.data?.message || "Tạo nhiệm vụ thất bại"); }
        finally { setSaving(false); }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try { await updateTaskStatus(taskId, newStatus); onRefresh(); }
        catch { alert("Cập nhật trạng thái thất bại"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa nhiệm vụ này?")) return;
        try { await deleteTask(id); onRefresh(); }
        catch { alert("Xóa thất bại"); }
    };

    // Drag & Drop
    const onDragStart = (e, taskId) => { setDrag(taskId); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const onDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!drag) return;
        const task = tasks.find(t => t.id === drag);
        if (task && task.status !== newStatus) await handleStatusChange(drag, newStatus);
        setDrag(null);
    };

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

            {/* Kanban Board — 3 cột */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14, alignItems: "start"
            }}>
                {COLS.map(col => {
                    const colTasks = tasksByCol(col.key);
                    return (
                        <div key={col.key}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.key)}
                            style={{
                                background: "var(--bg-main)",
                                borderRadius: 12,
                                padding: 12, minHeight: 240,
                                border: drag ? "2px dashed var(--border-color)" : "2px solid transparent",
                                transition: "border 0.15s",
                            }}>
                            {/* Column Header */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                marginBottom: 12, padding: "0 4px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>{col.icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                                        {col.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 800, color: col.color,
                                    background: col.color + "20", padding: "2px 10px", borderRadius: 999
                                }}>{colTasks.length}</span>
                            </div>

                            {/* Task Cards */}
                            {colTasks.map(task => {
                                const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
                                const overdue = isOverdue(task.due_date, task.status);
                                const days = daysUntilDeadline(task.due_date);

                                return (
                                    <div key={task.id}
                                        draggable={canManage}
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        style={{
                                            background: "var(--bg-card)",
                                            border: `1px solid ${overdue ? "#fca5a5" : "var(--border-color)"}`,
                                            borderRadius: 10, padding: "12px 14px", marginBottom: 10,
                                            cursor: canManage ? "grab" : "default",
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                            transition: "box-shadow 0.15s",
                                        }}>
                                        {/* Priority + Delete */}
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, color: p.color,
                                                background: p.bg, padding: "2px 8px", borderRadius: 999
                                            }}>{p.label}</span>
                                            {canManage && (
                                                <button onClick={() => handleDelete(task.id)}
                                                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 2 }}>✕</button>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: "var(--text-primary)" }}>
                                            {task.title}
                                        </div>

                                        {/* Department badge nếu gán cho phòng ban */}
                                        {task.assigned_dept_name && (
                                            <div style={{ marginBottom: 6 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, color: "#0ea5e9",
                                                    background: "rgba(14,165,233,0.1)", padding: "2px 8px", borderRadius: 999
                                                }}>🏢 {task.assigned_dept_name}</span>
                                            </div>
                                        )}

                                        {/* Assignee + Deadline */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            {task.assigned_name && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: "50%",
                                                        background: "rgba(99,102,241,0.15)", color: "var(--color-primary)",
                                                        fontSize: 9, fontWeight: 800, display: "flex",
                                                        alignItems: "center", justifyContent: "center"
                                                    }}>
                                                        {task.assigned_name.split(" ").slice(-1)[0]?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {task.assigned_name}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Deadline */}
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                                                color: overdue ? "#dc2626" : days !== null && days <= 2 ? "#d97706" : "var(--text-muted)",
                                            }}>
                                                {overdue ? "⚠️ " : "🗓️ "}{formatDate(task.due_date)}
                                            </span>
                                        </div>

                                        {/* Quick status change */}
                                        {canManage && task.status !== "done" && (
                                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-color)" }}>
                                                <select className="form-control"
                                                    style={{ fontSize: 11, padding: "2px 6px", height: 26 }}
                                                    value={task.status}
                                                    onChange={e => handleStatusChange(task.id, e.target.value)}>
                                                    <option value="todo">📋 Chuẩn bị</option>
                                                    <option value="in_progress">⚡ Đang làm</option>
                                                    <option value="done">✅ Hoàn thành</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {colTasks.length === 0 && (
                                <div style={{
                                    textAlign: "center", color: "var(--text-muted)", fontSize: 12,
                                    padding: "24px 0", border: "2px dashed var(--border-color)", borderRadius: 8
                                }}>
                                    Kéo thả nhiệm vụ vào đây
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal tạo task */}
            <Modal title="➕ Thêm nhiệm vụ mới" isOpen={modal} onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

                    <div className="form-group">
                        <label>Tiêu đề nhiệm vụ <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="form-control" placeholder="VD: Chuẩn bị thiết bị âm thanh..."
                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" rows={2}
                            placeholder="Mô tả chi tiết nhiệm vụ..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ưu tiên</label>
                            <select className="form-control" value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="high">🔴 Cao</option>
                                <option value="medium">🟡 Trung bình</option>
                                <option value="low">🟢 Thấp</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Deadline <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="datetime-local" className="form-control"
                                value={form.due_date}
                                onChange={e => setForm({ ...form, due_date: e.target.value })}
                                required />
                            <small style={{ color: "var(--text-muted)", fontSize: 11 }}>Bắt buộc nhập deadline</small>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Giao cho nhân viên</label>
                            <select className="form-control" value={form.assigned_to}
                                onChange={e => setForm({ ...form, assigned_to: e.target.value, assigned_department_id: "" })}>
                                <option value="">-- Chọn nhân viên --</option>
                                {assignableStaff.map(s => (
                                    <option key={s.user_id || s.id} value={s.user_id || s.id}>
                                        {s.name || s.user_name}
                                    </option>
                                ))}
                            </select>
                            {attendeeIds.size > 0 && (
                                <small style={{ color: "#f59e0b", fontSize: 11 }}>
                                    ⚠️ Nhân viên đã đăng ký tham gia sự kiện không thể được gán
                                </small>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Hoặc giao cho phòng ban</label>
                            <select className="form-control" value={form.assigned_department_id}
                                onChange={e => setForm({ ...form, assigned_department_id: e.target.value, assigned_to: "" })}>
                                <option value="">-- Chọn phòng ban --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ marginTop: 8 }}>
                        {saving ? "Đang tạo..." : "✅ Tạo nhiệm vụ"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
