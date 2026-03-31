import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations, selfRegister, removeAttendee } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/employee-theme.css";

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
    const [toast, setToast]           = useState({ msg:"", color:"var(--emp-green)" });

    const showToast = (msg, color = "var(--emp-green)") => setToast({ msg, color });

    // ── Load data ──────────────────────────────────────────
    const loadAll = useCallback(async () => {
        try {
            const [evRes, regRes, notifRes] = await Promise.all([
                getEvents().catch(() => ({ data: [] })),
                getMyRegistrations().catch(() => ({ data: [] })),
                getNotifications().catch(() => ({ data: [] })),
            ]);
            const evList  = evRes.data || [];
            const regList = regRes.data || [];
            const nList   = notifRes.data || [];

            setAllEvents(evList);
            setMyRegs(regList);

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
        // ✅ Logic: chỉ cho đăng ký khi approved hoặc running
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

    // ── Derived state ──────────────────────────────────────
    const now = new Date();
    const upcoming  = myRegs.filter(r => r.start_date && new Date(r.start_date) > now && !r.checked_in);
    const attended  = myRegs.filter(r => r.checked_in);
    const discover  = allEvents.filter(e => !myRegIds[e.id] && ["approved","running"].includes(e.status)).slice(0, 3);

    if (loading) {
        return (
            <EmployeeLayout unreadCount={unread}>
                <div className="emp-empty"><div className="emp-empty-icon">⏳</div><p>Đang tải...</p></div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout unreadCount={unread}>
            {/* ── STAT STRIP ── */}
            <div className="emp-stat-strip">
                <div className="emp-stat-box" style={{ cursor:"pointer" }} onClick={() => navigate("/my-events")}>
                    <div className="emp-stat-val" style={{ color:"var(--emp-accent)" }}>{myRegs.length}</div>
                    <div className="emp-stat-lbl">Đã đăng ký</div>
                </div>
                <div className="emp-stat-box" style={{ cursor:"pointer" }} onClick={() => navigate("/calendar")}>
                    <div className="emp-stat-val" style={{ color:"var(--emp-green)" }}>{upcoming.length}</div>
                    <div className="emp-stat-lbl">Sắp diễn ra</div>
                </div>
                <div className="emp-stat-box" style={{ cursor:"pointer" }} onClick={() => navigate("/my-events?tab=done")}>
                    <div className="emp-stat-val">{attended.length}</div>
                    <div className="emp-stat-lbl">Đã tham dự</div>
                </div>
            </div>

            {/* ── UPCOMING REGISTERED EVENTS ── */}
            <div className="emp-sec-header">
                <h2>Sự kiện sắp tới của tôi</h2>
                <button className="emp-btn-ghost" onClick={() => navigate("/my-events")}>Xem tất cả →</button>
            </div>

            {upcoming.length === 0 ? (
                <div style={{ marginBottom:28 }}>
                    <div className="emp-panel emp-empty">
                        <div className="emp-empty-icon">🎪</div>
                        <p>Bạn chưa có sự kiện sắp tới nào.<br />
                            <span style={{ color:"var(--emp-accent)", cursor:"pointer" }} onClick={() => navigate("/events")}>
                                Khám phá sự kiện →
                            </span>
                        </p>
                    </div>
                </div>
            ) : (
                <div className="emp-upcoming-grid" style={{ marginBottom:28 }}>
                    {upcoming.slice(0, 4).map(reg => (
                        <div key={reg.event_id || reg.id} className="emp-my-event-card">
                            <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                                {/* Date block */}
                                <div className="emp-date-block">
                                    <div className="emp-date-day">{fmtDay(reg.start_date)}</div>
                                    <div className="emp-date-month">{fmtMon(reg.start_date)}</div>
                                </div>
                                {/* Info */}
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:14, fontWeight:600, marginBottom:4, lineHeight:1.3 }}>
                                        {reg.event_name}
                                    </div>
                                    <div style={{ fontSize:12, color:"var(--emp-text2)" }}>
                                        {fmtTime(reg.start_date)} {reg.location ? `· ${reg.location}` : ""}
                                    </div>
                                    <span className="emp-badge emp-badge-green" style={{ marginTop:8 }}>✓ Đã đăng ký</span>
                                </div>
                            </div>
                            {/* QR footer */}
                            <div className="emp-my-event-status">
                                <button className="emp-qr-mini" title="Xem mã QR" onClick={() => setQrReg(reg)}>
                                    📱
                                </button>
                                <div style={{ flex:1 }}>
                                    <div style={{ fontSize:12, fontWeight:500, marginBottom:3 }}>Mã vé của bạn</div>
                                    <div style={{ fontFamily:"var(--emp-mono)", fontSize:10, color:"var(--emp-text3)", letterSpacing:"0.1em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                        {reg.qr_code || "---"}
                                    </div>
                                    <div style={{ fontSize:11, color:"var(--emp-text3)", marginTop:2 }}>Nhấn vào QR để phóng to</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── DISCOVER NEW EVENTS ── */}
            <div className="emp-sec-header">
                <h2>Khám phá sự kiện mới</h2>
                <button className="emp-btn-ghost" onClick={() => navigate("/events")}>Xem tất cả →</button>
            </div>

            {discover.length === 0 ? (
                <div className="emp-panel emp-empty">
                    <div className="emp-empty-icon">🎉</div>
                    <p>Bạn đã đăng ký tất cả sự kiện đang có! Hãy quay lại sau.</p>
                </div>
            ) : (
                <div className="emp-event-feed">
                    {discover.map(ev => <DiscoverCard key={ev.id} ev={ev} reg={!!myRegIds[ev.id]} busy={busy[ev.id]} onRegister={handleRegister} onCancel={handleCancel} />)}
                </div>
            )}

            {/* ── MODALS ── */}
            {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
            <Toast message={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </EmployeeLayout>
    );
}

// ── Event discover card ──────────────────────────────────────
function DiscoverCard({ ev, reg, busy, onRegister, onCancel }) {
    const s = STATUS_MAP[ev.status] || STATUS_MAP.draft;
    const pct = ev.capacity > 0 ? Math.round((ev.registered_count || 0) / ev.capacity * 100) : 0;
    const capColor = pct > 90 ? "var(--emp-red)" : pct > 70 ? "var(--emp-amber)" : "var(--emp-green)";
    const canReg = ["approved","running"].includes(ev.status);

    return (
        <div className={`emp-event-card${reg ? " registered" : ""}`}>
            <div className="emp-ec-header">
                <div className="emp-ec-icon" style={{ background: emojiBg(ev) }}>{eventEmoji(ev)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:"var(--emp-text3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                            {ev.event_type || "Sự kiện"}
                        </span>
                        <span className={`emp-badge ${s.cls}`}>{s.label}</span>
                        {reg && <span style={{ fontSize:11, color:"var(--emp-accent)", fontWeight:600 }}>✓ Đã đăng ký</span>}
                    </div>
                    <div className="emp-ec-title">{ev.name}</div>
                    <div className="emp-ec-meta">
                        <div className="emp-ec-meta-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                                <rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v4M11 1v4M2 7h12"/>
                            </svg>
                            {fmtDate(ev.start_date)}
                        </div>
                        {ev.location && (
                            <div className="emp-ec-meta-item">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                                    <circle cx="8" cy="6" r="2.5"/><path d="M8 1C5.2 1 3 3.3 3 6c0 4 5 9 5 9s5-5 5-9c0-2.7-2.2-5-5-5z"/>
                                </svg>
                                {ev.location}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="emp-ec-footer">
                {ev.capacity > 0 ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12, color:"var(--emp-text2)" }}>{ev.registered_count || 0}/{ev.capacity}</span>
                        <div className="emp-cap-bar">
                            <div className="emp-cap-fill" style={{ width:`${pct}%`, background:capColor }} />
                        </div>
                        <span style={{ fontSize:11, color:capColor, fontWeight:600 }}>{pct}%</span>
                    </div>
                ) : <div />}
                <div style={{ display:"flex", gap:8 }}>
                    {reg ? (
                        <button className="emp-btn emp-btn-cancel emp-btn-sm" disabled={busy}
                            onClick={() => onCancel(ev)}>
                            {busy ? "..." : "Huỷ đăng ký"}
                        </button>
                    ) : canReg ? (
                        <button className="emp-btn emp-btn-primary emp-btn-sm" disabled={busy}
                            onClick={() => onRegister(ev)}>
                            {busy ? "..." : "Đăng ký ngay"}
                        </button>
                    ) : (
                        <button className="emp-btn emp-btn-outline emp-btn-sm" disabled style={{ opacity:0.4 }}>
                            Chưa mở
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
