import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations, selfRegister, removeAttendee } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import { getMyTasks, updateTaskStatus, updateTaskProgress, reportTaskIssue, getComments, addComment, getHistory } from "../../services/taskService";
import "../../styles/global.css";

// ── status config ──────────────────────────────────────────
const STATUS_MAP = {
    draft:     { label: "Chưa mở",         cls: "emp-badge-gray" },
    planning:  { label: "Lên kế hoạch",     cls: "emp-badge-amber" },
    approved:  { label: "Đã duyệt",         cls: "emp-badge-purple" },
    running:   { label: "Đang diễn ra",     cls: "emp-badge-green" },
    completed: { label: "Đã kết thúc",      cls: "emp-badge-gray" },
    cancelled: { label: "Đã huỷ",           cls: "emp-badge-red" },
};

// ── helpers ────────────────────────────────────────────────
const fmtDay  = d => d ? new Date(d).getDate() : "--";
const fmtMon  = d => d ? new Date(d).toLocaleDateString("vi-VN", { month: "short" }) : "";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" }) : "";

// Emoji map by event type
const EMOJI_MAP = { seminar:"🧠", party:"🎉", training:"📚", workshop:"🎨", meeting:"📊", other:"🎪" };
function eventEmoji(e) { return EMOJI_MAP[e.event_type] || "🎪"; }
function emojiBg(e) {
    const m = { seminar:"rgba(108,114,255,0.12)", party:"rgba(244,114,182,0.1)", training:"rgba(251,191,36,0.1)",
        workshop:"rgba(52,211,153,0.1)", meeting:"rgba(78,85,112,0.2)" };
    return m[e.event_type] || "rgba(108,114,255,0.12)";
}

