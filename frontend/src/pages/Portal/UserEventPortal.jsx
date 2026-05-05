import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import {
    checkRegistration,
    removeAttendee,
    selfRegister,
} from "../../services/attendeeService";
import { getEvents } from "../../services/eventService";
import "../../styles/global.css";
import "./portal.css";

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
    draft: { label: "Bản nháp", cls: "badge-default" },
    planning: { label: "Lên kế hoạch", cls: "badge-warning" },
    approved: { label: "Đã duyệt", cls: "badge-admin" },
    running: { label: "Đang diễn ra", cls: "badge-success" },
    completed: { label: "Hoàn thành", cls: "badge-default" },
    cancelled: { label: "Đã hủy", cls: "badge-danger" },
};

const QR_PAT = [
    1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1,
    1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0,
];

function QRMini({ onClick }) {
    return (
        <div className="portal-qr-mini" onClick={onClick} title="Xem QR lớn" style={{ background: "var(--bg-main)", borderRadius: 12, padding: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 1.5, width: 32 }}>
                {QR_PAT.map((v, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: 0.5, background: v ? "var(--text-primary)" : "#f1f5f9" }} />
                ))}
            </div>
        </div>
    );
}

function QRLarge({ value }) {
    const url = value
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&margin=10`
        : null;
    if (url) return <img src={url} alt="QR" style={{ borderRadius: 12, display: "block" }} />;
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 3, width: 120 }}>
            {QR_PAT.map((v, i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 1, background: v ? "var(--text-primary)" : "#f1f5f9" }} />
            ))}
        </div>
    );
}

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

export default function UserEventPortal() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [myAtIds, setMyAtIds] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState("all");
    const [qrModal, setQrModal] = useState(null);
    const [busy, setBusy] = useState({});
    const [search, setSearch] = useState("");

    const loadAll = async () => {
        setLoading(true);
        try {
            const evRes = await getEvents();
            const evList = evRes.data || [];
            setEvents(evList);

            const checks = await Promise.allSettled(
                evList.map(ev => checkRegistration(ev.id))
            );
            const map = {};
            checks.forEach((r, i) => {
                if (r.status === "fulfilled" && r.value?.data?.registered) {
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
            if (atId) await removeAttendee(atId);
            setMyAtIds(m => { const nm = { ...m }; delete nm[ev.id]; return nm; });
        } catch (err) {
            alert(err?.response?.data?.message || "Huỷ đăng ký thất bại");
        } finally {
            setBusy(b => ({ ...b, [ev.id]: false }));
        }
    };

    const openQR = (ev) => {
        const atData = myAtIds[ev.id];
        const code = atData?.qr_code || null;
        setQrModal({ eventName: ev.name, code });
    };

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

    const stats = [
        { val: registeredList.length, lbl: "Sự kiện đăng ký", color: "var(--color-primary)", bg: "var(--bg-main)" },
        { val: upcomingRegistered.length, lbl: "Sắp diễn ra", color: "#f59e0b", bg: "#fff7ed" },
        { val: registeredList.filter(e => e.status === "completed").length, lbl: "Đã hoàn thành", color: "#10b981", bg: "#ecfdf5" },
    ];

    const getEC = (ev) => TYPE_EMOJI[ev.event_type] || TYPE_EMOJI["Khác"];
    const getStatus = (ev) => STATUS_CFG[ev.status] || STATUS_CFG.draft;

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>🙋 Sự kiện của tôi</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Quản lý các sự kiện bạn đã tham gia và đang theo dõi</p>
                </div>
            </div>

            <div className="grid-3" style={{ gap: 24, marginBottom: 40 }}>
                {stats.map(s => (
                    <div className="card" key={s.lbl} style={{ padding: 24, borderRadius: 24, textAlign: "center", background: s.bg, border: "none" }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.lbl}</div>
                    </div>
                ))}
            </div>

            {upcomingRegistered.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⭐</span>
                        Sắp tới của bạn
                    </h3>
                    <div className="grid-2" style={{ gap: 24 }}>
                        {upcomingRegistered.slice(0, 4).map(ev => {
                            const code = `EVT-${ev.id}-${user?.id || "U"}`;
                            return (
                                <div className="card" key={ev.id} style={{ padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                        <div style={{ width: 56, height: 64, borderRadius: 16, background: "var(--color-primary)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <div style={{ fontSize: 20, fontWeight: 800 }}>{new Date(ev.start_date).getDate()}</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>T{new Date(ev.start_date).getMonth() + 1}</div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
                                            <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                                                🕒 {fmtTime(ev.start_date, ev.end_date)} • 📍 {ev.location || "Online"}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-main)", display: "flex", alignItems: "center", gap: 16, border: "1px solid #f1f5f9" }}>
                                        <QRMini onClick={() => openQR(ev)} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 2 }}>MÃ VÉ CỦA BẠN</div>
                                            <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>{code}</div>
                                        </div>
                                        <button className="btn btn-outline" style={{ borderRadius: 10, fontSize: 12, color: "#ef4444", borderColor: "#fecaca" }}
                                            disabled={busy[ev.id]} onClick={() => handleCancel(ev)}>Huỷ vé</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>Khám phá sự kiện</h3>
                    <div style={{ display: "flex", gap: 12, flex: 1, maxWidth: 600 }}>
                        <div className="portal-pill-row" style={{ marginBottom: 0 }}>
                            {[
                                { key: "all", label: "Tất cả" },
                                { key: "registered", label: "Đã đăng ký" },
                                { key: "upcoming", label: "Sắp diễn ra" },
                                { key: "running", label: "Đang diễn ra" },
                            ].map(t => (
                                <button key={t.key} className={`portal-pill${filterTab === t.key ? " active" : ""}`} onClick={() => setFilterTab(t.key)}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <input className="form-control" style={{ maxWidth: 240, borderRadius: 12 }} placeholder="🔍 Tìm kiếm sự kiện..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div className="card" style={{ padding: 80, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                        <div style={{ fontSize: 32 }}>⏳</div>
                        <p style={{ marginTop: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Đang tải danh sách sự kiện...</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="card" style={{ padding: 80, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                        <div style={{ fontSize: 32 }}>🎪</div>
                        <p style={{ marginTop: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Không tìm thấy sự kiện phù hợp.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {visible.map(ev => {
                            const ec = getEC(ev);
                            const st = getStatus(ev);
                            const reg = isRegistered(ev.id);
                            return (
                                <div key={ev.id} className="card" style={{ padding: 20, borderRadius: 24, border: reg ? "2px solid var(--color-primary)" : "1px solid #e2e8f0", transition: "all 0.2s" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: ec.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{ec.emoji}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{ev.event_type}</span>
                                                <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                                                {reg && <span className="badge badge-admin" style={{ fontSize: 10 }}>✓ Đã đăng ký</span>}
                                            </div>
                                            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{ev.name}</h4>
                                            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)" }}>
                                                <span>📅 {fmtDate(ev.start_date)}</span>
                                                <span>📍 {ev.location || "Chưa xác định"}</span>
                                                <span>🕒 {fmtTime(ev.start_date, ev.end_date)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Sức chứa: {ev.capacity || "—"}</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                {reg ? (
                                                    <>
                                                        <button className="btn btn-outline" style={{ borderRadius: 10, fontSize: 12, height: 36 }} onClick={() => openQR(ev)}>Mã QR</button>
                                                        <button className="btn btn-outline" style={{ borderRadius: 10, fontSize: 12, height: 36, color: "#ef4444", borderColor: "#fecaca" }}
                                                            disabled={busy[ev.id]} onClick={() => handleCancel(ev)}>Huỷ</button>
                                                    </>
                                                ) : (
                                                    <button className="btn btn-primary" style={{ borderRadius: 10, fontSize: 12, height: 36, padding: "0 20px" }}
                                                        disabled={busy[ev.id] || !['approved', 'running'].includes(ev.status)}
                                                        onClick={() => handleRegister(ev)}>
                                                        {busy[ev.id] ? "..." : "Đăng ký tham gia"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {qrModal && (
                <div className="modal-overlay" onClick={() => setQrModal(null)} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ maxWidth: 400, width: "90%", padding: 32, borderRadius: 32, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>🎫 Vé Check-in của bạn</h3>
                        <div style={{ background: "var(--bg-main)", padding: 24, borderRadius: 24, display: "inline-block", marginBottom: 24, border: "1px solid #f1f5f9" }}>
                            <QRLarge value={qrModal.code} />
                        </div>
                        <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{qrModal.eventName}</h4>
                        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.1em", marginBottom: 24 }}>{qrModal.code}</div>
                        <button className="btn btn-primary" style={{ width: "100%", height: 52, borderRadius: 14, fontWeight: 800 }} onClick={() => setQrModal(null)}>Đóng vé</button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
