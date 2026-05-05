import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations, selfRegister, removeAttendee } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/global.css";

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
        <div className="modal-overlay" onClick={onClose} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
            <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: "90%", padding: 32, borderRadius: 28, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>🎫 Vé Check-in</h3>
                    <button className="btn btn-outline" style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }} onClick={onClose}>✕</button>
                </div>

                <div style={{ background: "#fff", padding: 20, borderRadius: 24, border: "2px solid #f1f5f9", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", display: "inline-block", marginBottom: 24 }}>
                    <QRImage value={reg.qr_code} size={220} />
                </div>

                <div style={{ background: "var(--bg-main)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: "var(--text-primary)" }}>{reg.event_name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace", letterSpacing: "0.05em", background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        {reg.qr_code}
                    </div>
                </div>

                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
                    📌 Vui lòng xuất trình mã này tại quầy đón tiếp để thực hiện check-in vào sự kiện.
                </p>

                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" style={{ flex: 1, height: 52, borderRadius: 14, fontWeight: 700 }} onClick={downloadQR}>⬇ Tải về máy</button>
                    <button className="btn btn-primary" style={{ flex: 1, height: 52, borderRadius: 14, fontWeight: 800 }} onClick={onClose}>Hoàn tất</button>
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
        <div className="toast-container" style={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000, animation: "slideIn 0.3s ease-out" }}>
            <div className="card" style={{ padding: "16px 24px", borderRadius: 16, border: `1px solid ${color}`, background: "#fff", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{msg}</span>
            </div>
        </div>
    );
}

// ── Event Card ─────────────────────────────────────────────
function EventCard({ ev, reg, attRow, busy, onRegister, onCancel, onQR }) {
    const navigate = useNavigate();
    const s = STATUS_MAP[ev.status] || STATUS_MAP.draft;
    const pct = ev.capacity > 0 ? Math.round((ev.registered_count || 0) / ev.capacity * 100) : 0;
    const capColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981";
    const canReg = ["approved","running"].includes(ev.status);

    return (
        <div className="card" style={{ padding: 24, borderRadius: 24, border: "1px solid var(--border-color)", transition: "all 0.3s" }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{eventEmoji(ev)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                        <span className={`badge ${ev.status === 'approved' ? 'badge-admin' : ev.status === 'running' ? 'badge-success' : 'badge-default'}`} style={{ fontSize: 10 }}>{s.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{ev.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>📅</span> {fmtDate(ev.start_date)}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>🕒</span> {fmtTime(ev.start_date)}
                        </div>
                        {ev.location && (
                            <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span>📍</span> {ev.location}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ background: "var(--bg-main)", padding: 16, borderRadius: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Chỗ ngồi còn lại</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: capColor }}>{ev.registered_count || 0}/{ev.capacity} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: capColor, borderRadius: 10 }} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                {reg && attRow && (
                    <button className="btn btn-outline" style={{ height: 48, padding: "0 16px", borderRadius: 12 }} onClick={() => onQR(attRow)}>📱 Vé QR</button>
                )}
                {reg ? (
                    <button className="btn btn-outline" style={{ flex: 1, height: 48, borderRadius: 12, color: "#ef4444", borderColor: "#fecaca" }} disabled={busy} onClick={() => onCancel(ev)}>
                        {busy ? "..." : "Huỷ đăng ký"}
                    </button>
                ) : canReg ? (
                    <button className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 12, fontWeight: 800 }} disabled={busy} onClick={() => onRegister(ev)}>
                        {busy ? "..." : "Đăng ký tham gia"}
                    </button>
                ) : (
                    <button className="btn btn-outline" style={{ flex: 1, height: 48, borderRadius: 12, opacity: 0.5 }} disabled>
                        {ev.status === "completed" ? "Đã kết thúc" : "Chưa mở"}
                    </button>
                )}
                <button className="btn btn-outline" style={{ height: 48, padding: "0 20px", borderRadius: 12, fontWeight: 700 }} onClick={() => navigate(`/events/${ev.id}`)}>Chi tiết</button>
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
    const [toast, setToast]         = useState({ msg:"", color:"#10b981" });
    const [filterType, setFilterType] = useState("");
    const [sort, setSort]           = useState("");
    const [search, setSearch]       = useState("");
    const [unread, setUnread]       = useState(0);
    const searchRef                 = useRef(null);
    const [sp]                      = useSearchParams();

    const showToast = (msg, color = "#10b981") => setToast({ msg, color });

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
            showToast("Sự kiện chưa mở đăng ký.", "#f59e0b"); return;
        }
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            const res = await selfRegister(ev.id);
            const newAtt = { event_id:ev.id, event_name:ev.name, qr_code:res.data?.qr_code, ...res.data };
            setMyRegIds(m => ({ ...m, [ev.id]: newAtt }));
            showToast(`✓ Đăng ký thành công: ${ev.name}`);
        } catch (err) { showToast(err?.response?.data?.message || "Đăng ký thất bại", "#ef4444"); }
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
            showToast(`Đã huỷ đăng ký: ${ev.name}`, "#ef4444");
        } catch (err) { showToast(err?.response?.data?.message || "Huỷ thất bại", "#ef4444"); }
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
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Khám phá Sự kiện</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Tìm kiếm và đăng ký tham gia các hoạt động nội bộ công ty</p>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 6, borderRadius: 14 }}>
                    {TYPES.map(t => (
                        <button key={t.val} 
                            onClick={() => setFilterType(t.val)}
                            style={{ 
                                padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                                background: filterType === t.val ? "#fff" : "transparent",
                                color: filterType === t.val ? "var(--color-primary)" : "var(--text-muted)",
                                boxShadow: filterType === t.val ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                                transition: "all 0.2s"
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                
                <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                    <select className="form-control" style={{ width: 180, borderRadius: 12, height: 44 }} value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="">Mặc định (Gần nhất)</option>
                        <option value="cap-asc">Còn nhiều chỗ trống</option>
                        <option value="cap-desc">Sắp hết chỗ (Hot)</option>
                    </select>
                </div>
            </div>

            {displayed.length === 0 ? (
                <div className="card" style={{ padding: 80, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>Không tìm thấy sự kiện nào phù hợp.</p>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: 24 }}>
                    {displayed.map(ev => (
                        <EventCard key={ev.id} ev={ev} reg={!!myRegIds[ev.id]} attRow={myRegIds[ev.id]}
                            busy={busy[ev.id]} onRegister={handleRegister} onCancel={handleCancel} onQR={setQrReg} />
                    ))}
                </div>
            )}

            {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
            <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </Layout>
    );
}

export function EmployeeMyEvents() {
    const [allEvents, setAllEvents] = useState([]);
    const [myRegIds, setMyRegIds]   = useState({});
    const [myRegs, setMyRegs]       = useState([]);
    const [busy, setBusy]           = useState({});
    const [qrReg, setQrReg]         = useState(null);
    const [toast, setToast]         = useState({ msg:"", color:"#10b981" });
    const [tab, setTab]             = useState("all");
    const [unread, setUnread]       = useState(0);
    const [sp]                      = useSearchParams();

    const showToast = (msg, color = "#10b981") => setToast({ msg, color });

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
            showToast(`Đã huỷ đăng ký: ${ev.name}`, "#ef4444");
        } catch (err) { showToast(err?.response?.data?.message || "Huỷ thất bại", "#ef4444"); }
        finally { setBusy(b => ({ ...b, [ev.id]: false })); }
    };

    const now = new Date();
    const regEventIds = new Set(myRegs.map(r => r.event_id));
    const myEvents = allEvents.filter(ev => regEventIds.has(ev.id));

    const TABS = [
        { val:"all",     label:"Tất cả sự kiện" },
        { val:"upcoming",label:"Sắp diễn ra" },
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
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Sự kiện của tôi</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Quản lý vé mời và các hoạt động bạn đã đăng ký tham gia</p>
                </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 32, background: "#f1f5f9", padding: 6, borderRadius: 14, alignSelf: "flex-start", width: "fit-content" }}>
                {TABS.map(t => (
                    <button key={t.val} 
                        onClick={() => setTab(t.val)}
                        style={{ 
                            padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                            background: tab === t.val ? "#fff" : "transparent",
                            color: tab === t.val ? "var(--color-primary)" : "var(--text-muted)",
                            boxShadow: tab === t.val ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s"
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ padding: 80, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎪</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>{tab === "all" ? "Bạn chưa đăng ký sự kiện nào." : "Không có sự kiện nào trong mục này."}</p>
                    <button className="btn btn-primary" style={{ marginTop: 24, borderRadius: 12 }} onClick={() => setTab("all")}>Quay lại tất cả</button>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: 24 }}>
                    {filtered.map(ev => (
                        <EventCard key={ev.id} ev={ev} reg={!!myRegIds[ev.id]} attRow={myRegIds[ev.id]}
                            busy={busy[ev.id]} onRegister={() => {}} onCancel={handleCancel} onQR={setQrReg} />
                    ))}
                </div>
            )}

            {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
            <Toast msg={toast.msg} color={toast.color} onHide={() => setToast(t => ({ ...t, msg:"" }))} />
        </Layout>
    );
}