// ── QR Modal ───────────────────────────────────────────────
function QRModal({ reg, onClose }) {
    if (!reg) return null;
    const code = reg.qr_code || "---";
    return (
        <div className="emp-modal-overlay" onClick={onClose}>
            <div className="emp-modal" onClick={e => e.stopPropagation()}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                    <div style={{ fontSize:16, fontWeight:600 }}>🎟 Mã QR — {reg.event_name}</div>
                    <button className="emp-btn-ghost emp-btn-sm" onClick={onClose}>✕</button>
                </div>
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                    <div style={{
                        width:200, height:200, background:"var(--emp-surface2)",
                        borderRadius:"var(--emp-radius)", margin:"0 auto",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        border:"1px solid var(--emp-border2)", fontSize:13,
                        color:"var(--emp-text2)", flexDirection:"column", gap:8
                    }}>
                        <span style={{ fontSize:40 }}>📱</span>
                        <span style={{ fontFamily:"var(--emp-mono)", fontSize:10, letterSpacing:"0.1em", color:"var(--emp-text3)" }}>
                            {code.substring(0, 16)}
                        </span>
                    </div>
                    <div style={{ fontFamily:"var(--emp-mono)", fontSize:13, letterSpacing:"0.12em", color:"var(--emp-text2)", marginTop:14 }}>
                        {code}
                    </div>
                    <p style={{ fontSize:12, color:"var(--emp-text3)", marginTop:6 }}>
                        Xuất trình mã này khi check-in tại sự kiện
                    </p>
                </div>
                <button className="emp-btn emp-btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={onClose}>
                    Đóng
                </button>
            </div>
        </div>
    );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ message, color, onHide }) {
    useEffect(() => { if (message) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); } }, [message]);
    if (!message) return null;
    return (
        <div className="emp-toast" style={{ borderColor: color, color }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M5.5 8l2 2 3-3" />
            </svg>
            <span>{message}</span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════
export default function EmployeeDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [allEvents, setAllEvents]   = useState([]);
    const [myRegs, setMyRegs]         = useState([]);   // attendee rows có event info
    const [myRegIds, setMyRegIds]     = useState({});   // { event_id: attendee_row }
    const [unread, setUnread]         = useState(0);
    const [loading, setLoading]       = useState(true);
    const [busy, setBusy]             = useState({});
    const [qrReg, setQrReg]           = useState(null); // attendee row for QR modal
    const [myTasks, setMyTasks]       = useState([]);
    
    const [taskModal, setTaskModal]   = useState(null);
    const [taskDetailTab, setTaskDetailTab] = useState("info"); // info, comments, history
    const [comments, setComments]     = useState([]);
    const [history, setHistory]       = useState([]);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending]       = useState(false);
    const [reportModal, setReportModal] = useState(null); // { task }
    const [reportNote, setReportNote] = useState("");
    const [toast, setToast]           = useState({ msg:"", color:"var(--emp-green)" });

    const showToast = (msg, color = "var(--emp-green)") => setToast({ msg, color });

    const today = new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
        } catch (err) { console.error("Load task detail failed", err); }
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
        } catch (err) { alert("Không thể gửi bình luận"); }
        finally { setSending(false); }
    };

    // ── Load data ──────────────────────────────────────────
    const loadAll = useCallback(async () => {
        try {
            const [evRes, regRes, notifRes, taskRes] = await Promise.all([
                getEvents().catch(() => ({ data: [] })),
                getMyRegistrations().catch(() => ({ data: [] })),
                getNotifications().catch(() => ({ data: [] })),
                getMyTasks().catch(() => ({ data: [] })),
            ]);
            const evList  = evRes.data || [];
            const regList = regRes.data || [];
            const nList   = notifRes.data || [];

            setAllEvents(evList);
            setMyRegs(regList);
            setMyTasks(taskRes.data || []);

            // Map event_id → attendee row (để dễ tra cứu)
            const map = {};
            regList.forEach(r => { map[r.event_id] = r; });
            setMyRegIds(map);

            setUnread(nList.filter(n => !n.read_at).length);
        } catch { /**/ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ── Register ───────────────────────────────────────────
    const handleRegister = async (ev) => {
        if (busy[ev.id]) return;
        if (!["approved", "running"].includes(ev.status)) {
            showToast("Sự kiện chưa mở đăng ký.", "var(--emp-amber)");
            return;
        }
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            const res = await selfRegister(ev.id);
            const newAtt = { event_id: ev.id, event_name: ev.name, qr_code: res.data?.qr_code, checked_in: false, start_date: ev.start_date, ...res.data };
            setMyRegIds(m => ({ ...m, [ev.id]: newAtt }));
            setMyRegs(r => [...r, newAtt]);
            showToast(`✓ Đăng ký thành công: ${ev.name}`);
        } catch (err) {
            showToast(err?.response?.data?.message || "Đăng ký thất bại", "var(--emp-red)");
        } finally {
            setBusy(b => ({ ...b, [ev.id]: false }));
        }
    };

    // ── Cancel ─────────────────────────────────────────────
    const handleCancel = async (ev) => {
        if (!window.confirm(`Huỷ đăng ký "${ev.name}"?`)) return;
        if (busy[ev.id]) return;
        const att = myRegIds[ev.id];
        if (!att?.id) return;
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            await removeAttendee(att.id);
            setMyRegIds(m => { const n = { ...m }; delete n[ev.id]; return n; });
            setMyRegs(r => r.filter(x => x.event_id !== ev.id));
            showToast(`Đã huỷ đăng ký: ${ev.name}`, "var(--emp-red)");
        } catch (err) {
            showToast(err?.response?.data?.message || "Huỷ thất bại", "var(--emp-red)");
        } finally {
            setBusy(b => ({ ...b, [ev.id]: false }));
        }
    };

    // ── Tasks ──────────────────────────────────────────────
    const handleUpdateStatus = async (taskId, status) => {
        try {
            await updateTaskStatus(taskId, status);
            showToast("Đã cập nhật trạng thái");
            setTaskModal(null);
            loadAll();
        } catch (err) { showToast(err.response?.data?.message || "Lỗi", "var(--emp-red)"); }
    };

    const handleUpdateProgress = async (taskId, progress) => {
        try {
            await updateTaskProgress(taskId, progress);
            showToast(`Đã cập nhật tiến độ: ${progress}%`);
            loadAll();
        } catch (err) { showToast(err.response?.data?.message || "Lỗi", "var(--emp-red)"); }
    };

    const handleReportIssue = async (e) => {
        e.preventDefault();
        if (!reportNote.trim()) return;
        setBusy(b => ({ ...b, reporting: true }));
        try {
            await reportTaskIssue(reportModal.id, reportNote);
            showToast("⚠️ Đã gửi báo cáo sự cố cho quản lý", "var(--emp-amber)");
            setReportModal(null);
            setReportNote("");
            loadAll();
        } catch (err) { showToast(err.response?.data?.message || "Lỗi", "var(--emp-red)"); }
        finally { setBusy(b => ({ ...b, reporting: false })); }
    };

    // ── Derived state ──────────────────────────────────────
    const now = new Date();
    const upcoming  = myRegs.filter(r => r.start_date && new Date(r.start_date) > now && !r.checked_in);
    const attended  = myRegs.filter(r => r.checked_in);
    const discover  = allEvents.filter(e => !myRegIds[e.id] && ["approved","running"].includes(e.status)).slice(0, 3);

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Xin chào, <span className="gradient-text">{user?.name || "Thành viên"}</span> 👋</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{today} · Chúc bạn một ngày làm việc hiệu quả!</p>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                <div className="card-stat indigo" style={{ cursor: "pointer", padding: 24, borderRadius: 20 }} onClick={() => navigate("/my-events")}>
                    <div className="card-stat-icon indigo" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 14, marginBottom: 16 }}>🎫</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{myRegs.length}</h3>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Đã đăng ký</p>
                    </div>
                </div>
                <div className="card-stat emerald" style={{ cursor: "pointer", padding: 24, borderRadius: 20 }} onClick={() => navigate("/calendar")}>
                    <div className="card-stat-icon emerald" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 14, marginBottom: 16 }}>📅</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{upcoming.length}</h3>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Sắp diễn ra</p>
                    </div>
                </div>
                <div className="card-stat cyan" style={{ cursor: "pointer", padding: 24, borderRadius: 20 }} onClick={() => navigate("/my-events?tab=done")}>
                    <div className="card-stat-icon cyan" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 14, marginBottom: 16 }}>✅</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{attended.length}</h3>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Đã tham dự</p>
                    </div>
                </div>
                <div className="card-stat amber" style={{ cursor: "pointer", padding: 24, borderRadius: 20 }}>
                    <div className="card-stat-icon amber" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 14, marginBottom: 16 }}>📝</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{myTasks.filter(t => t.status !== 'done').length}</h3>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Nhiệm vụ chưa xong</p>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Sự kiện sắp tới của tôi</h2>
                <button className="btn btn-outline" style={{ padding: "6px 16px", fontSize: 13, borderRadius: 10 }} onClick={() => navigate("/my-events")}>Xem tất cả →</button>
            </div>

            {upcoming.length === 0 ? (
                <div className="card" style={{ marginBottom: 32, padding: 48, textAlign: "center", border: "1px dashed var(--border-color)", background: "transparent" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎪</div>
                    <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Bạn chưa có sự kiện sắp tới nào.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 10 }} onClick={() => navigate("/events")}>Khám phá sự kiện ngay</button>
                </div>
            ) : (
                <div className="grid-4" style={{ marginBottom: 40, gap: 20 }}>
                    {upcoming.slice(0, 4).map(reg => (
                        <div key={reg.event_id || reg.id} className="card" style={{ padding: 20, borderRadius: 20, border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                                <div style={{ 
                                    width: 48, height: 52, borderRadius: 12, background: "var(--bg-main)", 
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" 
                                }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>{fmtDay(reg.start_date)}</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{fmtMon(reg.start_date)}</div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reg.event_name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtTime(reg.start_date)} {reg.location ? `· ${reg.location}` : ""}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--bg-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button className="btn btn-outline" style={{ padding: 0, width: 32, height: 32, borderRadius: 8, fontSize: 14 }} onClick={() => setQrReg(reg)}>📱</button>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Mã vé QR</span>
                                </div>
                                <span className="badge badge-success" style={{ fontSize: 10 }}>Đã đăng ký</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Nhiệm vụ được phân công</h2>
            </div>
            {myTasks.length === 0 ? (
                <div className="card" style={{ marginBottom: 40, padding: 40, textAlign: "center", border: "1px dashed var(--border-color)", background: "transparent" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
                    <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Hiện tại bạn không có nhiệm vụ nào được phân công.</p>
                </div>
            ) : (
                <div className="card" style={{ marginBottom: 40, padding: 0, borderRadius: 24, overflow: "hidden" }}>
                    {myTasks.map((t, idx) => (
                        <div key={t.id} style={{ 
                            display: "flex", alignItems: "center", gap: 20, padding: "20px 24px",
                            borderBottom: idx < myTasks.length - 1 ? "1px solid var(--bg-main)" : "none",
                            background: t.status === 'done' ? "#fafafa" : "#fff"
                        }}>
                            <div style={{ 
                                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: t.status === 'done' ? "#ecfdf5" : t.status === 'in_progress' ? "#fffbeb" : "#f1f5f9",
                                color: t.status === 'done' ? "#10b981" : t.status === 'in_progress' ? "#f59e0b" : "#64748b",
                                fontSize: 18, fontWeight: 700
                            }}>
                                {t.status === 'done' ? '✓' : '⌛'}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12, alignItems: "center" }}>
                                    <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>📍 {t.event_name}</span>
                                    <span>•</span>
                                    <span>📅 Hạn: {fmtDate(t.due_date)}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                                    <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                                        <div style={{ 
                                            width: `${t.progress}%`, height: "100%", 
                                            background: t.status === 'done' ? "#10b981" : "var(--color-primary)",
                                            borderRadius: 10, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                                        }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", minWidth: 32 }}>{t.progress}%</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn btn-outline" style={{ height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13 }} onClick={() => openTaskDetail(t)}>Chi tiết</button>
                                <button className="btn btn-danger" style={{ width: 40, height: 40, padding: 0, borderRadius: 10, background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" }} title="Báo cáo sự cố" onClick={() => setReportModal(t)}>⚠️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Task Detail Modal */}
            {taskModal && (
                <div className="modal-overlay" onClick={() => setTaskModal(null)} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ maxWidth: 600, width: "90%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--bg-main)" }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Nhiệm vụ: {taskModal.title}</h3>
                            <button className="btn btn-outline" style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }} onClick={() => setTaskModal(null)}>✕</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", background: "var(--bg-main)", padding: "0 24px", gap: 24 }}>
                            {[
                                { k: 'info', l: 'Thông tin' },
                                { k: 'comments', l: `Bình luận (${comments.length})` },
                                { k: 'history', l: 'Lịch sử' }
                            ].map(t => (
                                <button key={t.k} onClick={() => setTaskDetailTab(t.k)}
                                    style={{ 
                                        padding: "16px 0", fontSize: 14, fontWeight: 700, background: "none", border: "none", cursor: "pointer",
                                        color: taskDetailTab === t.k ? "var(--color-primary)" : "var(--text-muted)",
                                        borderBottom: taskDetailTab === t.k ? "3px solid var(--color-primary)" : "3px solid transparent",
                                        transition: "all 0.2s"
                                    }}>
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                            {taskDetailTab === 'info' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Mô tả chi tiết</label>
                                        <div style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.6, background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                                            {taskModal.description || "Không có mô tả chi tiết."}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Sự kiện liên quan</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-primary)" }}>{taskModal.event_name}</div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Hạn hoàn thành</label>
                                            <div style={{ fontSize: 14, color: "#ef4444", fontWeight: 700 }}>📅 {new Date(taskModal.due_date).toLocaleString("vi-VN")}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Mức độ ưu tiên</label>
                                            <span className={`badge badge-${taskModal.priority === 'high' ? 'danger' : taskModal.priority === 'medium' ? 'warning' : 'info'}`} style={{ textTransform: "capitalize" }}>
                                                {taskModal.priority === 'high' ? 'Cao' : taskModal.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: "1px solid var(--bg-main)", paddingTop: 24 }}>
                                        <label style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, display: "block" }}>Cập nhật trạng thái</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                                            {[
                                                { k: 'todo', l: 'Chuẩn bị', c: '#64748b' },
                                                { k: 'in_progress', l: 'Đang làm', c: '#f59e0b' },
                                                { k: 'done', l: 'Hoàn thành', c: '#10b981' }
                                            ].map(s => (
                                                <button key={s.k} onClick={() => handleUpdateStatus(taskModal.id, s.k)}
                                                    style={{ 
                                                        padding: "12px", fontSize: 13, borderRadius: 12, border: "1px solid var(--border-color)",
                                                        background: taskModal.status === s.k ? s.c : "#fff",
                                                        color: taskModal.status === s.k ? "#fff" : "var(--text-primary)",
                                                        fontWeight: 700, transition: "all 0.2s"
                                                    }}>
                                                    {s.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <label style={{ fontSize: 14, fontWeight: 800 }}>Tiến độ công việc</label>
                                            <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{taskModal.progress}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" step="5" style={{ width: "100%", accentColor: "var(--color-primary)", height: 6 }}
                                            value={taskModal.progress}
                                            onChange={e => setTaskModal({ ...taskModal, progress: parseInt(e.target.value) })}
                                            onMouseUp={() => handleUpdateProgress(taskModal.id, taskModal.progress)}
                                            onTouchEnd={() => handleUpdateProgress(taskModal.id, taskModal.progress)} />
                                    </div>
                                </div>
                            )}

                            {taskDetailTab === 'comments' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {comments.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Chưa có bình luận nào.</div>
                                        ) : comments.map(c => (
                                            <div key={c.id} style={{ display: "flex", gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-main)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--color-primary)" }}>
                                                    {c.user_name?.[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 800 }}>{c.user_name}</span>
                                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(c.created_at).toLocaleTimeString("vi-VN")}</span>
                                                    </div>
                                                    <div style={{ fontSize: 14, color: "var(--text-primary)", background: "var(--bg-main)", padding: "12px 16px", borderRadius: "0 14px 14px 14px", border: "1px solid #f1f5f9" }}>
                                                        {c.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddComment} style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid var(--bg-main)" }}>
                                        <input className="form-control" style={{ borderRadius: 10, height: 44 }}
                                            placeholder="Nhập nội dung trao đổi..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                                        <button className="btn btn-primary" disabled={!newComment.trim() || sending} style={{ height: 44, padding: "0 20px" }}>Gửi</button>
                                    </form>
                                </div>
                            )}

                            {taskDetailTab === 'history' && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {history.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Chưa có lịch sử thay đổi.</div>
                                    ) : history.map((h, i) => (
                                        <div key={h.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderLeft: i < history.length - 1 ? "2px solid #f1f5f9" : "2px solid transparent", marginLeft: 7, paddingLeft: 16, position: "relative" }}>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", position: "absolute", left: -6, top: 16, border: "2px solid #fff" }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14 }}>
                                                    <strong>{h.user_name}</strong> {
                                                        h.action === 'status_change' ? 'đổi trạng thái' :
                                                        h.action === 'progress' ? 'cập nhật tiến độ' :
                                                        h.action === 'assign' ? 'phân công cho' :
                                                        h.action === 'created' ? 'tạo nhiệm vụ' : h.action
                                                    }
                                                    {h.new_value && <span style={{ color: "var(--color-primary)", fontWeight: 700 }}> → {h.new_value}</span>}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{new Date(h.created_at).toLocaleString("vi-VN")}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Issue Modal */}
            {reportModal && (
                <div className="modal-overlay" onClick={() => setReportModal(null)} style={{ background: "rgba(239, 68, 68, 0.1)", backdropFilter: "blur(4px)" }}>
                    <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 32, borderRadius: 24, boxShadow: "0 20px 50px -10px rgba(239, 68, 68, 0.2)" }}>
                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#fef2f2", color: "#ef4444", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>⚠️</div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#991b1b" }}>Báo cáo sự cố</h3>
                            <p style={{ fontSize: 14, color: "#b91c1c", marginTop: 4 }}>{reportModal.title}</p>
                        </div>
                        
                        <form onSubmit={handleReportIssue}>
                            <textarea 
                                className="form-control" rows={4} autoFocus
                                placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải..."
                                style={{ borderRadius: 14, padding: 16, fontSize: 14, border: "1px solid #fecaca", background: "#fff" }}
                                value={reportNote} onChange={e => setReportNote(e.target.value)}
                                required
                            />
                            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, height: 48, borderRadius: 12 }} onClick={() => setReportModal(null)}>Hủy bỏ</button>
                                <button type="submit" className="btn btn-danger" style={{ flex: 1, height: 48, borderRadius: 12, background: "#ef4444", fontWeight: 800 }} disabled={busy.reporting}>
                                    {busy.reporting ? "Đang gửi..." : "Gửi báo cáo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Toast message={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </Layout>
    );
}

// ── Event discover card ──────────────────────────────────────
function DiscoverCard({ ev, reg, busy, onRegister, onCancel }) {
    const s = STATUS_MAP[ev.status] || STATUS_MAP.draft;
    const pct = ev.capacity > 0 ? Math.round((ev.registered_count || 0) / ev.capacity * 100) : 0;
    const capColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981";
    const canReg = ["approved","running"].includes(ev.status);

    return (
        <div className="card" style={{ padding: 24, borderRadius: 24, border: "1px solid var(--border-color)", transition: "all 0.3s", position: "relative" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{eventEmoji(ev)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{ev.event_type}</span>
                        <span className={`badge ${s.cls === 'emp-badge-green' ? 'badge-success' : s.cls === 'emp-badge-amber' ? 'badge-warning' : 'badge-default'}`} style={{ fontSize: 10 }}>{s.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span>📅</span> {fmtDate(ev.start_date)}
                </div>
                {ev.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                        <span>📍</span> {ev.location}
                    </div>
                )}
            </div>

            <div style={{ background: "var(--bg-main)", padding: 16, borderRadius: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Tình trạng chỗ ngồi</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: capColor }}>{ev.registered_count || 0}/{ev.capacity} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: capColor, borderRadius: 10 }} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                {reg ? (
                    <button className="btn btn-outline" style={{ flex: 1, height: 48, borderRadius: 12, color: "#ef4444", borderColor: "#fecaca" }} disabled={busy} onClick={() => onCancel(ev)}>
                        {busy ? "..." : "Huỷ đăng ký"}
                    </button>
                ) : canReg ? (
                    <button className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 12, fontWeight: 800 }} disabled={busy} onClick={() => onRegister(ev)}>
                        {busy ? "..." : "Đăng ký tham gia ngay"}
                    </button>
                ) : (
                    <button className="btn btn-outline" style={{ flex: 1, height: 48, borderRadius: 12, opacity: 0.5 }} disabled>Chưa mở đăng ký</button>
                )}
            </div>
        </div>
    );
}
