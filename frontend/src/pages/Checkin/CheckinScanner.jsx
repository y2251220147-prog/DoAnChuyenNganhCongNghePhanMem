import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";
import { getEvents } from "../../services/eventService";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../../styles/global.css";

// ── Widget Quét QR Camera ────────────────────────────────────────────────────
function ScannerWidget({ onScan, onClose }) {
    const scannerRef = useRef(null);

    useEffect(() => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
                false
            );
            scannerRef.current.render(
                (decodedText) => {
                    // Tự động đóng sau khi quét thành công
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(() => {});
                        scannerRef.current = null;
                    }
                    onScan(decodedText);
                },
                () => { /* ignore */ }
            );
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [onScan]);

    return (
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid var(--border-color)", marginBottom: 20 }}>
            <div id="qr-reader" style={{ width: "100%", maxWidth: 400, margin: "0 auto", borderRadius: 8, overflow: "hidden" }}></div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                    ✕ Đóng Camera
                </button>
            </div>
        </div>
    );
}

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
    const [cameraOpen, setCameraOpen] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleCameraScan = (decodedText) => {
        setQr(decodedText);
        setCameraOpen(false);
        // Tự động bấm nút submit sau 100ms để trigger hàm checkin
        setTimeout(() => {
            document.getElementById("btn-checkin-submit")?.click();
        }, 100);
    };

    const exportToCSV = () => {
        if (!guestList || guestList.length === 0) return;
        const headers = ["STT", "Họ và tên", "Email", "Phân nhóm", "Thời gian Check-in", "Trạng thái"];
        const rows = guestList.map((g, i) => [
            i + 1,
            `"${(g.name || '').replace(/"/g, '""')}"`,
            `"${(g.email || '').replace(/"/g, '""')}"`,
            g.type === "internal" ? "Nhân viên" : "Khách ngoài",
            `"${g.checked_in_at ? new Date(g.checked_in_at).toLocaleString('vi-VN') : ''}"`,
            g.checked_in ? "Đã có mặt" : "Chưa đến"
        ]);
        
        // Dùng uFEFF để support tiếng Việt tốt trong Excel
        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `DanhSachKhachMoi_Event_${selectedEvent}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const pct = stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0;
    const currentEvent = events.find(e => String(e.id) === String(selectedEvent));

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">🎟️ Kiểm soát Check-in</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Quản lý lượt vào/ra bằng cách quét mã QR cho cả khách mời và nhân sự.
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", padding: "8px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>SỰ KIỆN:</span>
                    <select className="form-control" style={{ minWidth: 280, border: "none", background: "transparent", fontWeight: 700, color: "var(--color-primary)" }}
                        value={selectedEvent} onChange={e => setSelected(e.target.value)}>
                        <option value="">-- Chọn sự kiện tiếp nhận --</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.name} {ev.status === "running" ? "🔥" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Event banner */}
            {currentEvent && (
                <div style={{
                    background: "linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)",
                    borderRadius: 16, padding: "24px 32px", marginBottom: 28,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                                {currentEvent.status === "running" ? "🔴 Đang diễn ra" : "📅 Sắp tới"}
                            </span>
                        </div>
                        <h3 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>
                            🎪 {currentEvent.name}
                        </h3>
                        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                📅 {new Date(currentEvent.start_date || currentEvent.date).toLocaleDateString("vi-VN")}
                            </span>
                            {currentEvent.location && (
                                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                    📍 {currentEvent.location}
                                </span>
                            )}
                        </div>
                    </div>
                    {stats && (
                        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 24 }}>
                            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "white" }}>
                                {pct}%
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "white", lineHeight: 1 }}>{stats.checkedIn}</div>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>Đã có mặt / {stats.total}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, padding: "6px", background: "#f1f5f9", borderRadius: 16, width: "fit-content" }}>
                {[
                    { id: "scanner", label: "📷 Quét mã QR", icon: "📸" },
                    { id: "guests", label: `👥 Danh sách ${stats ? `(${stats.total})` : ""}`, icon: "👥" },
                    { id: "history", label: `📋 Lịch sử quét ${history.length > 0 ? `(${history.length})` : ""}`, icon: "📋" }
                ].map(t => (
                    <button key={t.id} 
                        style={{ 
                            padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 800, 
                            display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                            background: tab === t.id ? "#fff" : "transparent",
                            color: tab === t.id ? "var(--color-primary)" : "var(--text-secondary)",
                            border: "none",
                            boxShadow: tab === t.id ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                            cursor: "pointer"
                        }}
                        onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ===== TAB: SCANNER ===== */}
            {tab === "scanner" && (
                <div className="grid-2" style={{ alignItems: "start", gap: 28 }}>
                    <div className="card" style={{ padding: 32, borderRadius: 20 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 24 }}>📸</span> CỬA SỔ QUÉT QR
                        </h3>
                        {message && (
                            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
                                style={{ marginBottom: 24, borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>{message.text}</div>
                            </div>
                        )}
                        <form onSubmit={checkin}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontWeight: 800, color: "var(--text-secondary)", marginBottom: 12, display: "block" }}>
                                    Mã định danh (QR Code)
                                </label>
                                
                                {cameraOpen ? (
                                    <div style={{ marginBottom: 20 }}>
                                        <ScannerWidget 
                                            onScan={handleCameraScan} 
                                            onClose={() => setCameraOpen(false)} 
                                        />
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                        <button type="button" className="btn btn-outline" 
                                            style={{ borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}
                                            disabled={!selectedEvent}
                                            onClick={() => setCameraOpen(true)}>
                                            📷 Mở Camera quét
                                        </button>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>
                                            <span>💡</span> Hoặc dùng máy quét tay
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: 12 }}>
                                    <input
                                        ref={inputRef}
                                        className="form-control"
                                        placeholder={cameraOpen ? "Đang chờ camera..." : "Đưa mã vào vùng quét hoặc nhập tay tại đây..."}
                                        value={qr}
                                        onChange={e => setQr(e.target.value)}
                                        autoFocus
                                        disabled={loading || !selectedEvent || cameraOpen}
                                        style={{ fontFamily: "'JetBrains Mono', monospace", padding: 16, fontSize: 16, borderRadius: 12 }}
                                    />
                                    <button type="submit" id="btn-checkin-submit" className="btn btn-primary"
                                        disabled={loading || !qr.trim() || !selectedEvent || cameraOpen}
                                        style={{ flexShrink: 0, minWidth: 120, borderRadius: 12, fontSize: 15, fontWeight: 800 }}>
                                        {loading ? "..." : "CHECK-IN ✅"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="card" style={{ padding: 24, borderRadius: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-secondary)" }}>TIẾN ĐỘ HIỆN TẠI</span>
                                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)" }}>{pct}%</span>
                            </div>
                            <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, overflow: "hidden", marginBottom: 24 }}>
                                <div style={{
                                    height: "100%", width: `${pct}%`,
                                    background: "linear-gradient(90deg, #6366f1, #818cf8)",
                                    borderRadius: 6, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                                }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 16, border: "1px solid #dcfce7" }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>ĐÃ CÓ MẶT</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: "#15803d", marginTop: 4 }}>{stats?.checkedIn ?? "—"}</div>
                                </div>
                                <div style={{ padding: 16, background: "#fff1f2", borderRadius: 16, border: "1px solid #ffe4e6" }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#e11d48", textTransform: "uppercase" }}>CHƯA ĐẾN</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: "#be123c", marginTop: 4 }}>{stats?.notCheckedIn ?? "—"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-stat" style={{ borderRadius: 20, border: "1px solid #f1f5f9" }}>
                            <div className="card-stat-icon cyan" style={{ borderRadius: 12 }}>🎟️</div>
                            <div className="card-stat-info">
                                <h3 style={{ fontSize: 22, fontWeight: 900 }}>{stats?.total ?? "—"}</h3>
                                <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)" }}>Tổng số lượt đăng ký</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: GUESTS ===== */}
            {tab === "guests" && (
                <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                    <div style={{ background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>👥 DANH SÁCH NGƯỜI THAM DỰ</h3>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={loadGuestList} style={{ borderRadius: 8 }}>↻ Cập nhật</button>
                            <button className="btn btn-primary btn-sm" onClick={exportToCSV} style={{ borderRadius: 8, background: "#10b981", border: "none" }} disabled={guestList.length === 0}>📥 Xuất Excel (CSV)</button>
                        </div>
                    </div>
                    {!selectedEvent ? (
                        <div className="empty-state" style={{ padding: 60 }}><span>🎪</span><p>Chọn sự kiện để xem danh sách chi tiết</p></div>
                    ) : loadingList ? (
                        <div className="empty-state" style={{ padding: 60 }}><span>⏳</span><p>Đang tải dữ liệu người tham dự...</p></div>
                    ) : guestList.length === 0 ? (
                        <div className="empty-state" style={{ padding: 60 }}><span>🎟️</span><p>Chưa có ai đăng ký tham dự sự kiện này</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>#</th>
                                    <th>Họ và tên</th>
                                    <th>Thông tin Email</th>
                                    <th>Phân nhóm</th>
                                    <th style={{ textAlign: "right", paddingRight: 24 }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guestList.map((g, i) => (
                                    <tr key={`${g.source}-${g.id}`} style={g.checked_in ? { background: "rgba(16,185,129,0.03)" } : {}}>
                                        <td style={{ color: "var(--text-muted)", paddingLeft: 24 }}>{String(i + 1).padStart(2, '0')}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                                {g.checked_in ? <span style={{ color: "#10b981" }}>✅</span> : <span style={{ color: "#94a3b8" }}>⏳</span>}
                                                {g.name}
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{g.email}</td>
                                        <td>
                                            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
                                                background: g.type === "internal" ? "#e0e7ff" : "#f0f9ff",
                                                color: g.type === "internal" ? "#4338ca" : "#0369a1",
                                                fontWeight: 800 }}>
                                                {g.type === "internal" ? "NHÂN VIÊN" : "KHÁCH NGOÀI"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                            {g.checked_in
                                                ? <span className="badge badge-success" style={{ border: "none", borderRadius: 8, padding: "6px 12px" }}>✓ ĐÃ CÓ MẶT</span>
                                                : <span className="badge badge-default" style={{ border: "none", borderRadius: 8, padding: "6px 12px" }}>CHỜ CHECK-IN</span>
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
                <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                    <div style={{ background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>📋 LỊCH SỬ QUÉT (PHIÊN NÀY)</h3>
                        {history.length > 0 && (
                            <button className="btn btn-outline btn-sm" onClick={() => setHistory([])} style={{ borderRadius: 8, color: "#64748b" }}>Xóa trắng lịch sử</button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="empty-state" style={{ padding: 60 }}><span>📋</span><p>Chưa có lượt quét nào được ghi nhận trong phiên này</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>Thời gian</th>
                                    <th>Họ và tên</th>
                                    <th>Loại đối tượng</th>
                                    <th>Mã nhận diện (QR)</th>
                                    <th style={{ textAlign: "right", paddingRight: 24 }}>Kết quả quét</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ color: "var(--color-primary)", fontSize: 13, fontWeight: 700, paddingLeft: 24 }}>{h.time}</td>
                                        <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{h.name}</td>
                                        <td>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{h.source?.toUpperCase() || "—"}</span>
                                        </td>
                                        <td><code style={{ fontSize: 12, color: "var(--text-muted)", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{h.qr}</code></td>
                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                            {h.ok
                                                ? <span className="badge badge-success" style={{ border: "none", borderRadius: 8, padding: "6px 12px" }}>✓ THÀNH CÔNG</span>
                                                : <span className="badge badge-danger" title={h.error} style={{ border: "none", borderRadius: 8, padding: "6px 12px" }}>✗ THẤT BẠI</span>
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
