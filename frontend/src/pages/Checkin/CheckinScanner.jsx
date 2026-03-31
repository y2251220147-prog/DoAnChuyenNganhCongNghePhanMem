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
            const active = list.find(e => ["running", "approved"].includes(e.status));
            if (active) setSelected(String(active.id));
            else if (list.length > 0) setSelected(String(list[0].id));
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
            setMessage({ type: "error", text: "❌ Vui lòng chọn sự kiện trước khi check-in." });
            return;
        }
        setLoading(true); setMessage(null);
        try {
            const res = await api.post("/checkin", { qr_code: qr, event_id: selectedEvent });
            // Backend trả về result.person (không phải result.guest)
            const person = res.data.person;
            const isEmployee = person.attendee_type === "internal";
            const src = isEmployee ? "Nhân viên" : "Khách ngoài";
            setMessage({ type: "success", text: `✅ Chào mừng ${person.name}! (${src} — ${person.event_name})` });
            setHistory(p => [{
                qr, name: person.name, event: person.event_name, source: src,
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
            const errMsg = err.response?.data?.message || "Check-in thất bại";
            setMessage({ type: "error", text: "❌ " + errMsg });
            setHistory(p => [{
                qr, name: qr, event: "—", source: "—",
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
                        Quét mã QR check-in — nhân viên nội bộ và khách mời
                    </p>
                </div>
                {/* Event selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Sự kiện:</span>
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
                            Sự kiện đang check-in
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
                        {t === "scanner" && "📷 Quét QR"}
                        {t === "guests" && `👥 Danh sách ${stats ? `(${stats.total})` : ""}`}
                        {t === "history" && `📋 Lịch sử ${history.length > 0 ? `(${history.length})` : ""}`}
                    </button>
                ))}
            </div>

            {/* ===== TAB: SCANNER ===== */}
            {tab === "scanner" && (
                <div className="grid-2" style={{ alignItems: "start" }}>
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                            📷 Quét mã QR check-in
                        </h3>
                        {message && (
                            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
                                style={{ marginBottom: 16 }}>
                                {message.text}
                            </div>
                        )}
                        {!selectedEvent && (
                            <div className="alert alert-error" style={{ marginBottom: 16 }}>
                                ⚠️ Vui lòng chọn sự kiện trước khi quét QR.
                            </div>
                        )}
                        <form onSubmit={checkin}>
                            <div className="form-group">
                                <label style={{ fontWeight: 600 }}>Mã QR (nhân viên hoặc khách mời)</label>
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
                                <p>Đã check-in</p>
                            </div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-icon rose">⏳</div>
                            <div className="card-stat-info">
                                <h3>{stats?.notCheckedIn ?? "—"}</h3>
                                <p>Chưa check-in</p>
                            </div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-icon cyan">🎟️</div>
                            <div className="card-stat-info">
                                <h3>{stats?.total ?? "—"}</h3>
                                <p>Tổng đã đăng ký</p>
                            </div>
                        </div>
                        {stats && (
                            <div className="card" style={{ padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Tỉ lệ check-in</span>
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
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Danh sách người tham dự — {currentEvent?.name || "Chọn sự kiện"}</h3>
                        <button className="btn btn-outline btn-sm" onClick={loadGuestList}>↻ Làm mới</button>
                    </div>
                    {!selectedEvent ? (
                        <div className="empty-state"><span>🎪</span><p>Chọn sự kiện để xem danh sách</p></div>
                    ) : loadingList ? (
                        <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                    ) : guestList.length === 0 ? (
                        <div className="empty-state"><span>🎟️</span><p>Chưa có người đăng ký sự kiện này</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>#</th><th>Họ tên</th><th>Email</th><th>Loại</th><th>Trạng thái</th></tr>
                            </thead>
                            <tbody>
                                {guestList.map((g, i) => (
                                    <tr key={`${g.source}-${g.id}`} style={g.checked_in ? { background: "rgba(16,185,129,0.04)" } : {}}>
                                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {g.checked_in ? "✅" : "⏳"} {g.name}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                        <td>
                                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99,
                                                background: g.type === "internal" ? "#ede9fe" : "#e0f2fe",
                                                color: g.type === "internal" ? "#7c3aed" : "#0369a1",
                                                fontWeight: 600 }}>
                                                {g.type === "internal" ? "Nhân viên" : "Khách ngoài"}
                                            </span>
                                        </td>
                                        <td>
                                            {g.checked_in
                                                ? <span className="badge badge-success">✓ Đã check-in</span>
                                                : <span className="badge badge-default">Chờ check-in</span>
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
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Lịch sử quét (phiên này)</h3>
                        {history.length > 0 && (
                            <button className="btn btn-outline btn-sm" onClick={() => setHistory([])}>Xóa lịch sử</button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="empty-state"><span>📋</span><p>Chưa có lượt quét nào trong phiên này</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                            <tr><th>Thời gian</th><th>Họ tên</th><th>Loại</th><th>Mã QR</th><th>Kết quả</th></tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{h.time}</td>
                                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{h.source || "—"}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{h.qr}</td>
                                        <td>
                                            {h.ok
                                                ? <span className="badge badge-success">✓ Thành công</span>
                                                : <span className="badge badge-danger" title={h.error}>✗ Thất bại</span>
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
