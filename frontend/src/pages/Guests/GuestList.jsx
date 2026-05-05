import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import {
    addExternal, bulkInviteExternal, getAllAttendees, removeAttendee,
} from "../../services/attendeeService";
import "../../styles/global.css";

function QRImage({ value, size = 160 }) {
    if (!value) return null;
    return (
        <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`}
            alt="QR Code"
            style={{ borderRadius: 10, border: "1px solid var(--border-color)", display: "block" }}
        />
    );
}

/* Badge phân loại internal / external */
function TypeBadge({ type }) {
    const isInternal = type === "internal";
    return (
        <span style={{
            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
            padding: "3px 10px", borderRadius: 999,
            background: isInternal ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)",
            color: isInternal ? "#4338ca" : "#b45309",
        }}>
            {isInternal ? "👤 Nhân viên" : "🌐 Khách ngoài"}
        </span>
    );
}

const EMPTY_FORM = { event_id: "", name: "", email: "", phone: "", organization: "", title: "", note: "" };
const EMPTY_BULK = { event_id: "", guests: "", content: "" };

export default function GuestList() {
    const [attendees,   setAttendees]   = useState([]);
    const [events,      setEvents]      = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [modal,       setModal]       = useState(false);
    const [bulkOpen,    setBulkOpen]    = useState(false);
    const [qrItem,      setQrItem]      = useState(null);
    const [form,        setForm]        = useState(EMPTY_FORM);
    const [bulkForm,    setBulkForm]    = useState(EMPTY_BULK);
    const [saving,      setSaving]      = useState(false);
    const [bulkSending, setBulkSending] = useState(false);
    const [error,       setError]       = useState("");
    const [search,      setSearch]      = useState("");
    const [filterEvent, setFilterEvent] = useState("all");
    const [filterType,  setFilterType]  = useState("all"); // all | internal | external

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

    /* Thêm khách ngoài đơn lẻ */
    const handleCreate = async (e) => {
        e.preventDefault(); setError("");
        if (!form.event_id) return setError("Vui lòng chọn sự kiện.");
        setSaving(true);
        try {
            const res = await addExternal({ ...form });
            setModal(false);
            await load();
            if (res.data?.qr_code) setQrItem({ ...form, qr_code: res.data.qr_code, emailSent: !!res.data.emailSent, isNew: true });
            setForm(EMPTY_FORM);
        } catch (err) { setError(err.response?.data?.message || "Thêm thất bại"); }
        finally { setSaving(false); }
    };

    /* Mời hàng loạt */
    const handleBulk = async (e) => {
        e.preventDefault();
        if (!bulkForm.event_id) return alert("Vui lòng chọn sự kiện.");
        setBulkSending(true);
        try {
            const lines = bulkForm.guests.split("\n").filter(l => l.trim());
            const guests = lines.map(line => {
                const [name, email] = line.split(",").map(p => p.trim());
                return { name, email };
            }).filter(g => g.name && g.email);
            if (!guests.length) throw new Error("Danh sách không hợp lệ (định dạng: Tên, Email)");
            const r = await bulkInviteExternal({ event_id: bulkForm.event_id, guests, content: bulkForm.content });
            alert(`✅ Thành công: ${r.data.stats?.success ?? "?"} · Thất bại: ${r.data.stats?.failed ?? 0}`);
            setBulkOpen(false); setBulkForm(EMPTY_BULK); load();
        } catch (err) { alert(err.message || "Gửi thất bại"); }
        finally { setBulkSending(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Gỡ người tham gia này khỏi sự kiện?")) return;
        try { await removeAttendee(id); setAttendees(a => a.filter(x => x.id !== id)); }
        catch { alert("Xoá thất bại"); }
    };

    const getEventName = (eid) => events.find(e => e.id === eid)?.name || `#${eid}`;

    /* Format dd/mm/yyyy */
    const fmtDate = (d) => {
        if (!d) return "—";
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
    };

    const filtered = attendees.filter(a => {
        const ms = a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
        const me = filterEvent === "all" || String(a.event_id) === String(filterEvent);
        const mt = filterType  === "all" || a.attendee_type === filterType;
        return ms && me && mt;
    });

    const internal = attendees.filter(a => a.attendee_type === "internal").length;
    const external = attendees.filter(a => a.attendee_type === "external").length;
    const checkedIn = attendees.filter(a => a.checked_in).length;

    return (
        <Layout>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 36 }}>
                <div>
                    <h2 style={{ fontSize: 30, fontWeight: 900 }}>
                        <span className="gradient-text">Danh sách Người tham gia</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Nhân viên đăng ký + Khách mời ngoài — quản lý tập trung tại một nơi.
                    </p>
                </div>
                {canManage && (
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-outline" style={{ borderRadius: 12, height: 46, padding: "0 20px", fontWeight: 700 }} onClick={() => setBulkOpen(true)}>
                            💌 Mời hàng loạt
                        </button>
                        <button id="btn-add-external" className="btn btn-primary" style={{ borderRadius: 12, height: 46, padding: "0 20px", fontWeight: 800 }} onClick={() => { setForm(EMPTY_FORM); setError(""); setModal(true); }}>
                            + Thêm khách ngoài
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 28, gap: 18 }}>
                {[
                    { label: "Tổng người tham gia", value: attendees.length, icon: "🎟️", bg: "#f5f3ff", text: "#4338ca" },
                    { label: "Nhân viên nội bộ",    value: internal,         icon: "👤", bg: "#eff6ff", text: "#1d4ed8" },
                    { label: "Khách mời ngoài",     value: external,         icon: "🌐", bg: "#fffbeb", text: "#b45309" },
                    { label: "Đã Check-in",          value: checkedIn,        icon: "✅", bg: "#f0fdf4", text: "#047857" },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: "1px solid rgba(0,0,0,0.04)", padding: "20px 24px", borderRadius: 16, display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 13, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: s.text, lineHeight: 1 }}>{loading ? "…" : s.value}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", marginTop: 3 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", padding: "14px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                    <input className="form-control" placeholder="Tìm theo tên hoặc email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, borderRadius: 10, height: 42, fontSize: 14 }} />
                </div>
                <select className="form-control" style={{ minWidth: 220, borderRadius: 10, height: 42, fontSize: 13, fontWeight: 600 }} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                    <option value="all">Tất cả sự kiện</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                {/* Tab filter type */}
                <div style={{ display: "flex", gap: 6 }}>
                    {[["all","Tất cả"],["internal","Nhân viên"],["external","Khách ngoài"]].map(([v, label]) => (
                        <button key={v} onClick={() => setFilterType(v)} style={{
                            padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                            background: filterType === v ? "var(--color-primary)" : "#fff",
                            color: filterType === v ? "#fff" : "#64748b",
                            border: filterType === v ? "none" : "1px solid #e2e8f0",
                        }}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>⏳ Đang tải...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>🎟️</div>
                        <p style={{ fontWeight: 700 }}>Không tìm thấy người tham gia phù hợp.</p>
                    </div>
                ) : (
                    <div className="data-table-wrapper" style={{ border: "none", boxShadow: "none" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>Người tham gia</th>
                                    <th>Loại</th>
                                    <th>Sự kiện</th>
                                    <th>Tổ chức / Chức danh</th>
                                    <th>Ngày đăng ký</th>
                                    <th>Check-in</th>
                                    <th style={{ textAlign: "center" }}>QR</th>
                                    {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ paddingLeft: 24 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: a.attendee_type === "internal" ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                                                    {a.attendee_type === "internal" ? "👤" : "🌐"}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 14 }}>{a.name}</div>
                                                    <div style={{ fontSize: 12, color: "#6366f1" }}>{a.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><TypeBadge type={a.attendee_type} /></td>
                                        <td>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "4px 10px", borderRadius: 8 }}>
                                                🎪 {getEventName(a.event_id)}
                                            </span>
                                        </td>
                                        <td style={{ color: "#64748b", fontSize: 13 }}>
                                            {a.organization ? <><strong>{a.organization}</strong>{a.title ? ` · ${a.title}` : ""}</> : <span style={{ color: "#cbd5e1" }}>—</span>}
                                        </td>
                                        <td style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>
                                            {fmtDate(a.created_at)}
                                        </td>
                                        <td>
                                            {a.checked_in
                                                ? <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "#f0fdf4", padding: "5px 12px", borderRadius: 10 }}>✓ Đã Check-in<br /><span style={{ fontSize: 10, fontWeight: 400 }}>{fmtDate(a.checked_in_at)}</span></span>
                                                : <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: 10 }}>Chờ check-in</span>
                                            }
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {a.qr_code
                                                ? <button className="btn btn-outline btn-sm" style={{ borderRadius: 8, padding: "5px 12px", fontSize: 12 }} onClick={() => setQrItem(a)}>📱 Xem QR</button>
                                                : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                                            }
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                <button className="btn btn-danger btn-sm" style={{ borderRadius: 8, width: 34, height: 34 }} onClick={() => handleDelete(a.id)} title="Gỡ khỏi sự kiện">🗑</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Thêm khách ngoài */}
            <Modal title="🌐 Thêm Khách mời bên ngoài" isOpen={modal} onClose={() => { setModal(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
                    <div className="form-group">
                        <label>Sự kiện <span style={{ color: "red" }}>*</span></label>
                        <select id="ext-event-select" className="form-control" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                            <option value="">— Chọn sự kiện —</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Họ và tên <span style={{ color: "red" }}>*</span></label>
                            <input id="ext-name-input" className="form-control" placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Email <span style={{ color: "red" }}>*</span></label>
                            <input id="ext-email-input" type="email" className="form-control" placeholder="guest@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Tổ chức / Công ty</label>
                            <input className="form-control" placeholder="Công ty ABC" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Chức danh</label>
                            <input className="form-control" placeholder="Giám đốc Marketing" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Ghi chú</label>
                        <textarea className="form-control" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>
                    <button id="btn-submit-external" type="submit" className="btn btn-primary w-full" disabled={saving} style={{ height: 46, fontWeight: 800 }}>
                        {saving ? "Đang thêm..." : "🚀 Thêm & Tạo mã QR"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Bulk invite */}
            <Modal title="💌 Mời khách hàng loạt" isOpen={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="900px">
                <form onSubmit={handleBulk}>
                    <div className="form-group">
                        <label>Sự kiện <span style={{ color: "red" }}>*</span></label>
                        <select className="form-control" value={bulkForm.event_id} onChange={e => setBulkForm({ ...bulkForm, event_id: e.target.value })} required>
                            <option value="">— Chọn sự kiện —</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                    </div>
                    <div className="grid-2" style={{ gap: 24 }}>
                        <div className="form-group">
                            <label>Danh sách khách (Tên, Email — mỗi dòng 1 khách) <span style={{ color: "red" }}>*</span></label>
                            <textarea className="form-control" rows={8} placeholder={"Nguyễn Văn A, a@example.com\nTrần Thị B, b@example.com"} value={bulkForm.guests} onChange={e => setBulkForm({ ...bulkForm, guests: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Nội dung thư mời (tùy chọn)</label>
                            <textarea className="form-control" rows={8} placeholder="Trân trọng kính mời bạn tham dự..." value={bulkForm.content} onChange={e => setBulkForm({ ...bulkForm, content: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="button" className="btn btn-outline" style={{ flex: 1, height: 48 }} onClick={() => setBulkOpen(false)}>Huỷ</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, height: 48, fontWeight: 800 }} disabled={bulkSending}>
                            {bulkSending ? "Đang gửi..." : "🚀 Gửi lời mời"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: QR */}
            <Modal title={`📱 Mã QR — ${qrItem?.name || ""}`} isOpen={!!qrItem} onClose={() => setQrItem(null)}>
                {qrItem && (
                    <div style={{ textAlign: "center" }}>
                        {qrItem.isNew && (
                            <div style={{ background: qrItem.emailSent ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${qrItem.emailSent ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, textAlign: "left" }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: qrItem.emailSent ? "#059669" : "#d97706" }}>
                                    {qrItem.emailSent ? "✅ Email mời đã được gửi!" : "⚠️ Thêm thành công (email chưa cấu hình)"}
                                </p>
                            </div>
                        )}
                        <div style={{ display: "inline-block", background: "#fff", padding: 14, borderRadius: 12, border: "2px solid var(--border-color)", marginBottom: 14 }}>
                            <QRImage value={qrItem.qr_code} size={180} />
                        </div>
                        <div style={{ background: "var(--bg-main)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, textAlign: "left", fontSize: 13 }}>
                            <div><strong>Khách:</strong> {qrItem.name}</div>
                            <div><strong>Email:</strong> {qrItem.email}</div>
                            {qrItem.organization && <div><strong>Tổ chức:</strong> {qrItem.organization}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                const a = document.createElement("a");
                                a.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrItem.qr_code)}&margin=10`;
                                a.download = `QR-${qrItem.name}.png`; a.click();
                            }}>⬇️ Tải QR</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ In vé</button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}
