import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations, selfRegister, removeAttendee } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/employee-theme.css";

const STATUS_MAP = {
    draft:     { label: "Chưa mở",      cls: "emp-badge-gray" },
    planning:  { label: "Lên kế hoạch", cls: "emp-badge-amber" },
    approved:  { label: "Đã duyệt",     cls: "emp-badge-purple" },
    running:   { label: "Đang diễn ra", cls: "emp-badge-green" },
    completed: { label: "Đã kết thúc",  cls: "emp-badge-gray" },
    cancelled: { label: "Đã huỷ",       cls: "emp-badge-red" },
};

const TYPE_LABELS = {
    seminar: "Hội thảo", party: "Tiệc công ty", training: "Đào tạo",
    workshop: "Workshop", meeting: "Họp toàn công ty", other: "Khác"
};

const EMOJI_MAP = { seminar:"🧠", party:"🎉", training:"📚", workshop:"🎨", meeting:"📊", other:"🎪" };

function eventEmoji(e) { return EMOJI_MAP[e.event_type] || "🎪"; }
function emojiBg(e) {
    const m = { seminar:"rgba(108,114,255,0.12)", party:"rgba(244,114,182,0.1)", training:"rgba(251,191,36,0.1)", workshop:"rgba(52,211,153,0.1)", meeting:"rgba(78,85,112,0.2)" };
    return m[e.event_type] || "rgba(108,114,255,0.12)";
}
const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", { weekday:"short", day:"numeric", month:"numeric", year:"numeric" }) : "—";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }) : "";

