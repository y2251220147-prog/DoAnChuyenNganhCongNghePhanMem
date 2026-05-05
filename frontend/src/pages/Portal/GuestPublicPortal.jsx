import { useState } from "react";
import "./portal.css";

const API_BASE = "http://localhost:5000/api";

function QRDisplay({ value, size = 200 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" style={{ borderRadius: 12, display: "block", border: "1.5px solid #e2e0da" }} />;
}

function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(s, e) {
    if (!s) return "";
    const ts = new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const te = e ? new Date(e).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
    return te ? `${ts} – ${te}` : ts;
}

const STATUS_VN = {
    draft: "Bản nháp", planning: "Lên kế hoạch", approved: "Đã duyệt",
    running: "Đang diễn ra", completed: "Đã kết thúc", cancelled: "Đã hủy",
};

export default function GuestPublicPortal() {
    const [email, setEmail] = useState("");
    const [results, setResults] = useState(null); // array of { guest, event }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [qrModal, setQrModal] = useState(null);

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true); setError(""); setResults(null);
        try {
            const res = await fetch(`${API_BASE}/attendees/lookup?email=${encodeURIComponent(email.trim())}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Không tìm thấy thông tin");
            }
            const data = await res.json();
            if (!data || data.length === 0) throw new Error("Không tìm thấy thông tin khách mời với email này.");
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = (qrValue, guestName) => {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}&margin=10`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `QR-${guestName.replace(/\s/g, "_")}.png`;
        a.click();
    };

    return (
        <div className="guest-portal-wrap" style={{ minHeight: "100vh", background: "#F7F6F3", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>

            {/* ── Header ── */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, background: "#3D35C8", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>🎫</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1A1917", marginBottom: 6 }}>Tra cứu vé mời</h1>
                <p style={{ fontSize: 14, color: "#6B6963" }}>Nhập email của bạn để xem thông tin vé & mã QR check-in</p>
            </div>

            {/* ── Lookup Card ── */}
            <div className="guest-portal-card" style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 16, border: "1px solid #e2e0da", padding: "28px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 24 }}>
                <form onSubmit={handleLookup}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6963", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Địa chỉ email
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                        <input
                            type="email" required
                            style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1cec8", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border 0.15s" }}
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={e => e.target.style.borderColor = "#3D35C8"}
                            onBlur={e => e.target.style.borderColor = "#d1cec8"}
                        />
                        <button type="submit"
                            disabled={loading}
                            style={{
                                padding: "10px 20px", background: "#3D35C8", color: "white", border: "none",
                                borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer",
                                opacity: loading ? 0.7 : 1, fontFamily: "inherit", whiteSpace: "nowrap"
                            }}>
                            {loading ? "⏳..." : "Tra cứu"}
                        </button>
                    </div>
                    {error && (
                        <div style={{ marginTop: 12, padding: "10px 14px", background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, fontSize: 13, border: "1px solid rgba(163,45,45,0.2)" }}>
                            ⚠️ {error}
                        </div>
                    )}
                </form>
                <p style={{ marginTop: 16, fontSize: 12, color: "#A8A49E", textAlign: "center" }}>
                    🔒 Thông tin chỉ hiển thị cho cá nhân — không chia sẻ với bên thứ ba
                </p>
            </div>

            {/* ── Results ── */}
            {results && results.length > 0 && results.map((item, idx) => {
                const { guest, event } = item;
                const isCheckedIn = guest.checked_in;
                return (
                    <div key={idx} style={{
                        width: "100%", maxWidth: 480, background: "#fff", borderRadius: 16,
                        border: "1.5px solid " + (isCheckedIn ? "#0F6E56" : "#3D35C8"),
                        padding: "24px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                        marginBottom: 16
                    }}>
                        {/* Status banner */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                            borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 16,
                            background: isCheckedIn ? "#E1F5EE" : "#EEEDFE",
                            color: isCheckedIn ? "#0F6E56" : "#3D35C8"
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                            {isCheckedIn ? "Đã Check-in" : "Chưa Check-in"}
                        </div>

                        {/* Guest info */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1917", marginBottom: 4 }}>
                                👤 {guest.name}
                            </div>
                            <div style={{ fontSize: 13, color: "#6B6963" }}>{guest.email}</div>
                            {guest.phone && <div style={{ fontSize: 13, color: "#6B6963" }}>📞 {guest.phone}</div>}
                        </div>

                        {/* Event info */}
                        {event && (
                            <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>🎪 {event.name}</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: "#6B6963" }}>
                                    <div>📅 {fmtDate(event.start_date)}</div>
                                    <div>⏰ {fmtTime(event.start_date, event.end_date)}</div>
                                    {event.location && <div>📍 {event.location}</div>}
                                    <div style={{ marginTop: 4 }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            background: "#EEEDFE", color: "#3D35C8"
                                        }}>
                                            {STATUS_VN[event.status] || event.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* QR Code */}
                        {guest.qr_code && (
                            <div style={{ textAlign: "center" }}>
                                <div style={{ display: "inline-block", background: "white", padding: 16, borderRadius: 12, border: "1.5px solid #e2e0da", marginBottom: 12 }}>
                                    <QRDisplay value={guest.qr_code} size={180} />
                                </div>
                                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A49E", marginBottom: 16, wordBreak: "break-all", padding: "6px 12px", background: "#F7F6F3", borderRadius: 6 }}>
                                    {guest.qr_code}
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button
                                        style={{ flex: 1, padding: "10px", border: "1.5px solid #d1cec8", borderRadius: 10, background: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                                        onClick={() => downloadQR(guest.qr_code, guest.name)}>
                                        ⬇️ Tải QR
                                    </button>
                                    <button
                                        style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#3D35C8", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                                        onClick={() => window.print()}>
                                        🖨️ In vé
                                    </button>
                                </div>
                            </div>
                        )}

                        {!guest.qr_code && (
                            <div style={{ textAlign: "center", padding: "16px", color: "#A8A49E", fontSize: 13 }}>
                                ℹ️ Chưa có mã QR — Ban tổ chức sẽ gửi mã trước sự kiện
                            </div>
                        )}
                    </div>
                );
            })}

            <p style={{ fontSize: 12, color: "#A8A49E", marginTop: 16 }}>
                EventPro Management System — Hệ thống quản lý sự kiện
            </p>
        </div>
    );
}
