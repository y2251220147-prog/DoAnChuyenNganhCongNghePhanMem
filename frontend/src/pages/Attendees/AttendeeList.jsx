import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import {
    getAllAttendees, addExternal, removeAttendee, getAttendeeStats, bulkAddExternal
} from "../../services/attendeeService";
import { formatDate } from "../../utils/dateUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

function QRImage({ value, size = 150 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" style={{ borderRadius: 10, border: "1px solid var(--border-color)", display: "block" }} />;
}

const TYPE_BADGE = {
    internal: { label: "🏢 Nội bộ", bg: "rgba(99,102,241,0.1)", color: "#4338ca" },
    external: { label: "👤 Khách mời", bg: "rgba(16,185,129,0.1)", color: "#047857" },
};

const EMPTY_FORM = { event_id: "", bulk_text: "", note: "" };

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

    const handleBulkInvite = async (e) => {
        e.preventDefault(); 
        if (!form.event_id) { setError("Vui lòng chọn sự kiện"); return; }
        if (!form.bulk_text.trim()) { setError("Vui lòng nhập danh sách khách mời"); return; }
        
        setError(""); setSubmitting(true);
        try {
            const guests = form.bulk_text.split("\n").map(line => {
                const [name, email] = line.split(",").map(s => s.trim());
                return { name, email };
            }).filter(g => g.name && g.email);

            if (guests.length === 0) {
                setError("Định dạng không hợp lệ. Vui lòng nhập: Tên, Email (cách nhau bởi dấu phẩy)");
                setSubmitting(false);
                return;
            }

            const res = await bulkAddExternal({ 
                event_id: Number(form.event_id), 
                guests,
                note: form.note 
            });
            
            alert(`Đã xử lý xong. Thêm thành công ${res.data.count}/${res.data.total} khách mời.`);
            setModal(false);
            setForm(EMPTY_FORM);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Mời khách hàng loạt thất bại");
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

    const exportToExcel = () => {
        const data = filtered.map(a => ({
            "Người tham gia": `${a.name} (${a.email})`,
            "Phân loại": a.attendee_type === "internal" ? "Nội bộ" : "Khách mời",
            "Cơ quan / Phòng ban": a.user_department || a.organization || "Cá nhân tự do",
            "Sự kiện tiếp nhận": getEventName(a.event_id),
            "Trạng thái": a.checked_in ? "Đã Check-in" : "Chờ duyệt",
            "Ngày đăng ký": formatDate(a.created_at)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách người tham gia");
        XLSX.writeFile(workbook, `Danh_sach_nguoi_tham_gia_${new Date().getTime()}.xlsx`);
    };

    const exportToPDF = async () => {
        const table = document.querySelector(".data-table");
        if (!table) return;

        try {
            // Chụp ảnh bảng bằng html2canvas để giữ font và định dạng
            const canvas = await html2canvas(table, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pdfWidth - 20; // Margin 10mm mỗi bên
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Thêm tiêu đề
            pdf.setFontSize(18);
            pdf.text("DANH SACH NGUOI THAM GIA", 14, 15);
            pdf.setFontSize(10);
            pdf.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, 14, 22);

            pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
            pdf.save(`Danh_sach_nguoi_tham_gia_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error("PDF Export error:", err);
            alert("Có lỗi khi xuất PDF. Vui lòng thử lại.");
        }
    };

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
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-outline" style={{ height: 46, padding: "0 20px", fontWeight: 700, borderColor: "#10b981", color: "#10b981" }}
                            onClick={exportToExcel}>
                            📊 Xuất Excel
                        </button>
                        <button className="btn btn-outline" style={{ height: 46, padding: "0 20px", fontWeight: 700, borderColor: "#ef4444", color: "#ef4444" }}
                            onClick={exportToPDF}>
                            📕 Xuất PDF
                        </button>
                        {canManage && (
                            <button className="btn btn-primary" style={{ height: 46, padding: "0 24px", fontWeight: 700 }}
                                onClick={() => { setForm(EMPTY_FORM); setError(""); setModal(true); }}>
                                + Mời khách hàng loạt
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
                    {[
                        { label: "Tổng người tham gia", value: stats.total, icon: "🎟️", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
                        { label: "Nhân viên nội bộ", value: stats.internal, icon: "🏢", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)" },
                        { label: "Khách mời ngoài", value: stats.external, icon: "👤", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
                        { label: "Đã Check-in", value: stats.checkedIn, icon: "✅", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: "var(--bg-card)", border: "1px solid var(--border-color)",
                            borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
                            transition: "transform 0.2s, box-shadow 0.2s", cursor: "default"
                        }} className="hover-lift">
                            <div style={{ 
                                width: 50, height: 50, borderRadius: 12, background: s.bg, 
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 
                            }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{loading ? "…" : s.value}</div>
                                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters Row */}
                <div style={{
                    display: "flex", gap: 12, marginBottom: 24, padding: "16px 20px",
                    background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)",
                    alignItems: "center", flexWrap: "wrap", boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
                        <input className="form-control" placeholder="Tìm kiếm tên, email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: "100%", height: 42, paddingLeft: 38, borderRadius: 10 }} />
                    </div>
                    
                    <div style={{ display: "flex", gap: 10 }}>
                        <select className="form-control" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
                            style={{ minWidth: 200, height: 42, borderRadius: 10 }}>
                            <option value="all">📅 Tất cả sự kiện</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                        <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}
                            style={{ minWidth: 150, height: 42, borderRadius: 10 }}>
                            <option value="all">👥 Tất cả loại</option>
                            <option value="internal">🏢 Nội bộ</option>
                            <option value="external">👤 Khách mời</option>
                        </select>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                            {filtered.length} kết quả
                        </span>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{ 
                    background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)", 
                    overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" 
                }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: "80px 0" }}><span>⏳</span><p>Đang tải dữ liệu...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state" style={{ padding: "80px 0" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
                            <div style={{ fontWeight: 600 }}>Không tìm thấy người tham gia phù hợp</div>
                            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>Người tham gia</th>
                                    <th>Phân loại</th>
                                    <th>Cơ quan / Phòng ban</th>
                                    <th>Sự kiện tiếp nhận</th>
                                    <th style={{ textAlign: "center" }}>Trạng thái</th>
                                    <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => {
                                    const badge = TYPE_BADGE[a.attendee_type] || TYPE_BADGE.external;
                                    return (
                                        <tr key={a.id} className="table-row-hover">
                                            <td style={{ paddingLeft: 24 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: 12,
                                                        background: a.attendee_type === "internal" ? "linear-gradient(135deg, #6366f1, #818cf8)" : "linear-gradient(135deg, #10b981, #34d399)",
                                                        color: "white", fontSize: 16, fontWeight: 800,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                                                    }}>
                                                        {a.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{a.name}</div>
                                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, padding: "2px 10px", width: "fit-content",
                                                        borderRadius: 999, background: badge.bg, color: badge.color, textTransform: "uppercase"
                                                    }}>{badge.label}</span>
                                                    {a.attendee_type === "internal" && (
                                                        <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>Tài khoản hệ thống</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                    {a.user_department ? (
                                                        <><span style={{ marginRight: 6 }}>🏢</span>{a.user_department}</>
                                                    ) : a.organization ? (
                                                        <><span style={{ marginRight: 6 }}>👥</span>{a.organization}</>
                                                    ) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Cá nhân tự do</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-primary)" }}>
                                                    🎯 {getEventName(a.event_id)}
                                                </div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                                    📅 {(() => {
                                                        const ev = events.find(e => e.id === a.event_id);
                                                        return ev ? formatDate(ev.start_date) : "N/A";
                                                    })()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {a.checked_in ? (
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "#dcfce7", padding: "4px 12px", borderRadius: 10, border: "1px solid #bdf1d0" }}>
                                                        ✓ CHECKED
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 12px", borderRadius: 10 }}>
                                                        CHỜ DUYỆT
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "right", paddingRight: 20 }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                    {a.qr_code && (
                                                        <button className="btn btn-sm btn-ghost" 
                                                            style={{ padding: 8, borderRadius: 10, color: "var(--color-primary)" }}
                                                            onClick={() => setQrItem(a)} title="Xem mã QR">
                                                            📱
                                                        </button>
                                                    )}
                                                    {canManage && (
                                                        <button className="btn btn-sm btn-ghost"
                                                            style={{ padding: 8, borderRadius: 10, color: "#dc2626" }}
                                                            onClick={() => handleDelete(a.id)} title="Xóa người tham gia">
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal mời khách hàng loạt */}
                <Modal title="💌 Mời khách hàng loạt" isOpen={modal} onClose={() => { setModal(false); setError(""); }}>
                    <form onSubmit={handleBulkInvite}>
                        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                        
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ fontWeight: 700, fontSize: 13 }}>Sự kiện <span style={{ color: "#ef4444" }}>*</span></label>
                            <select className="form-control" value={form.event_id}
                                onChange={e => setForm({ ...form, event_id: e.target.value })} required
                                style={{ height: 44, borderRadius: 10 }}>
                                <option value="">-- Chọn sự kiện để mời --</option>
                                {events.filter(ev => ["approved", "running", "planning"].includes(ev.status))
                                    .map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div className="form-group">
                                <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 4 }}>
                                    Danh sách khách mời <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                                    Nhập mỗi dòng: <strong>Tên, Email</strong> (ngăn cách bởi dấu phẩy)
                                </div>
                                <textarea className="form-control" 
                                    style={{ height: 180, borderRadius: 12, fontSize: 14, padding: "12px 15px", resize: "none" }}
                                    placeholder="Nguyễn Văn A, anguyen@gmail.com&#10;Trần Thị B, btran@gmail.com"
                                    value={form.bulk_text} 
                                    onChange={e => setForm({ ...form, bulk_text: e.target.value })} 
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 4 }}>
                                    Lời nhắn trong thư mời
                                </label>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                                    VD: Trân trọng kính mời bạn đến tham dự...
                                </div>
                                <textarea className="form-control" 
                                    style={{ height: 180, borderRadius: 12, fontSize: 14, padding: "12px 15px", resize: "none" }}
                                    placeholder="Nội dung lời nhắn sẽ được gửi cùng mã QR..."
                                    value={form.note} 
                                    onChange={e => setForm({ ...form, note: e.target.value })} 
                                />
                            </div>
                        </div>

                        <div style={{ 
                            background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#4338ca",
                            display: "flex", gap: 12, alignItems: "center"
                        }}>
                            <span style={{ fontSize: 18 }}>💡</span>
                            <span>Hệ thống sẽ tự động tạo mã QR Check-in duy nhất cho từng khách mời và gửi kèm trong email.</span>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button type="button" className="btn btn-outline" style={{ height: 44, padding: "0 24px" }}
                                onClick={() => setModal(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}
                                style={{ height: 44, padding: "0 30px", fontWeight: 700 }}>
                                {submitting ? "⏳ Đang xử lý..." : "🚀 Gửi lời mời hàng loạt"}
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