// ── QR Image Component ────────────────────────────────────
function QRImage({ value, size = 200 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" width={size} height={size} style={{ display:"block", borderRadius:10 }} />;
}

// ── QR Modal ───────────────────────────────────────────────
function QRModal({ reg, onClose }) {
    if (!reg) return null;

    const downloadQR = () => {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(reg.qr_code)}&margin=14`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `QR-${(reg.event_name || "").replace(/\s/g,"_")}.png`;
        a.click();
    };

    return (
        <div className="emp-modal-overlay" onClick={onClose}>
            <div className="emp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>🎟&nbsp; Vé check-in</div>
                    <button className="emp-btn-ghost" style={{ fontSize:16 }} onClick={onClose}>✕</button>
                </div>

                {/* QR Image */}
                <div style={{ textAlign:"center", marginBottom:16 }}>
                    <div style={{ display:"inline-block", background:"#fff", padding:14, borderRadius:14, border:"2px solid var(--emp-border2)", boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
                        <QRImage value={reg.qr_code} size={200} />
                    </div>
                </div>

                {/* Info */}
                <div style={{ background:"var(--emp-surface2)", borderRadius:"var(--emp-radius-sm)", padding:"12px 14px", marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{reg.event_name}</div>
                    <div style={{ fontSize:12, color:"var(--emp-text3)", fontFamily:"var(--emp-mono)", wordBreak:"break-all" }}>
                        {reg.qr_code}
                    </div>
                </div>

                <p style={{ fontSize:12, color:"var(--emp-text3)", textAlign:"center", margin:"0 0 14px" }}>
                    📋 Xuất trình mã này khi check-in. Không chia sẻ với người khác.
                </p>

                {/* Buttons */}
                <div style={{ display:"flex", gap:8 }}>
                    <button className="emp-btn emp-btn-outline" style={{ flex:1, justifyContent:"center" }} onClick={downloadQR}>⬇ Tải QR</button>
                    <button className="emp-btn emp-btn-primary" style={{ flex:1, justifyContent:"center" }} onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, color, onHide }) {
    useEffect(() => { if (msg) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); } }, [msg]);
    if (!msg) return null;
    return (
        <div className="emp-toast" style={{ borderColor:color, color }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5.5 8l2 2 3-3"/>
            </svg>
            <span>{msg}</span>
        </div>
    );
}

// ── Event Card ─────────────────────────────────────────────
function EventCard({ ev, reg, attRow, busy, onRegister, onCancel, onQR }) {
    const navigate = useNavigate();
    const s = STATUS_MAP[ev.status] || STATUS_MAP.draft;
    const pct = ev.capacity > 0 ? Math.round((ev.registered_count || 0) / ev.capacity * 100) : 0;
    const capColor = pct > 90 ? "var(--emp-red)" : pct > 70 ? "var(--emp-amber)" : "var(--emp-green)";
    const canReg = ["approved","running"].includes(ev.status);

    return (
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", transition: "transform 0.2s" }}>
            <div style={{ position: "relative", height: "80px", background: `linear-gradient(135deg, ${emojiBg(ev)} 0%, #f8fafc 100%)`, padding: "16px", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-20px", right: "-10px", fontSize: "80px", opacity: 0.2 }}>{eventEmoji(ev)}</div>
                <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 1 }}>
                    <span style={{ background: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", color: "#334155", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>{TYPE_LABELS[ev.event_type] || ev.event_type || "Sự kiện"}</span>
                    <span className={`emp-badge ${s.cls}`} style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>{s.label}</span>
                    {reg && <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", border: "1px solid #bbf7d0" }}>✓ Đã tham gia</span>}
                </div>
            </div>
            
            <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#1e293b", lineHeight: "1.4" }}>{ev.name}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                        <span style={{ fontSize: "16px" }}>📅</span> {fmtDate(ev.start_date)} - {fmtTime(ev.start_date)}
                    </div>
                    {ev.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                            <span style={{ fontSize: "16px" }}>📍</span> {ev.location}
                        </div>
                    )}
                </div>

                {ev.capacity > 0 && (
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: "600" }}>
                            <span>Sức chứa: {ev.registered_count || 0}/{ev.capacity}</span>
                            <span style={{ color: capColor }}>{pct}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: capColor, borderRadius: "3px", transition: "width 0.3s ease" }} />
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                    <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }} onClick={() => navigate(`/events/${ev.id}`)}>
                        👀 Chi tiết
                    </button>
                    
                    {reg ? (
                        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                            {attRow && (
                                <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #818cf8", background: "#e0e7ff", color: "#4338ca", fontWeight: "600", cursor: "pointer" }} onClick={() => onQR(attRow)}>
                                    📱 Mã QR
                                </button>
                            )}
                            <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", fontWeight: "600", cursor: "pointer" }} disabled={busy} onClick={() => onCancel(ev)}>
                                {busy ? "..." : "Huỷ"}
                            </button>
                        </div>
                    ) : canReg ? (
                        <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(to right, #4f46e5, #ec4899)", color: "white", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.3)" }} disabled={busy} onClick={() => onRegister(ev)}>
                            {busy ? "⏳ Chờ..." : "✨ Đăng ký ngay"}
                        </button>
                    ) : (
                        <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#f1f5f9", color: "#94a3b8", fontWeight: "600", cursor: "not-allowed" }} disabled>
                            {ev.status === "completed" ? "Đã kết thúc" : ev.status === "cancelled" ? "Đã huỷ" : "Chưa mở"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// EXPLORE EVENTS PAGE
// ══════════════════════════════════════════════════════════
export function EmployeeExplore() {
    const [allEvents, setAllEvents] = useState([]);
    const [myRegIds, setMyRegIds]   = useState({});
    const [busy, setBusy]           = useState({});
    const [qrReg, setQrReg]         = useState(null);
    const [toast, setToast]         = useState({ msg:"", color:"var(--emp-green)" });
    const [filterType, setFilterType] = useState("");
    const [sort, setSort]           = useState("");
    const [search, setSearch]       = useState("");
    const [unread, setUnread]       = useState(0);
    const searchRef                 = useRef(null);
    const [sp]                      = useSearchParams();

    const showToast = (msg, color = "var(--emp-green)") => setToast({ msg, color });

    useEffect(() => {
        const q = sp.get("q") || "";
        setSearch(q);
        if (searchRef.current) searchRef.current.value = q;
    }, []);

    useEffect(() => {
        const load = async () => {
            const [evRes, regRes, notifRes] = await Promise.all([
                getEvents().catch(() => ({ data: [] })),
                getMyRegistrations().catch(() => ({ data: [] })),
                getNotifications().catch(() => ({ data: [] })),
            ]);
            setAllEvents(evRes.data || []);
            const map = {};
            (regRes.data || []).forEach(r => { map[r.event_id] = r; });
            setMyRegIds(map);
            setUnread((notifRes.data || []).filter(n => !n.read_at).length);
        };
        load();
    }, []);

    const handleRegister = async (ev) => {
        if (busy[ev.id]) return;
        if (!["approved","running"].includes(ev.status)) {
            showToast("Sự kiện chưa mở đăng ký.", "var(--emp-amber)"); return;
        }
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            const res = await selfRegister(ev.id);
            const newAtt = { event_id:ev.id, event_name:ev.name, qr_code:res.data?.qr_code, ...res.data };
            setMyRegIds(m => ({ ...m, [ev.id]: newAtt }));
            showToast(`✓ Đăng ký thành công: ${ev.name}`);
        } catch (err) { showToast(err?.response?.data?.message || "Đăng ký thất bại", "var(--emp-red)"); }
        finally { setBusy(b => ({ ...b, [ev.id]: false })); }
    };

    const handleCancel = async (ev) => {
        if (!window.confirm(`Huỷ đăng ký "${ev.name}"?`)) return;
        const att = myRegIds[ev.id];
        if (!att?.id) return;
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            await removeAttendee(att.id);
            setMyRegIds(m => { const n = { ...m }; delete n[ev.id]; return n; });
            showToast(`Đã huỷ đăng ký: ${ev.name}`, "var(--emp-red)");
        } catch (err) { showToast(err?.response?.data?.message || "Huỷ thất bại", "var(--emp-red)"); }
        finally { setBusy(b => ({ ...b, [ev.id]: false })); }
    };

    // Filter + sort
    const TYPES = [
        { val:"", label:"Tất cả" },
        { val:"seminar", label:"Hội thảo" },
        { val:"training", label:"Đào tạo" },
        { val:"workshop", label:"Workshop" },
        { val:"party", label:"Tiệc" },
        { val:"meeting", label:"Họp" },
    ];

    let displayed = allEvents.filter(ev => {
        if (filterType && ev.event_type !== filterType) return false;
        if (search && !ev.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (sort === "cap-asc") displayed = [...displayed].sort((a,b) => ((a.capacity-a.registered_count||0)-(b.capacity-b.registered_count||0)));
    if (sort === "cap-desc") displayed = [...displayed].sort((a,b) => (b.registered_count||0)/b.capacity - (a.registered_count||0)/a.capacity);

    return (
        <EmployeeLayout title="Tất cả sự kiện" unreadCount={unread}>
            <div className="emp-pill-row">
                {TYPES.map(t => (
                    <button key={t.val} className={`emp-pill${filterType===t.val?" active":""}`} onClick={() => setFilterType(t.val)}>{t.label}</button>
                ))}
                <div style={{ marginLeft:"auto" }}>
                    <select className="emp-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="">Gần nhất</option>
                        <option value="cap-asc">Còn nhiều chỗ</option>
                        <option value="cap-desc">Sắp đầy</option>
                    </select>
                </div>
            </div>

            {displayed.length === 0 ? (
                <div className="emp-empty"><div className="emp-empty-icon">🔍</div><p>Không tìm thấy sự kiện nào.</p></div>
            ) : (
                <div className="emp-event-feed">
                    {displayed.map(ev => (
                        <EventCard key={ev.id} ev={ev} reg={!!myRegIds[ev.id]} attRow={myRegIds[ev.id]}
                            busy={busy[ev.id]} onRegister={handleRegister} onCancel={handleCancel} onQR={setQrReg} />
                    ))}
                </div>
            )}

            {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
            <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </EmployeeLayout>
    );
}

// ══════════════════════════════════════════════════════════
// MY EVENTS PAGE
// ══════════════════════════════════════════════════════════
export function EmployeeMyEvents() {
    const [allEvents, setAllEvents] = useState([]);
    const [myRegIds, setMyRegIds]   = useState({});
    const [myRegs, setMyRegs]       = useState([]);
    const [busy, setBusy]           = useState({});
    const [qrReg, setQrReg]         = useState(null);
    const [toast, setToast]         = useState({ msg:"", color:"var(--emp-green)" });
    const [tab, setTab]             = useState("all");
    const [unread, setUnread]       = useState(0);
    const [sp]                      = useSearchParams();

    const showToast = (msg, color = "var(--emp-green)") => setToast({ msg, color });

    useEffect(() => {
        const t = sp.get("tab");
        if (t) setTab(t);
        const load = async () => {
            const [evRes, regRes, notifRes] = await Promise.all([
                getEvents().catch(() => ({ data: [] })),
                getMyRegistrations().catch(() => ({ data: [] })),
                getNotifications().catch(() => ({ data: [] })),
            ]);
            setAllEvents(evRes.data || []);
            const regList = regRes.data || [];
            setMyRegs(regList);
            const map = {};
            regList.forEach(r => { map[r.event_id] = r; });
            setMyRegIds(map);
            setUnread((notifRes.data || []).filter(n => !n.read_at).length);
        };
        load();
    }, []);

    const handleCancel = async (ev) => {
        if (!window.confirm(`Huỷ đăng ký "${ev.name}"?`)) return;
        const att = myRegIds[ev.id];
        if (!att?.id) return;
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            await removeAttendee(att.id);
            setMyRegIds(m => { const n = { ...m }; delete n[ev.id]; return n; });
            setMyRegs(r => r.filter(x => x.event_id !== ev.id));
            showToast(`Đã huỷ đăng ký: ${ev.name}`, "var(--emp-red)");
        } catch (err) { showToast(err?.response?.data?.message || "Huỷ thất bại", "var(--emp-red)"); }
        finally { setBusy(b => ({ ...b, [ev.id]: false })); }
    };

    // Filter events I registered for
    const now = new Date();
    const regEventIds = new Set(myRegs.map(r => r.event_id));
    const myEvents = allEvents.filter(ev => regEventIds.has(ev.id));

    const TABS = [
        { val:"all",     label:"Tất cả" },
        { val:"upcoming",label:"Sắp tới" },
        { val:"done",    label:"Đã tham dự" },
        { val:"cancelled", label:"Đã huỷ" },
    ];

    const filtered = myEvents.filter(ev => {
        const att = myRegIds[ev.id];
        if (tab === "upcoming") return ev.start_date && new Date(ev.start_date) > now && !att?.checked_in;
        if (tab === "done") return att?.checked_in || ev.status === "completed";
        if (tab === "cancelled") return ev.status === "cancelled";
        return true;
    });

    return (
        <EmployeeLayout title="Sự kiện của tôi" unreadCount={unread}>
            <div className="emp-pill-row">
                {TABS.map(t => (
                    <button key={t.val} className={`emp-pill${tab===t.val?" active":""}`} onClick={() => setTab(t.val)}>{t.label}</button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="emp-empty">
                    <div className="emp-empty-icon">🎪</div>
                    <p>{tab === "all" ? "Bạn chưa đăng ký sự kiện nào." : "Không có sự kiện trong mục này."}</p>
                </div>
            ) : (
                <div className="emp-event-feed">
                    {filtered.map(ev => (
                        <EventCard key={ev.id} ev={ev} reg={!!myRegIds[ev.id]} attRow={myRegIds[ev.id]}
                            busy={busy[ev.id]} onRegister={() => {}} onCancel={handleCancel} onQR={setQrReg} />
                    ))}
                </div>
            )}

            {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
            <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </EmployeeLayout>
    );
}
