import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";
import { getEvents } from "../../services/eventService";
import "../../styles/global.css";

export default function CheckinScanner() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelected] = useState("");
    const [qr, setQr] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [guestList, setGuestList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [tab, setTab] = useState("scanner");
    const inputRef = useRef(null);

    /* Load events */
    useEffect(() => {
        getEvents().then(r => {
            const list = r.data || [];
            setEvents(list);
            if (list.length > 0) setSelected(String(list[0].id));
        }).catch(() => { });
    }, []);

    /* Load stats + guest list khi chọn event */
    useEffect(() => {
        if (!selectedEvent) return;
        api.get(`/checkin/stats/${selectedEvent}`)
            .then(r => setStats(r.data))
            .catch(() => setStats(null));
        loadGuestList();
    }, [selectedEvent]);

    const loadGuestList = async () => {
        if (!selectedEvent) return;
        setLoadingList(true);
        try {
            const r = await api.get(`/checkin/list/${selectedEvent}`);
            setGuestList(r.data || []);
        } catch {/**/ }
        finally { setLoadingList(false); }
    };

    const checkin = async (e) => {
        e.preventDefault();
        if (!qr.trim()) return;
        if (!selectedEvent) {
            setMessage({ type: "error", text: "❌ Please select an event first." });
            return;
        }
        setLoading(true); setMessage(null);
        try {
            const res = await api.post("/checkin", { qr_code: qr, event_id: selectedEvent });
            const guest = res.data.guest;
            setMessage({ type: "success", text: `✅ Welcome, ${guest.name}! (${guest.event_name})` });
            setHistory(p => [{
                qr, name: guest.name, event: guest.event_name,
                time: new Date().toLocaleTimeString(), ok: true
            }, ...p.slice(0, 19)]);
            setQr("");
            // Refresh stats & list
            const [sR, lR] = await Promise.all([
                api.get(`/checkin/stats/${selectedEvent}`),
                api.get(`/checkin/list/${selectedEvent}`)
            ]);
            setStats(sR.data);
            setGuestList(lR.data || []);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Check-in failed";
            setMessage({ type: "error", text: "❌ " + errMsg });
            setHistory(p => [{
                qr, name: qr, event: "—",
                time: new Date().toLocaleTimeString(), ok: false, error: errMsg
            }, ...p.slice(0, 19)]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const pct = stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0;
    const currentEvent = events.find(e => String(e.id) === String(selectedEvent));

    return (
        <Layout>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>Check-in</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Scan guest QR codes — gắn với từng sự kiện
                    </p>
                </div>
                {/* Event selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Event:</span>
                    <select className="form-control" style={{ minWidth: 240 }}
                        value={selectedEvent} onChange={e => setSelected(e.target.value)}>
                        <option value="">-- Chọn sự kiện --</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.name} {ev.status === "running" ? "🟢" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Event banner */}
            {currentEvent && (
                <div style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    borderRadius: 12, padding: "14px 20px", marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Current Event
                        </p>
                        <h3 style={{ color: "white", fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                            🎪 {currentEvent.name}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                            📅 {new Date(currentEvent.start_date || currentEvent.date).toLocaleDateString("vi-VN")}
                            {currentEvent.location && ` · 📍 ${currentEvent.location}`}
                        </p>
                    </div>
                    {stats && (
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "white", lineHeight: 1 }}>{pct}%</div>
                            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                                {stats.checkedIn}/{stats.total} checked in
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["scanner", "guests", "history"].map(t => (
                    <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-outline"} btn-sm`}
                        onClick={() => setTab(t)}>
                        {t === "scanner" && "📷 Scanner"}
                        {t === "guests" && `👥 Guest List ${stats ? `(${stats.total})` : ""}`}
                        {t === "history" && `📋 History ${history.length > 0 ? `(${history.length})` : ""}`}
                    </button>
                ))}
            </div>

            {/* ===== TAB: SCANNER ===== */}
            {tab === "scanner" && (
                <div className="grid-2" style={{ alignItems: "start" }}>
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                            📷 Scan QR Code
                        </h3>
                        {message && (
                            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
                                style={{ marginBottom: 16 }}>
                                {message.text}
                            </div>
                        )}
                        {!selectedEvent && (
                            <div className="alert alert-error" style={{ marginBottom: 16 }}>
                                ⚠️ Vui lòng chọn sự kiện trước khi scan.
                            </div>
                        )}
                        <form onSubmit={checkin}>
                            <div className="form-group">
                                <label style={{ fontWeight: 600 }}>Guest QR Code</label>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <input
                                        ref={inputRef}
                                        className="form-control"
                                        placeholder="Scan hoặc nhập mã QR..."
                                        value={qr}
                                        onChange={e => setQr(e.target.value)}
                                        autoFocus
                                        disabled={loading || !selectedEvent}
                                        style={{ fontFamily: "monospace" }}
                                    />
                                    <button type="submit" className="btn btn-primary"
                                        disabled={loading || !qr.trim() || !selectedEvent}
                                        style={{ flexShrink: 0, minWidth: 90 }}>
                                        {loading ? "⏳" : "✅ Check in"}
                                    </button>
                                </div>
                                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                                    💡 Kết nối đầu đọc QR USB — máy sẽ tự nhập mã vào ô trên.
                                    QR của guest chỉ có thể dùng cho đúng sự kiện đã đăng ký.
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="card-stat">
                            <div className="card-stat-icon emerald">✅</div>
                            <div className="card-stat-info">
                                <h3>{stats?.checkedIn ?? "—"}</h3>
                                <p>Checked In</p>
                            </div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-icon rose">⏳</div>
                            <div className="card-stat-info">
                                <h3>{stats?.notCheckedIn ?? "—"}</h3>
                                <p>Pending</p>
                            </div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-icon cyan">🎟️</div>
                            <div className="card-stat-info">
                                <h3>{stats?.total ?? "—"}</h3>
                                <p>Total Registered</p>
                            </div>
                        </div>
                        {stats && (
                            <div className="card" style={{ padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>Attendance Rate</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)" }}>{pct}%</span>
                                </div>
                                <div style={{ height: 10, background: "var(--border-color)", borderRadius: 5, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", width: `${pct}%`,
                                        background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                                        borderRadius: 5, transition: "width 0.6s ease"
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TAB: GUESTS ===== */}
            {tab === "guests" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Guest List — {currentEvent?.name || "Select event"}</h3>
                        <button className="btn btn-outline btn-sm" onClick={loadGuestList}>↻ Refresh</button>
                    </div>
                    {!selectedEvent ? (
                        <div className="empty-state"><span>🎪</span><p>Select an event to view guests</p></div>
                    ) : loadingList ? (
                        <div className="empty-state"><span>⏳</span><p>Loading...</p></div>
                    ) : guestList.length === 0 ? (
                        <div className="empty-state"><span>🎟️</span><p>No guests registered for this event</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {guestList.map((g, i) => (
                                    <tr key={g.id} style={g.checked_in ? { background: "rgba(16,185,129,0.04)" } : {}}>
                                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {g.checked_in ? "✅" : "⏳"} {g.name}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                        <td>{g.phone || "—"}</td>
                                        <td>
                                            {g.checked_in
                                                ? <span className="badge badge-success">Checked In</span>
                                                : <span className="badge badge-default">Pending</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ===== TAB: HISTORY ===== */}
            {tab === "history" && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Scan History (this session)</h3>
                        {history.length > 0 && (
                            <button className="btn btn-outline btn-sm" onClick={() => setHistory([])}>Clear</button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="empty-state"><span>📋</span><p>No scans yet this session</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Time</th><th>Name</th><th>Event</th><th>QR Code</th><th>Result</th></tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{h.time}</td>
                                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{h.event}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{h.qr}</td>
                                        <td>
                                            {h.ok
                                                ? <span className="badge badge-success">✓ Success</span>
                                                : <span className="badge badge-danger" title={h.error}>✗ Failed</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </Layout>
    );
}
