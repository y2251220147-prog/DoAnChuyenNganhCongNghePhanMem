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

    // FIX 11: Không còn gọi generateQR() phía client.
    // Chỉ gửi form data lên server — server tự sinh qr_code có HMAC signature.
    const handleCreate = async (e) => {
        e.preventDefault(); setError("");
        if (!form.event_id) return setError("Please select an event.");
        setSubmit(true);
        try {
            await createGuest({ ...form });
            setModal(false);
            setForm(p => ({ ...p, name: "", email: "", phone: "" }));
            load();
        } catch (err) { setError(err.response?.data?.message || "Create failed"); }
        finally { setSubmit(false); }
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
            <div className="page-header">
                <div>
                    <h2>Guests</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        {guests.length} total · {guests.filter(g => g.checked_in).length} checked in
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => { setForm({ event_id: "", name: "", email: "", phone: "" }); setError(""); setModal(true); }}>
                        + Add Guest
                    </button>
                )}
            </div>

            {/* Summary */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
                <div className="card-stat">
                    <div className="card-stat-icon cyan">🎟️</div>
                    <div className="card-stat-info"><h3>{guests.length}</h3><p>Total Guests</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon emerald">✅</div>
                    <div className="card-stat-info"><h3>{guests.filter(g => g.checked_in).length}</h3><p>Checked In</p></div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon rose">⏳</div>
                    <div className="card-stat-info"><h3>{guests.filter(g => !g.checked_in).length}</h3><p>Pending</p></div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input className="form-control" placeholder="🔍 Search name or email..."
                    value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
                <select className="form-control" style={{ maxWidth: 220 }}
                    value={filterEvent} onChange={e => setFilter(e.target.value)}>
                    <option value="all">All Events</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading guests...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><span>🎟️</span>
                        <p>No guests found{canManage ? ". Add guests above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
                                <th>Event</th><th>Status</th><th>QR Code</th>
                                {canManage && <th>Actions</th>}
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
                                            ? <span className="badge badge-success">✓ Checked In</span>
                                            : <span className="badge badge-default">Pending</span>
                                        }
                                    </td>
                                    <td>
                                        {g.qr_code
                                            ? <button className="btn btn-outline btn-sm"
                                                onClick={() => setQrGuest(g)}>📱 View QR</button>
                                            : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No QR</span>
                                        }
                                    </td>
                                    {canManage && (
                                        <td>
                                            <button className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(g.id)}>🗑</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Guest Modal */}
            <Modal title="Add New Guest" isOpen={isModalOpen}
                onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group">
                        <label>Event <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <select className="form-control" value={form.event_id}
                            onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                            <option value="">-- Select Event --</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Full Name <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <input className="form-control" placeholder="Nguyen Van A"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Email <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <input type="email" className="form-control" placeholder="guest@example.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Phone (Optional)</label>
                        <input type="tel" className="form-control" placeholder="0912 345 678"
                            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)" }}>
                        🔒 QR code được tạo và ký bởi server — không thể giả mạo. Chỉ dùng được đúng cho sự kiện đã đăng ký.
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                        {submitting ? "Adding..." : "Add Guest & Generate QR"}
                    </button>
                </form>
            </Modal>

            {/* QR Code Modal */}
            <Modal title={`QR Code — ${qrGuest?.name || ""}`} isOpen={!!qrGuest}
                onClose={() => setQrGuest(null)}>
                {qrGuest && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-block", background: "white", padding: 16, borderRadius: 12, border: "2px solid var(--border-color)", marginBottom: 16 }}>
                            <QRImage value={qrGuest.qr_code} size={180} />
                        </div>
                        <div style={{ background: "var(--bg-main)", borderRadius: 10, padding: "14px 16px", marginBottom: 14, textAlign: "left" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", fontSize: 13 }}>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Guest:</span>
                                <span style={{ fontWeight: 700 }}>{qrGuest.name}</span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Event:</span>
                                <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                                    🎪 {getEventName(qrGuest.event_id)}
                                </span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Email:</span>
                                <span>{qrGuest.email}</span>
                                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Status:</span>
                                <span>
                                    {qrGuest.checked_in
                                        ? <span className="badge badge-success">✓ Checked In</span>
                                        : <span className="badge badge-default">Pending</span>
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
                                ⬇️ Download
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }}
                                onClick={() => window.print()}>
                                🖨️ Print
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}
