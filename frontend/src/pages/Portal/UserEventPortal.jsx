import { useContext, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import {
    checkRegistration,
    getAttendeesByEvent,
    removeAttendee,
    selfRegister,
} from "../../services/attendeeService";
import { getEvents } from "../../services/eventService";
import "../../styles/global.css";
import "./portal.css";

// ── Màu emoji theo loại sự kiện ───────────────────────────────
const TYPE_EMOJI = {
    "Hội thảo": { emoji: "🧠", bg: "#EEEDFE" },
    "Hội nghị": { emoji: "🎙️", bg: "#E1F5EE" },
    "Tiệc nội bộ": { emoji: "🎉", bg: "#FBEAF0" },
    "Team building": { emoji: "🤝", bg: "#FFF4E3" },
    "Ra mắt sản phẩm": { emoji: "🚀", bg: "#E3F0FF" },
    "Đào tạo": { emoji: "📚", bg: "#FAEEDA" },
    Workshop: { emoji: "🎨", bg: "#E1F5EE" },
    Khác: { emoji: "📋", bg: "#F0EEE9" },
};

const STATUS_CFG = {
    draft: { label: "Bản nháp", cls: "badge-gray" },
    planning: { label: "Lên kế hoạch", cls: "badge-purple" },
    approved: { label: "Đã duyệt", cls: "badge-blue" },
    running: { label: "Đang diễn ra", cls: "badge-green" },
    completed: { label: "Hoàn thành", cls: "badge-gray" },
    cancelled: { label: "Đã hủy", cls: "badge-red" },
};

// ── QR mini pattern trang trí ──────────────────────────────────
const QR_PAT = [
    1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1,
    1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0,
];

function QRMini({ onClick }) {
    return (
        <div className="portal-qr-mini" onClick={onClick} title="Xem QR lớn">
            <div className="portal-qr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 1.5, width: 36 }}>
                {QR_PAT.map((v, i) => (
                    <div key={i} style={{
                        width: 4, height: 4, borderRadius: 0.5,
                        background: v ? "#1A1917" : "#F0EEE9",
                    }} />
                ))}
            </div>
        </div>
    );
}

function QRLarge({ value }) {
    const url = value
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&margin=10`
        : null;
    if (url) return <img src={url} alt="QR" style={{ borderRadius: 10, display: "block" }} />;
    // fallback pattern decoratif
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 3, width: 120 }}>
            {QR_PAT.map((v, i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 1, background: v ? "#1A1917" : "#F0EEE9" }} />
            ))}
        </div>
    );
}

// ── Format ngày giờ ────────────────────────────────────────────
function fmtDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(start, end) {
    if (!start) return "";
    const s = new Date(start).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const e = end ? new Date(end).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
    return e ? `${s}–${e}` : s;
}

// ── Capacity bar ────────────────────────────────────────────────
function CapBar({ registered, capacity }) {
    const pct = capacity > 0 ? Math.min(Math.round((registered / capacity) * 100), 100) : 0;
    const color = pct > 90 ? "#A32D2D" : pct > 70 ? "#854F0B" : "#0F6E56";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{registered}/{capacity} người</span>
            <div style={{ width: 70, height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color, fontWeight: 600 }}>{pct}%</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
export default function UserEventPortal() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [myAtIds, setMyAtIds] = useState({}); // { eventId: attendeeId }
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState("all");
    const [qrModal, setQrModal] = useState(null); // { eventName, code }
    const [busy, setBusy] = useState({});
    const [search, setSearch] = useState("");

    // Load events + kiểm tra đăng ký
    const loadAll = async () => {
        setLoading(true);
        try {
            const evRes = await getEvents();
            const evList = evRes.data || [];
            setEvents(evList);

            // Kiểm ra event nào user đã đăng ký
            const checks = await Promise.allSettled(
                evList.map(ev => checkRegistration(ev.id))
            );
            const map = {};
            checks.forEach((r, i) => {
                if (r.status === "fulfilled" && r.value?.data?.registered) {
                    // Lưu cả attendee_id và qr_code thực tế từ server
                    map[evList[i].id] = {
                        id: r.value.data.attendee?.id ?? null,
                        qr_code: r.value.data.attendee?.qr_code ?? null,
                    };
                }
            });
            setMyAtIds(map);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadAll(); }, []);

    const isRegistered = (evId) => !!myAtIds[evId];

    const handleRegister = async (ev) => {
        if (busy[ev.id]) return;
        // Chỉ cho đăng ký khi sự kiện đã được duyệt hoặc đang diễn ra
        if (!['approved', 'running'].includes(ev.status)) {
            alert('Sự kiện chưa mở đăng ký.');
            return;
        }
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            const res = await selfRegister(ev.id);
            setMyAtIds(m => ({ ...m, [ev.id]: {
                id: res?.data?.id ?? null,
                qr_code: res?.data?.qr_code ?? null
            }}));
        } catch (err) {
            alert(err?.response?.data?.message || "Đăng ký thất bại");
        } finally {
            setBusy(b => ({ ...b, [ev.id]: false }));
        }
    };

    const handleCancel = async (ev) => {
        if (!window.confirm(`Huỷ đăng ký "${ev.name}"?`)) return;
        if (busy[ev.id]) return;
        setBusy(b => ({ ...b, [ev.id]: true }));
        try {
            const atData = myAtIds[ev.id];
            const atId = atData?.id ?? atData;
            if (typeof atId === "number") await removeAttendee(atId);
            setMyAtIds(m => { const nm = { ...m }; delete nm[ev.id]; return nm; });
        } catch (err) {
            alert(err?.response?.data?.message || "Huỷ đăng ký thất bại");
        } finally {
            setBusy(b => ({ ...b, [ev.id]: false }));
        }
    };

    // Mở modal QR với mã thực tế từ server
    const openQR = (ev) => {
        const atData = myAtIds[ev.id];
        const code = atData?.qr_code || null;
        setQrModal({ eventName: ev.name, code });
    };

    // ── Lọc ──────────────────────────────────────────────────────
    const visible = events
        .filter(ev => !["cancelled", "draft"].includes(ev.status))
        .filter(ev => ev.name.toLowerCase().includes(search.toLowerCase()))
        .filter(ev => {
            if (filterTab === "registered") return isRegistered(ev.id);
            if (filterTab === "upcoming") return ["planning", "approved"].includes(ev.status);
            if (filterTab === "running") return ev.status === "running";
            return true;
        });

    const registeredList = events.filter(ev => isRegistered(ev.id));
    const upcomingRegistered = registeredList.filter(ev => ["planning", "approved", "running"].includes(ev.status));

    // ── Stats ─────────────────────────────────────────────────────
    const stats = [
        { val: registeredList.length, lbl: "Đã đăng ký", color: "var(--color-primary)" },
        { val: upcomingRegistered.length, lbl: "Sắp diễn ra", color: "#0F6E56" },
        { val: registeredList.filter(e => e.status === "completed").length, lbl: "Đã tham dự", color: "var(--text-secondary)" },
    ];

    const getEC = (ev) => TYPE_EMOJI[ev.event_type] || TYPE_EMOJI["Khác"];
    const getStatus = (ev) => STATUS_CFG[ev.status] || STATUS_CFG.draft;

    return (
        <Layout>
            {/* ── Page Header ── */}
            <div className="page-header">
                <div>
                    <h2>🙋 Sự kiện của tôi</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Xin chào, <strong>{user?.name || "Bạn"}</strong> — Khám phá và đăng ký tham dự sự kiện công ty
                    </p>
                </div>
            </div>

            {/* ── Stat Strip ── */}
            <div className="portal-stat-strip">
                {stats.map(s => (
                    <div className="portal-stat-box" key={s.lbl}>
                        <div className="portal-stat-val" style={{ color: s.color }}>{s.val}</div>
                        <div className="portal-stat-lbl">{s.lbl}</div>
                    </div>
                ))}
            </div>

            {/* ── Sự kiện đã đăng ký sắp tới ── */}
            {upcomingRegistered.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 className="portal-section-title">Sự kiện của tôi sắp tới</h3>
                    </div>
                    <div className="portal-upcoming-grid">
                        {upcomingRegistered.slice(0, 4).map(ev => {
                            const ec = getEC(ev);
                            const code = `EVT-${ev.id}-${user?.id || "U"}`;
                            return (
                                <div className="portal-my-card" key={ev.id}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                        <div className="portal-date-block" style={{ background: "var(--color-primary-light)" }}>
                                            <div className="portal-date-day">{new Date(ev.start_date).getDate()}</div>
                                            <div className="portal-date-mo">{new Date(ev.start_date).toLocaleDateString("vi-VN", { month: "short" })}</div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {ev.name}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                                {fmtTime(ev.start_date, ev.end_date)} · {ev.location || "—"}
                                            </div>
                                            <span className={`portal-badge ${getStatus(ev).cls}`} style={{ marginTop: 6, display: "inline-block" }}>
                                                ✓ Đã đăng ký
                                            </span>
                                        </div>
                                    </div>
                                    <div className="portal-ticket-row">
                                        <QRMini onClick={() => openQR(ev)} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Mã vé của bạn</div>
                                            <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{code}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Nhấn QR để phóng to</div>
                                        </div>
                                        <button className="btn btn-cancel btn-sm"
                                            disabled={busy[ev.id]}
                                            onClick={() => handleCancel(ev)}>
                                            Huỷ
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Khám phá sự kiện ── */}
            <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <h3 className="portal-section-title">Tất cả sự kiện</h3>
                    <input className="form-control"
                        style={{ maxWidth: 240, fontSize: 13 }}
                        placeholder="🔍 Tìm sự kiện..."
                        value={search}
                        onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Pills Filter */}
                <div className="portal-pill-row">
                    {[
                        { key: "all", label: "Tất cả" },
                        { key: "registered", label: "Đã đăng ký" },
                        { key: "upcoming", label: "Sắp diễn ra" },
                        { key: "running", label: "Đang diễn ra" },
                    ].map(t => (
                        <button key={t.key}
                            className={`portal-pill${filterTab === t.key ? " active" : ""}`}
                            onClick={() => setFilterTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tải sự kiện...</p></div>
                ) : visible.length === 0 ? (
                    <div className="empty-state"><span>🎪</span><p>Không có sự kiện nào.</p></div>
                ) : (
                    <div className="portal-event-feed">
                        {visible.map(ev => {
                            const ec = getEC(ev);
                            const st = getStatus(ev);
                            const reg = isRegistered(ev.id);
                            const cap = ev.capacity || 0;
                            const filled = 0; // API chưa trả registered count trong list
                            const canReg = !reg && ['approved', 'running'].includes(ev.status);
                            return (
                                <div key={ev.id} className={`portal-event-card${reg ? " registered" : ""}`}>
                                    <div className="portal-ec-header">
                                        <div className="portal-ec-icon" style={{ background: ec.bg }}>{ec.emoji}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                                                <span className="portal-ec-type">{ev.event_type || "Sự kiện"}</span>
                                                <span className={`portal-badge ${st.cls}`}>{st.label}</span>
                                                {reg && <span className="portal-reg-mark">✓ Đã đăng ký</span>}
                                            </div>
                                            <div className="portal-ec-title">{ev.name}</div>
                                            <div className="portal-ec-meta">
                                                <span>📅 {fmtDate(ev.start_date)}</span>
                                                <span>📍 {ev.location || "—"}</span>
                                                <span>⏰ {fmtTime(ev.start_date, ev.end_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="portal-ec-footer">
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                            Sức chứa: {ev.capacity || "—"} người
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {reg ? (
                                                <>
                                                    <button className="btn btn-outline btn-sm"
                                                        onClick={() => openQR(ev)}>
                                                        📱 Mã QR
                                                    </button>
                                                    <button className="btn btn-cancel btn-sm"
                                                        disabled={busy[ev.id]}
                                                        onClick={() => handleCancel(ev)}>
                                                        Huỷ đăng ký
                                                    </button>
                                                </>
                                            ) : ev.status !== "draft" ? (
                                                <button className="btn btn-primary btn-sm"
                                                    disabled={busy[ev.id]}
                                                    onClick={() => handleRegister(ev)}>
                                                    {busy[ev.id] ? "..." : "Đăng ký ngay"}
                                                </button>
                                            ) : (
                                                <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5 }}>
                                                    Chưa mở
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── QR Modal ── */}
            {qrModal && (
                <div className="portal-modal-overlay" onClick={() => setQrModal(null)}>
                    <div className="portal-modal" onClick={e => e.stopPropagation()}>
                        <div className="portal-modal-title">🎫 Mã QR Check-in</div>
                        <div style={{ textAlign: "center", padding: "16px 0" }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 200, height: 200, background: "var(--bg-main)",
                                borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden"
                            }}>
                                <QRLarge value={qrModal.code} />
                            </div>
                            <div className="portal-modal-event">{qrModal.eventName}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: 8 }}>
                                {qrModal.code}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>Xuất trình mã này khi check-in</p>
                        </div>
                        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                            onClick={() => setQrModal(null)}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
