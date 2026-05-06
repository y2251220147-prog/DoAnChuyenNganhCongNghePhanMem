import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { selfRegister, removeAttendee, getMyRegistrations } from "../../services/attendeeService";
import { getMyTasks, updateTaskStatus, updateTaskProgress, reportTaskIssue, getComments, addComment, getHistory } from "../../services/taskService";
import "../../styles/global.css";

const STATUS_MAP = {
    draft:     { label: "Chưa mở",         cls: "badge-default" },
    planning:  { label: "Lên kế hoạch",     cls: "badge-warning" },
    approved:  { label: "Đã duyệt",         cls: "badge-admin" },
    running:   { label: "Đang diễn ra",     cls: "badge-success" },
    completed: { label: "Đã kết thúc",      cls: "badge-default" },
    cancelled: { label: "Đã huỷ",           cls: "badge-danger" },
};

const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtTime = d => {
    if (!d) return "";
    if (typeof d === "string" && d.match(/^\d{2}:\d{2}:\d{2}$/)) return d.substring(0, 5);
    try {
        const dt = new Date(d);
        if (!isNaN(dt)) return dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { }
    return d;
};

function QRImage({ value, size = 200 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" width={size} height={size} style={{ display: "block", borderRadius: 10 }} />;
}

export default function EmployeeEventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [myReg, setMyReg] = useState(null); 
    const [myTasks, setMyTasks] = useState([]);
    const [busy, setBusy] = useState(false);
    
    const [taskModal, setTaskModal] = useState(null);
    const [taskDetailTab, setTaskDetailTab] = useState("info");
    const [comments, setComments] = useState([]);
    const [history, setHistory] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);

    const [reportModal, setReportModal] = useState(null);
    const [reportNote, setReportNote] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [evR, tlR, regR, taskR] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/timeline/event/${id}`),
                getMyRegistrations(),
                getMyTasks()
            ]);
            setEvent(evR.data);
            setTimeline(tlR.data || []);
            const tasks = (taskR.data || []).filter(t => String(t.event_id) === String(id));
            setMyTasks(tasks);
            const regs = regR.data || [];
            const existingReg = regs.find(r => String(r.event_id) === String(id));
            setMyReg(existingReg || null);
        } catch {
            setError("Lỗi khi tải thông tin sự kiện.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!["approved", "running"].includes(event.status)) return;
        setBusy(true);
        try {
            const res = await selfRegister(id);
            setMyReg({ id: res.data.id, qr_code: res.data.qr_code, event_id: id });
            alert("Đăng ký thành công!");
        } catch (err) {
            alert(err?.response?.data?.message || "Đăng ký thất bại");
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm(`Huỷ đăng ký "${event.name}"?`)) return;
        setBusy(true);
        try {
            await removeAttendee(myReg.id);
            setMyReg(null);
            alert("Đã huỷ đăng ký.");
        } catch (err) {
            alert(err?.response?.data?.message || "Huỷ thất bại");
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateStatus = async (taskId, status) => {
        try {
            await updateTaskStatus(taskId, status);
            setTaskModal(null);
            loadData();
        } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
    };

    const handleUpdateProgress = async (taskId, progress) => {
        try {
            await updateTaskProgress(taskId, progress);
            loadData();
        } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
    };

    const openTaskDetail = async (task) => {
        setTaskModal(task);
        setTaskDetailTab("info");
        setComments([]);
        setHistory([]);
        try {
            const [cR, hR] = await Promise.all([
                getComments(task.id),
                getHistory(task.id)
            ]);
            setComments(cR.data || []);
            setHistory(hR.data || []);
        } catch (err) { console.error(err); }
    };

    const handleAddComment = async (e) => {
        if (e) e.preventDefault();
        if (!newComment.trim() || sending) return;
        setSending(true);
        try {
            await addComment(taskModal.id, newComment);
            setNewComment("");
            const cR = await getComments(taskModal.id);
            setComments(cR.data || []);
        } catch (err) { alert("Lỗi"); }
        finally { setSending(false); }
    };

    const handleReportIssue = async (e) => {
        e.preventDefault();
        if (!reportNote.trim()) return;
        setBusy(true);
        try {
            await reportTaskIssue(reportModal.id, reportNote);
            alert("⚠️ Đã gửi báo cáo sự cố cho quản lý");
            setReportModal(null);
            setReportNote("");
            loadData();
        } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
        finally { setBusy(false); }
    };

    if (loading) return (
        <Layout>
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Đang tải chi tiết sự kiện...</p>
            </div>
        </Layout>
    );

    if (error || !event) return (
        <Layout>
            <div className="card" style={{ padding: 80, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                <div style={{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>{error || "Không tìm thấy sự kiện."}</p>
                <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={() => navigate(-1)}>Quay lại</button>
            </div>
        </Layout>
    );

    const s = STATUS_MAP[event.status] || STATUS_MAP.draft;
    const canReg = ["approved","running"].includes(event.status);

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Chi tiết sự kiện</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Thông tin chi tiết và lịch trình hoạt động</p>
                </div>
                <button className="btn btn-outline" style={{ borderRadius: 12, height: 44 }} onClick={() => navigate(-1)}>← Quay lại</button>
            </div>

            <div className="grid-2-1" style={{ gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {/* Hero Section */}
                    <div className="card" style={{ padding: 40, borderRadius: 32, background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <span className={`badge ${s.cls}`} style={{ fontSize: 11 }}>{s.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{event.event_type}</span>
                            {event.venue_type === "online" && <span className="badge badge-admin">🌐 Online</span>}
                        </div>
                        
                        <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.2 }}>{event.name}</h1>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
                            <div className="card" style={{ padding: 20, borderRadius: 16, background: "#fff", border: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Thời gian</div>
                                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtDT(event.start_date)}</div>
                            </div>
                            <div className="card" style={{ padding: 20, borderRadius: 16, background: "#fff", border: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Địa điểm</div>
                                <div style={{ fontSize: 15, fontWeight: 800 }}>{event.location || "Chưa xác định"}</div>
                            </div>
                        </div>

                        {event.description && (
                            <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 40 }}>
                                {event.description}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 16 }}>
                            {myReg ? (
                                <button className="btn btn-outline" style={{ flex: 1, height: 56, borderRadius: 16, fontWeight: 800, color: "#ef4444", borderColor: "#fecaca" }} disabled={busy} onClick={handleCancel}>
                                    {busy ? "..." : "Huỷ đăng ký tham gia"}
                                </button>
                            ) : canReg ? (
                                <button className="btn btn-primary" style={{ flex: 1, height: 56, borderRadius: 16, fontWeight: 800 }} disabled={busy} onClick={handleRegister}>
                                    {busy ? "..." : "Đăng ký tham gia ngay"}
                                </button>
                            ) : (
                                <button className="btn btn-outline" style={{ flex: 1, height: 56, borderRadius: 16, opacity: 0.5 }} disabled>Chưa mở đăng ký</button>
                            )}
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🗓️</span>
                            Lịch trình chi tiết
                        </h3>
                        {timeline.length === 0 ? (
                            <div className="card" style={{ padding: 40, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                                <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Chưa có lịch trình cụ thể cho sự kiện này.</p>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 0, borderRadius: 24, overflow: "hidden" }}>
                                {timeline.map((item, i) => (
                                    <div key={item.id} style={{ 
                                        display: "flex", padding: 24, 
                                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                                        borderBottom: i < timeline.length - 1 ? "1px solid #f1f5f9" : "none" 
                                    }}>
                                        <div style={{ width: 120, flexShrink: 0 }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>{fmtTime(item.start_time)}</div>
                                            {item.end_time && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>đến {fmtTime(item.end_time)}</div>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{item.title}</h4>
                                            {item.description && <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {/* QR Code Card */}
                    {myReg && myReg.qr_code && (
                        <div className="card" style={{ padding: 32, borderRadius: 28, background: "var(--color-primary)", color: "#fff", textAlign: "center" }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>🎟️ Vé của bạn</h3>
                            <div style={{ background: "#fff", padding: 16, borderRadius: 20, display: "inline-block", marginBottom: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
                                <QRImage value={myReg.qr_code} size={180} />
                            </div>
                            <div style={{ fontSize: 12, background: "rgba(255,255,255,0.1)", padding: "12px 16px", borderRadius: 12, marginBottom: 24, fontFamily: "monospace", letterSpacing: "0.05em", color: "#fff" }}>
                                {myReg.qr_code}
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9, marginBottom: 24 }}>Vui lòng xuất trình mã QR này tại quầy đón tiếp để thực hiện check-in.</p>
                            <button className="btn" style={{ background: "#fff", color: "var(--color-primary)", width: "100%", fontWeight: 800, borderRadius: 14, height: 52 }}
                                onClick={() => {
                                    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(myReg.qr_code)}&margin=14`;
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `QR-${event.name?.replace(/\s/g,"_")}.png`;
                                    a.click();
                                }}>
                                ⬇️ Tải ảnh về máy
                            </button>
                        </div>
                    )}

                    {/* My Tasks Section */}
                    {myTasks.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>📝 Nhiệm vụ giao phó</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {myTasks.map((t) => (
                                    <div key={t.id} className="card" style={{ padding: 20, borderRadius: 20 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                            <div style={{ 
                                                width: 32, height: 32, borderRadius: 10, background: t.status === 'done' ? "#ecfdf5" : "#fff7ed",
                                                display: "flex", alignItems: "center", justifyContent: "center", color: t.status === 'done' ? "#10b981" : "#f59e0b", fontSize: 16
                                            }}>
                                                {t.status === 'done' ? '✓' : '⌛'}
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 14, flex: 1 }}>{t.title}</div>
                                            <button className="btn btn-outline" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={(e) => { e.stopPropagation(); setReportModal(t); }}>⚠️</button>
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                                                <span style={{ color: "var(--text-muted)" }}>Tiến độ</span>
                                                <span style={{ color: "var(--color-primary)" }}>{t.progress}%</span>
                                            </div>
                                            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                                                <div style={{ width: `${t.progress}%`, height: "100%", background: "var(--color-primary)", borderRadius: 10 }} />
                                            </div>
                                        </div>
                                        <button className="btn btn-outline" style={{ width: "100%", borderRadius: 10, fontSize: 12, fontWeight: 700 }} onClick={() => openTaskDetail(t)}>Cập nhật nhiệm vụ</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            {taskModal && (
                <div className="modal-overlay" onClick={() => setTaskModal(null)} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ maxWidth: 600, width: "90%", padding: 32, borderRadius: 28 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Cập nhật Nhiệm vụ</h3>
                            <button className="btn btn-outline" style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }} onClick={() => setTaskModal(null)}>✕</button>
                        </div>

                        <div style={{ display: "flex", gap: 24, marginBottom: 32, borderBottom: "1px solid #f1f5f9" }}>
                            {[
                                { k: 'info', l: 'Thông tin chính' },
                                { k: 'comments', l: `Thảo luận (${comments.length})` },
                                { k: 'history', l: 'Lịch sử' }
                            ].map(t => (
                                <button key={t.k} onClick={() => setTaskDetailTab(t.k)}
                                    style={{ 
                                        padding: "12px 0", fontSize: 14, fontWeight: 800, background: "none", border: "none", cursor: "pointer",
                                        color: taskDetailTab === t.k ? "var(--color-primary)" : "var(--text-muted)",
                                        borderBottom: taskDetailTab === t.k ? "3px solid var(--color-primary)" : "3px solid transparent",
                                        transition: "all 0.2s"
                                    }}>
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        <div style={{ maxHeight: 500, overflowY: "auto", paddingRight: 8 }}>
                            {taskDetailTab === 'info' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                    <div>
                                        <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{taskModal.title}</h4>
                                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{taskModal.description || "Chưa có mô tả chi tiết."}</p>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                        <div className="card" style={{ padding: 16, borderRadius: 12, background: "var(--bg-main)", border: "none" }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Hạn chót</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{fmtDT(taskModal.due_date)}</div>
                                        </div>
                                        <div className="card" style={{ padding: 16, borderRadius: 12, background: "var(--bg-main)", border: "none" }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Ưu tiên</div>
                                            <div style={{ fontSize: 14, fontWeight: 800 }}>{taskModal.priority === 'high' ? '🔴 Cao' : taskModal.priority === 'medium' ? '🟡 Trung bình' : '🔵 Thấp'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 16 }}>Trạng thái thực hiện</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                            {[
                                                { k: 'todo', l: 'Chờ xử lý', c: '#64748b' },
                                                { k: 'in_progress', l: 'Đang làm', c: '#f59e0b' },
                                                { k: 'done', l: 'Hoàn thành', c: '#10b981' }
                                            ].map(st => (
                                                <button key={st.k} onClick={() => handleUpdateStatus(taskModal.id, st.k)}
                                                    style={{ 
                                                        padding: "14px 0", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer",
                                                        background: taskModal.status === st.k ? st.c : "#f8fafc",
                                                        color: taskModal.status === st.k ? "#fff" : "var(--text-primary)",
                                                        border: "1px solid " + (taskModal.status === st.k ? st.c : "#e2e8f0"),
                                                        transition: "all 0.2s"
                                                    }}>
                                                    {st.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                            <label style={{ fontSize: 14, fontWeight: 800 }}>Tiến độ công việc</label>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)" }}>{taskModal.progress}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" step="5" style={{ width: "100%", accentColor: "var(--color-primary)", height: 8 }}
                                            value={taskModal.progress}
                                            onChange={e => setTaskModal({ ...taskModal, progress: parseInt(e.target.value) })}
                                            onMouseUp={() => handleUpdateProgress(taskModal.id, taskModal.progress)}
                                            onTouchEnd={() => handleUpdateProgress(taskModal.id, taskModal.progress)} />
                                    </div>
                                </div>
                            )}

                            {taskDetailTab === 'comments' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {comments.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Chưa có thảo luận nào.</div>
                                        ) : comments.map(c => (
                                            <div key={c.id} style={{ display: "flex", gap: 12 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>
                                                    {c.user_name?.[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, background: "#f8fafc", padding: 16, borderRadius: "0 16px 16px 16px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 800 }}>{c.user_name}</span>
                                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtTime(c.created_at)}</span>
                                                    </div>
                                                    <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{c.content}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddComment} style={{ display: "flex", gap: 12, position: "sticky", bottom: 0, background: "#fff", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                                        <input className="form-control" style={{ flex: 1, borderRadius: 12, height: 48 }}
                                            placeholder="Nhập nội dung thảo luận..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                                        <button className="btn btn-primary" disabled={!newComment.trim() || sending} style={{ width: 48, height: 48, padding: 0, borderRadius: 12 }}>✈️</button>
                                    </form>
                                </div>
                            )}

                            {taskDetailTab === 'history' && (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {history.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Chưa có lịch sử thay đổi.</div>
                                    ) : history.map((h, idx) => (
                                        <div key={h.id} style={{ 
                                            display: "flex", gap: 16, padding: "20px 0", 
                                            borderBottom: idx === history.length - 1 ? "none" : "1px solid #f1f5f9" 
                                        }}>
                                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)", marginTop: 4, flexShrink: 0, border: "3px solid #fff", boxShadow: "0 0 0 2px var(--bg-main)" }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, color: "var(--text-primary)" }}>
                                                    <strong>{h.user_name}</strong> {
                                                        h.action === 'status_change' ? 'đã thay đổi trạng thái' :
                                                        h.action === 'progress' ? 'đã cập nhật tiến độ' :
                                                        h.action === 'assign' ? 'đã được phân công bởi' :
                                                        h.action === 'created' ? 'đã tạo nhiệm vụ' : h.action
                                                    }
                                                    {h.new_value && <span style={{ color: "var(--color-primary)", fontWeight: 800 }}>: {h.new_value}</span>}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{new Date(h.created_at).toLocaleString("vi-VN")}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-outline" style={{ width: "100%", marginTop: 32, height: 52, borderRadius: 14, fontWeight: 800 }} onClick={() => setTaskModal(null)}>Đóng chi tiết</button>
                    </div>
                </div>
            )}

            {/* Report Issue Modal */}
            {reportModal && (
                <div className="modal-overlay" onClick={() => setReportModal(null)} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ maxWidth: 450, width: "90%", padding: 32, borderRadius: 28 }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: 24, textAlign: "center" }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>⚠️</div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>Báo cáo sự cố</h3>
                            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>Vui lòng mô tả vấn đề bạn đang gặp phải với nhiệm vụ: <br/><strong>{reportModal.title}</strong></p>
                        </div>
                        <form onSubmit={handleReportIssue}>
                            <textarea 
                                className="form-control" rows={5} autoFocus
                                placeholder="Mô tả sự cố (ví dụ: Thiếu nhân sự, cần hỗ trợ thêm thiết bị...)"
                                style={{ borderRadius: 16, padding: 16, fontSize: 14, marginBottom: 24 }}
                                value={reportNote} onChange={e => setReportNote(e.target.value)}
                                required
                            />
                            <div style={{ display: "flex", gap: 12 }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: 12, fontWeight: 700 }} onClick={() => setReportModal(null)}>Hủy bỏ</button>
                                <button type="submit" className="btn" style={{ flex: 1, borderRadius: 12, fontWeight: 800, background: "#ef4444", color: "#fff" }} disabled={busy}>
                                    {busy ? "Đang gửi..." : "Gửi báo cáo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
