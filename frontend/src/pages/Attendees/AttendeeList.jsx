import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import {
    getAllAttendees, addExternal, removeAttendee, getAttendeeStats
} from "../../services/attendeeService";
import { formatDate } from "../../utils/dateUtils";

function QRImage({ value, size = 150 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" style={{ borderRadius: 10, border: "1px solid var(--border-color)", display: "block" }} />;
}

const TYPE_BADGE = {
    internal: { label: "🏢 Nội bộ", bg: "rgba(99,102,241,0.1)", color: "#4338ca" },
    external: { label: "👤 Khách mời", bg: "rgba(16,185,129,0.1)", color: "#047857" },
};

const EMPTY_FORM = { event_id: "", name: "", email: "", phone: "", organization: "" };

export default function AttendeeList() {
    const [attendees, setAttendees] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [qrItem, setQrItem] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterEvent, setFilterEvent] = useState("all");
    const [filterType, setFilterType] = useState("all");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const load = async () => {
        setLoading(true);
        try {
            const [aR, eR] = await Promise.all([getAllAttendees(), getEvents()]);
            setAttendees(aR.data || []);
            setEvents(eR.data || []);
        } catch { /**/ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleAddExternal = async (e) => {
        e.preventDefault(); setError(""); setSubmitting(true);
        try {
            const res = await addExternal({ ...form, event_id: Number(form.event_id) });
            setModal(false);
            setForm(EMPTY_FORM);
            await load();
            if (res.data?.qr_code) setQrItem({ ...form, qr_code: res.data.qr_code, attendee_type: "external" });
        } catch (err) {
            setError(err.response?.data?.message || "Thêm khách mời thất bại");
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa người tham gia này khỏi sự kiện?")) return;
        try { await removeAttendee(id); setAttendees(a => a.filter(x => x.id !== id)); }
        catch (err) { alert(err.response?.data?.message || "Xóa thất bại"); }
    };

    const getEventName = (eid) => events.find(e => e.id === eid)?.name || `#${eid}`;

    const filtered = attendees.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.email.toLowerCase().includes(search.toLowerCase());
        const matchEvent = filterEvent === "all" || String(a.event_id) === String(filterEvent);
        const matchType = filterType === "all" || a.attendee_type === filterType;
        return matchSearch && matchEvent && matchType;
    });

    const stats = {
        total: attendees.length,
        internal: attendees.filter(a => a.attendee_type === "internal").length,
        external: attendees.filter(a => a.attendee_type === "external").length,
        checkedIn: attendees.filter(a => a.checked_in).length,
    };

    return (
        <Layout>
            <div style={{ padding: "0 0 40px" }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: 32 }}>
                    <div>
                        <h2 style={{ fontSize: 30, fontWeight: 900 }}>
                            <span className="gradient-text">Danh sách Người tham gia</span>
                        </h2>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                            Quản lý nhân viên nội bộ đăng ký và khách mời bên ngoài tham gia sự kiện
                        </p>
                    </div>
                    {canManage && (
                        <button className="btn btn-primary" style={{ height: 46, padding: "0 24px", fontWeight: 700 }}
                            onClick={() => { setForm(EMPTY_FORM); setError(""); setModal(true); }}>
                            + Thêm khách mời ngoài
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                    {[
                        { label: "Tổng người tham gia", value: stats.total, icon: "🎟️", color: "#6366f1" },
                        { label: "Nhân viên nội bộ", value: stats.internal, icon: "🏢", color: "#0ea5e9" },
                        { label: "Khách mời ngoài", value: stats.external, icon: "👤", color: "#10b981" },
                        { label: "Đã Check-in", value: stats.checkedIn, icon: "✅", color: "#f59e0b" },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: "var(--bg-card)", border: "1px solid var(--border-color)",
                            borderRadius: 12, padding: "18px 22px", borderLeft: `4px solid ${s.color}`
                        }}>
                            <div style={{ fontSize: 22 }}>{s.icon}</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{loading ? "…" : s.value}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{
                    display: "flex", gap: 12, marginBottom: 20, padding: "14px 20px",
                    background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)",
                    alignItems: "center", flexWrap: "wrap"
                }}>
                    <input className="form-control" placeholder="🔍 Tìm tên, email..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 300, height: 40 }} />
                    <select className="form-control" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
                        style={{ minWidth: 220, height: 40 }}>
                        <option value="all">Tất cả sự kiện</option>
                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                    <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}
                        style={{ minWidth: 160, height: 40 }}>
                        <option value="all">Tất cả loại</option>
                        <option value="internal">🏢 Nội bộ</option>
                        <option value="external">👤 Khách mời</option>
                    </select>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                        {filtered.length} kết quả
                    </span>
                </div>

                {/* Table */}
                <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Đang tải...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
                            <div>Không tìm thấy người tham gia phù hợp</div>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>Loại</th>
                                    <th>Sự kiện</th>
                                    <th>Đăng ký</th>
                                    <th style={{ textAlign: "center" }}>Check-in</th>
                                    <th style={{ textAlign: "center" }}>QR</th>
                                    {canManage && <th style={{ textAlign: "right" }}>Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => {
                                    const badge = TYPE_BADGE[a.attendee_type] || TYPE_BADGE.external;
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: "50%",
                                                        background: a.attendee_type === "internal" ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.12)",
                                                        color: a.attendee_type === "internal" ? "#4338ca" : "#047857",
                                                        fontSize: 15, fontWeight: 800,
                                                        display: "flex", alignItems: "center", justifyContent: "center"
                                                    }}>
                                                        {a.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{a.name}</div>
                                                        {a.organization && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.organization}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--color-primary)", fontSize: 13 }}>{a.email}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 700, padding: "3px 10px",
                                                    borderRadius: 999, background: badge.bg, color: badge.color
                                                }}>{badge.label}</span>
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                <span style={{ color: "#6366f1", fontWeight: 600 }}>
                                                    {getEventName(a.event_id)}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                {formatDate(a.created_at)}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {a.checked_in ? (
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "3px 10px", borderRadius: 999 }}>
                                                        ✓ Đã check-in
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-main)", padding: "3px 10px", borderRadius: 999 }}>
                                                        Chờ
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {a.qr_code ? (
                                                    <button className="btn btn-sm btn-outline" onClick={() => setQrItem(a)}>📱 QR</button>
                                                ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                                            </td>
                                            {canManage && (
                                                <td style={{ textAlign: "right" }}>
                                                    <button className="btn btn-sm"
                                                        style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}
                                                        onClick={() => handleDelete(a.id)}>🗑️</button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal thêm khách mời ngoài */}
                <Modal title="➕ Thêm khách mời bên ngoài" isOpen={modal} onClose={() => { setModal(false); setError(""); }}>
                    <form onSubmit={handleAddExternal}>
                        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                        <div style={{
                            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#065f46"
                        }}>
                            👤 Khách mời bên ngoài — không có tài khoản trong hệ thống, sẽ không được gán công việc
                        </div>
                        <div className="form-group">
                            <label>Sự kiện <span style={{ color: "#ef4444" }}>*</span></label>
                            <select className="form-control" value={form.event_id}
                                onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                                <option value="">-- Chọn sự kiện --</option>
                                {events.filter(ev => ["approved", "running", "planning"].includes(ev.status))
                                    .map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                            </select>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Họ và tên <span style={{ color: "#ef4444" }}>*</span></label>
                                <input className="form-control" placeholder="Nguyễn Văn A"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email <span style={{ color: "#ef4444" }}>*</span></label>
                                <input type="email" className="form-control" placeholder="guest@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input type="tel" className="form-control" placeholder="0912 345 678"
                                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Tổ chức / Công ty</label>
                                <input className="form-control" placeholder="Tên công ty..."
                                    value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? "Đang thêm..." : "🚀 Thêm & Tạo QR"}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Modal QR */}
                <Modal title={`Mã QR — ${qrItem?.name || ""}`} isOpen={!!qrItem} onClose={() => setQrItem(null)}>
                    {qrItem && (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-block", background: "white", padding: 16, borderRadius: 12, border: "2px solid var(--border-color)", marginBottom: 16 }}>
                                <QRImage value={qrItem.qr_code} size={180} />
                            </div>
                            <div style={{ background: "var(--bg-main)", borderRadius: 10, padding: "12px 16px", textAlign: "left", marginBottom: 14, fontSize: 13 }}>
                                <div><strong>Tên:</strong> {qrItem.name}</div>
                                <div><strong>Email:</strong> {qrItem.email}</div>
                                <div><strong>Loại:</strong> {TYPE_BADGE[qrItem.attendee_type]?.label}</div>
                                <div><strong>Sự kiện:</strong> {qrItem.event_name || getEventName(qrItem.event_id)}</div>
                            </div>
                            <button className="btn btn-outline w-full" onClick={() => {
                                const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrItem.qr_code)}&margin=10`;
                                const a = document.createElement("a");
                                a.href = url; a.download = `QR-${qrItem.name}.png`; a.click();
                            }}>⬇️ Tải QR</button>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
}
