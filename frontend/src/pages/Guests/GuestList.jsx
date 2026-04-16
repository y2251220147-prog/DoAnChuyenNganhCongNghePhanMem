import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { bulkInvite, createGuest, deleteGuest, getGuests } from "../../services/guestService";
import "../../styles/global.css";

/* QR hiển thị dùng free API */
function QRImage({ value, size = 160 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return (
        <img src={url} alt="QR Code"
            style={{ borderRadius: 10, border: "1px solid var(--border-color)", display: "block" }}
        />
    );
}

// FIX 11: Đã xóa hàm generateQR() phía client.
// QR code giờ được tạo và ký bằng HMAC ở server (services/qrService.js)
// Server trả về qr_code trong response khi tạo guest thành công.

export default function GuestList() {
    const [guests, setGuests] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModal] = useState(false);
    const [qrGuest, setQrGuest] = useState(null);
    const [form, setForm] = useState({ event_id: "", name: "", email: "", phone: "" });
    const [submitting, setSubmit] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterEvent, setFilter] = useState("all");
    const [isBulkOpen, setBulkOpen] = useState(false);
    const [bulkForm, setBulkForm] = useState({ event_id: "", guests: "", content: "" });
    const [bulkSending, setBulkSending] = useState(false);

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const load = async () => {
        setLoading(true);
        try {
            const [gR, eR] = await Promise.all([getGuests(), getEvents()]);
            setGuests(gR.data || []);
            setEvents(eR.data || []);
        } catch {/**/ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this guest?")) return;
        try { await deleteGuest(id); setGuests(g => g.filter(x => x.id !== id)); }
        catch { alert("Delete failed"); }
    };

    // Sau khi tạo khách → hiện QR ngay. Server sẽ tự gửi email mời.
    const handleCreate = async (e) => {
        e.preventDefault(); setError("");
        if (!form.event_id) return setError("Vui lòng chọn sự kiện.");
        setSubmit(true);
        try {
            const res = await createGuest({ ...form });
            const newQrCode = res.data?.qr_code;

            setModal(false);
            await load();
            if (newQrCode) {
                setQrGuest({
                    name: form.name,
                    email: form.email,
                    event_id: form.event_id,
                    qr_code: newQrCode,
                    checked_in: false,
                    isNew: true,
                    emailSent: res.data?.emailSent === true, // chỉ true khi server xác nhận rõ ràng
                });
            }
            setForm(p => ({ ...p, name: "", email: "", phone: "" }));
        } catch (err) { setError(err.response?.data?.message || "Thêm thất bại"); }
        finally { setSubmit(false); }
    };

    const handleBulkInvite = async (e) => {
        e.preventDefault();
        if (!bulkForm.event_id) return alert("Vui lòng chọn sự kiện.");
        setBulkSending(true);
        try {
            const lines = bulkForm.guests.split("\n").filter(l => l.trim());
            const parsedGuests = lines.map(line => {
                const parts = line.split(",").map(p => p.trim());
                return { name: parts[0], email: parts[1] };
            }).filter(g => g.name && g.email);

            if (parsedGuests.length === 0) throw new Error("Danh sách khách mời không hợp lệ (định dạng: Tên, Email)");

            const r = await bulkInvite({
                event_id: bulkForm.event_id,
                guests: parsedGuests,
                content: bulkForm.content
            });
            alert(`Đã gửi thành công: ${r.data.stats.success}, Thất bại: ${r.data.stats.failed}`);
            setBulkOpen(false);
            setBulkForm({ event_id: "", guests: "", content: "" });
            load();
        } catch (err) { alert(err.message || "Gửi mail hàng loạt thất bại"); }
        finally { setBulkSending(false); }
    };

    const getEventName = (eid) => events.find(e => e.id === eid)?.name || `Event #${eid}`;

    const filtered = guests.filter(g => {
        const ms = g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.email.toLowerCase().includes(search.toLowerCase());
        const me = filterEvent === "all" || String(g.event_id) === String(filterEvent);
        return ms && me;
    });

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">Quản lý Khách mời</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                        Hệ thống ghi nhận <strong>{guests.length}</strong> khách mời chiến lược và <strong>{guests.filter(g => g.checked_in).length}</strong> khách đã hiện diện.
                    </p>
                </div>
                {canManage && (
                    <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn btn-outline" style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 700 }} onClick={() => setBulkOpen(true)}>
                            💌 Mời khách hàng loạt
                        </button>
                        <button className="btn btn-primary" style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 800, boxShadow: "0 8px 16px -4px rgba(99,102,241,0.3)" }} onClick={() => { setForm({ event_id: "", name: "", email: "", phone: "" }); setError(""); setModal(true); }}>
                            + THÊM KHÁCH MỜI
                        </button>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="grid-3" style={{ marginBottom: 32, gap: 20 }}>
                {[
                    { label: "Tổng khách tham gia", value: guests.length, icon: "🎟️", color: "indigo", bg: "#f5f3ff", text: "#4338ca" },
                    { label: "Check-in thành công", value: guests.filter(g => g.checked_in).length, icon: "✅", color: "emerald", bg: "#ecfdf5", text: "#047857" },
                    { label: "Chưa đến địa điểm", value: guests.filter(g => !g.checked_in).length, icon: "⏳", color: "rose", bg: "#fff1f2", text: "#be123c" },
                ].map(s => (
                    <div key={s.label} className="card-stat" style={{ 
                        background: s.bg, border: "1px solid rgba(0,0,0,0.03)", 
                        padding: "24px 32px", borderRadius: 20, display: "flex", 
                        alignItems: "center", gap: 20
                    }}>
                        <div style={{ 
                            width: 60, height: 60, borderRadius: 16, background: "#fff", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            fontSize: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
                        }}>{s.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: s.text, lineHeight: 1, marginBottom: 4 }}>{loading ? "…" : s.value}</h3>
                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ 
                display: "flex", gap: 16, marginBottom: 24, padding: "16px 24px", 
                background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9", 
                alignItems: "center" 
            }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
                    <input className="form-control" placeholder="Tìm theo tên hoặc email khách mời..."
                        value={search} onChange={e => setSearch(e.target.value)} 
                        style={{ borderRadius: 12, height: 46, paddingLeft: 48, background: "#fff", border: "1px solid #e2e8f0" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Lọc sự kiện:</span>
                    <select className="form-control" style={{ minWidth: 260, borderRadius: 12, height: 46, background: "#fff", border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600 }}
                        value={filterEvent} onChange={e => setFilter(e.target.value)}>
                        <option value="all">Tất cả dự án hiện tại</option>
                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="card" style={{ border: "1px solid #f1f5f9", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)", borderRadius: 24, overflow: "hidden", padding: 0 }}>
                {loading ? (
                    <div className="empty-state" style={{ padding: 100 }}><span>⏳</span><p>Đang đồng bộ danh sách khách mời...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state" style={{ padding: 100 }}><span>🎟️</span>
                        <p style={{ fontSize: 18, fontWeight: 700, color: "#64748b" }}>Không tìm thấy khách mời phù hợp.</p>
                        {canManage && <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 8 }}>Vui lòng thêm khách mời mới hoặc điều chỉnh bộ lọc.</p>}
                    </div>
                ) : (
                    <div className="data-table-wrapper" style={{ border: "none", boxShadow: "none" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>Họ tên Khách mời</th>
                                    <th>Thông tin Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Sự kiện tham dự</th>
                                    <th>Tình trạng</th>
                                    <th style={{ textAlign: "center" }}>Check-in QR</th>
                                    {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((g) => (
                                    <tr key={g.id}>
                                        <td style={{ paddingLeft: 24 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
                                                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>{g.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--color-primary)", fontWeight: 600 }}>{g.email}</td>
                                        <td style={{ color: "#64748b", fontWeight: 500 }}>{g.phone || "—"}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: 12, fontWeight: 700, color: "#6366f1", 
                                                background: "rgba(99,102,241,0.08)", padding: "4px 12px", borderRadius: 10 
                                            }}>
                                                🎪 {getEventName(g.event_id)}
                                            </span>
                                        </td>
                                        <td>
                                            {g.checked_in
                                                ? <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "#f0fdf4", padding: "6px 14px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>✓ Đã Check-in</span>
                                                : <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", background: "#f1f5f9", padding: "6px 14px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Chờ Check-in</span>
                                            }
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {g.qr_code
                                                ? <button className="btn btn-outline btn-sm" style={{ borderRadius: 10, fontWeight: 700, padding: "6px 14px" }}
                                                    onClick={() => setQrGuest(g)}>📱 Xem mã</button>
                                                : <span style={{ color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>Chưa tạo QR</span>
                                            }
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                <button className="btn btn-danger btn-sm" style={{ borderRadius: 10, width: 36, height: 36 }}
                                                    onClick={() => handleDelete(g.id)} title="Gỡ khách mời">🗑</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Guest Modal */}
            <Modal title="Thêm khách mời" isOpen={isModalOpen}
                onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Sự kiện <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <select className="form-control" value={form.event_id}
                                onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                                <option value="">-- Chọn sự kiện --</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Họ và tên <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input className="form-control" placeholder="Nguyễn Văn A"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Email <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input type="email" className="form-control" placeholder="guest@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại (tùy chọn)</label>
                            <input type="tel" className="form-control" placeholder="0912 345 678"
                                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ background: "rgba(79, 70, 229, 0.05)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, border: "1px solid rgba(79, 70, 229, 0.1)" }}>
                        🔒 QR code được tạo và ký bởi server — không thể giả mạo. Chỉ dùng được đúng cho sự kiện đã đăng ký.
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                        {submitting ? <><span className="spinner" style={{ marginRight: 8, borderTopColor: "white" }}></span> Đang thêm...</> : "🚀 Thêm khách & Tạo mã QR"}
                    </button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal title={qrGuest?.isNew ? `✅ Đã thêm khách — ${qrGuest?.name || ""}` : `Mã QR — ${qrGuest?.name || ""}`}
                isOpen={!!qrGuest} onClose={() => setQrGuest(null)}>
                {qrGuest && (
                    <div style={{ textAlign: "center" }}>
                        {/* Thông báo khi vừa thêm mới */}
                        {qrGuest.isNew && (
                            qrGuest.emailSent ? (
                                <div style={{
                                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
                                    borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left"
                                }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 4 }}>
                                        ✅ Email mời đã được gửi tự động!
                                    </p>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                                        Phiếu mời kèm mã QR đã được gửi đến <strong>{qrGuest.email}</strong>.
                                        Khách chỉ cần kiểm tra hộp thư và mang mã QR đến sự kiện.
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                                    borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left"
                                }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>
                                        ⚠️ Đã thêm thành công! (Email chưa được cấu hình)
                                    </p>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
                                        Gửi link dưới đây cho <strong>{qrGuest.email}</strong> qua Zalo/Telegram.
                                        Khách nhập email để tra cứu vé và mã QR.
                                    </p>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <code style={{
                                            flex: 1, background: "var(--bg-main)", padding: "6px 10px",
                                            borderRadius: 6, fontSize: 11, color: "var(--color-primary)",
                                            border: "1px solid var(--border-color)", wordBreak: "break-all", textAlign: "left"
                                        }}>
                                            {window.location.origin}/guest-portal
                                        </code>
                                        <button className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/guest-portal`);
                                                alert("Đã copy link tra cứu vé!");
                                            }}>
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        <div style={{ display: "inline-block", background: "white", padding: 16, borderRadius: 12, border: "2px solid var(--border-color)", marginBottom: 16 }}>
                            <QRImage value={qrGuest.qr_code} size={180} />
                        </div>
                        <div style={{ background: "var(--bg-main)", borderRadius: 10, padding: "14px 16px", marginBottom: 14, textAlign: "left" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", fontSize: 13 }}>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Khách:</span>
                                <span style={{ fontWeight: 700 }}>{qrGuest.name}</span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Sự kiện:</span>
                                <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                                    🎪 {getEventName(qrGuest.event_id)}
                                </span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Email:</span>
                                <span>{qrGuest.email}</span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Trạng thái:</span>
                                <span>
                                    {qrGuest.checked_in
                                        ? <span className="badge badge-success">✓ Đã check-in</span>
                                        : <span className="badge badge-default">Chờ check-in</span>
                                    }
                                </span>
                            </div>
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)", wordBreak: "break-all", marginBottom: 16, padding: "8px 12px", background: "var(--bg-main)", borderRadius: 6 }}>
                            {qrGuest.qr_code}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }}
                                onClick={() => {
                                    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrGuest.qr_code)}&margin=10`;
                                    const a = document.createElement("a");
                                    a.href = url; a.download = `QR-${qrGuest.name}.png`; a.click();
                                }}>
                                ⬇️ Tải QR
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }}
                                onClick={() => window.print()}>
                                🖨️ In vé
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Bulk Invite Modal */}
            <Modal title="💌 Mời khách hàng loạt" isOpen={isBulkOpen} onClose={() => setBulkOpen(false)}>
                <form onSubmit={handleBulkInvite}>
                    <div className="form-group">
                        <label>Sự kiện mục tiêu <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <select className="form-control" value={bulkForm.event_id}
                            onChange={e => setBulkForm({ ...bulkForm, event_id: e.target.value })} required>
                            <option value="">-- Chọn sự kiện --</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                    </div>
                    <div className="grid-2" style={{ gap: 24 }}>
                        <div className="form-group">
                            <label>Danh sách khách mời (Tên, Email) <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <textarea className="form-control" style={{ height: 200 }}
                                placeholder="Nguyễn Văn A, anguyen@gmail.com&#10;Trần Thị B, btran@gmail.com"
                                value={bulkForm.guests}
                                onChange={e => setBulkForm({ ...bulkForm, guests: e.target.value })}
                                required />
                        </div>
                        <div className="form-group">
                            <label>Lời nhắn trong thư mời</label>
                            <textarea className="form-control" style={{ height: 200 }}
                                placeholder="VD: Trân trọng kính mời bạn đến tham dự..."
                                value={bulkForm.content}
                                onChange={e => setBulkForm({ ...bulkForm, content: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={bulkSending}>
                        {bulkSending ? "Đang gửi email..." : "🚀 Gửi lời mời hàng loạt"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
