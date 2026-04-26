import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { createGuest, deleteGuest, getGuests } from "../../services/guestService";
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
            const emailSent = res.data?.emailSent; // server trả về true/false
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

    const getEventName = (eid) => events.find(e => e.id === eid)?.name || `Event #${eid}`;

    const filtered = guests.filter(g => {
        const ms = g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.email.toLowerCase().includes(search.toLowerCase());
        const me = filterEvent === "all" || String(g.event_id) === String(filterEvent);
        return ms && me;
    });

    const handleExportCSV = () => {
        if (filtered.length === 0) {
            alert("Không có dữ liệu để xuất.");
            return;
        }

        const headers = ["Họ tên", "Email", "Số điện thoại", "Sự kiện", "Trạng thái"];
        const rows = filtered.map(c => [
            `"${c.name}"`,
            `"${c.email}"`,
            `"${c.phone || ""}"`,
            `"${getEventName(c.event_id)}"`,
            `"${c.checked_in ? "Đã check-in" : "Chờ"}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Danh_sach_khach_moi.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Khách mời</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        {guests.length} khách · {guests.filter(g => g.checked_in).length} đã check-in
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-success" onClick={handleExportCSV}>📊 Xuất CSV</button>
                    {canManage && (
                        <button className="btn btn-primary" onClick={() => { setForm({ event_id: "", name: "", email: "", phone: "" }); setError(""); setModal(true); }}>
                            + Thêm khách mời
                        </button>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
                <div className="card-stat">
                    <div className="card-stat-icon cyan">🎟️</div>
                    <div className="card-stat-info"><h3>{guests.length}</h3><p>Tổng khách mời</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">✅</div>
                    <div className="card-stat-info"><h3>{guests.filter(g => g.checked_in).length}</h3><p>Đã check-in</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon rose">⏳</div>
                    <div className="card-stat-info"><h3>{guests.filter(g => !g.checked_in).length}</h3><p>Chưa check-in</p></div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input className="form-control" placeholder="🔍 Tìm theo tên, email..."
                    value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
                <select className="form-control" style={{ maxWidth: 220 }}
                    value={filterEvent} onChange={e => setFilter(e.target.value)}>
                    <option value="all">Tất cả sự kiện</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading guests...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><span>🎟️</span>
                        <p>Không tìm thấy khách mời{canManage ? ". Thêm khách mời bên trên!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Họ tên</th><th>Email</th><th>Số điện thoại</th>
                                <th>Sự kiện</th><th>Trạng thái</th><th>Mã QR</th>
                                {canManage && <th>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((g, i) => (
                                <tr key={g.id}>
                                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>👤 {g.name}</td>
                                    <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                    <td>{g.phone || "—"}</td>
                                    <td>
                                        <span className="badge badge-default">
                                            🎪 {getEventName(g.event_id)}
                                        </span>
                                    </td>
                                    <td>
                                        {g.checked_in
                                            ? <span className="badge badge-success">✓ Đã check-in</span>
                                            : <span className="badge badge-default">Chờ check-in</span>
                                        }
                                    </td>
                                    <td>
                                        {g.qr_code
                                            ? <button className="btn btn-outline btn-sm"
                                                onClick={() => setQrGuest(g)}>📱 Xem QR</button>
                                            : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Chưa có QR</span>
                                        }
                                    </td>
                                    {canManage && (
                                        <td>
                                            <button className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(g.id)} title="Xóa khách">🗑</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Guest Modal */}
            <Modal title="Thêm khách mời" isOpen={isModalOpen}
                onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error">{error}</div>}
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
                    <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)" }}>
                        🔒 QR code được tạo và ký bởi server — không thể giả mạo. Chỉ dùng được đúng cho sự kiện đã đăng ký.
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                        {submitting ? "Đang thêm..." : "Thêm khách & Tạo mã QR"}
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
        </Layout>
    );
}
