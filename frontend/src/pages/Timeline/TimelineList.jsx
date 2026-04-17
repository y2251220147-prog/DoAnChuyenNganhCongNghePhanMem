import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { createTimeline, deleteTimeline, getTimeline } from "../../services/timelineService";
import "../../styles/global.css";

// ── Helpers ───────────────────────────────────────────────────
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";

// Tính trạng thái của từng mục timeline
function getItemStatus(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    if (now < start) return "upcoming";
    if (end && now > end) return "done";
    if (!end && now > start) return "done";
    return "active"; // đang diễn ra
}

const ITEM_STATUS_CFG = {
    upcoming: { dot: "#94a3b8", label: "Sắp diễn ra", labelColor: "#64748b", bg: "transparent" },
    active: { dot: "#10b981", label: "Đang diễn ra", labelColor: "#059669", bg: "rgba(16,185,129,0.07)" },
    done: { dot: "#6366f1", label: "Đã xong", labelColor: "#6366f1", bg: "rgba(99,102,241,0.04)" },
};

const EMPTY_FORM = { event_id: "", title: "", start_time: "", end_time: "", description: "" };

export default function TimelineList() {
    const [timeline, setTimeline] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmit] = useState(false);
    const [error, setError] = useState("");
    const [filterEvent, setFilter] = useState("all");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const load = async () => {
        setLoading(true);
        try {
            const [tR, eR] = await Promise.all([getTimeline(), getEvents()]);
            setTimeline(tR.data || []);
            setEvents(eR.data || []);
        } catch {/**/ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa mục lịch trình này?")) return;
        try {
            await deleteTimeline(id);
            setTimeline(prev => prev.filter(t => t.id !== id));
        } catch { alert("Xóa thất bại"); }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setError("");
        if (!form.event_id) return setError("Vui lòng chọn sự kiện.");
        if (!form.title.trim()) return setError("Tiêu đề không được để trống.");
        if (form.end_time && form.end_time <= form.start_time)
            return setError("Giờ kết thúc phải sau giờ bắt đầu.");
        setSubmit(true);
        try {
            await createTimeline(form);
            setModalOpen(false);
            setForm(EMPTY_FORM);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Thêm thất bại");
        } finally { setSubmit(false); }
    };

    const getEventName = (eid) => events.find(e => e.id === eid)?.name || `Sự kiện #${eid}`;
    const getEventDate = (eid) => {
        const ev = events.find(e => e.id === eid);
        return ev?.start_date || ev?.date || null;
    };

    // Lọc theo event
    const filtered = filterEvent === "all"
        ? timeline
        : timeline.filter(t => String(t.event_id) === String(filterEvent));

    // Nhóm theo event_id rồi sort theo start_time
    const grouped = filtered.reduce((acc, item) => {
        const key = item.event_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    Object.values(grouped).forEach(arr =>
        arr.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    );

    // Sort event groups theo thứ tự events
    const sortedEventIds = Object.keys(grouped).sort((a, b) => {
        const ea = events.find(e => String(e.id) === a);
        const eb = events.find(e => String(e.id) === b);
        return (new Date(ea?.start_date || 0)) - (new Date(eb?.start_date || 0));
    });

    // Thống kê nhanh
    const totalItems = timeline.length;
    const activeItems = timeline.filter(t => getItemStatus(t.start_time, t.end_time) === "active").length;
    const doneItems = timeline.filter(t => getItemStatus(t.start_time, t.end_time) === "done").length;
    const upcomingItems = timeline.filter(t => getItemStatus(t.start_time, t.end_time) === "upcoming").length;

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">🗓️ Lịch trình sự kiện</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Quản lý chi tiết kịch bản chương trình theo từng mốc thời gian {timeline.length > 0 && `(${timeline.length} đầu mục)`}
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 24px" }}
                        onClick={() => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); }}>
                        + Thêm mục lịch trình
                    </button>
                )}
            </div>

            {/* ── Thống kê nhanh ── */}
            <div className="grid-4" style={{ marginBottom: 28, gap: 20 }}>
                {[
                    { icon: "📋", label: "Tổng hạng mục", value: totalItems, color: "#6366f1", bg: "linear-gradient(135deg, #fff 0%, #f5f3ff 100%)" },
                    { icon: "🔥", label: "Đang diễn ra", value: activeItems, color: "#10b981", bg: "linear-gradient(135deg, #fff 0%, #f0fdf4 100%)" },
                    { icon: "⏳", label: "Sắp diễn ra", value: upcomingItems, color: "#f59e0b", bg: "linear-gradient(135deg, #fff 0%, #fffbeb 100%)" },
                    { icon: "✅", label: "Đã hoàn tất", value: doneItems, color: "#64748b", bg: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)" },
                ].map(s => (
                    <div key={s.label} className="card-stat" style={{ background: s.bg, border: "1px solid #e2e8f0" }}>
                        <div className="card-stat-icon"
                            style={{ background: "#fff", color: s.color, fontSize: 22, boxShadow: "var(--shadow-sm)" }}>{s.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ color: s.color, fontSize: 24, fontWeight: 800 }}>{s.value}</h3>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Lọc theo sự kiện ── */}
            <div style={{ marginBottom: 20 }}>
                <select className="form-control" style={{ maxWidth: 280 }}
                    value={filterEvent} onChange={e => setFilter(e.target.value)}>
                    <option value="all">🎪 Tất cả sự kiện ({timeline.length} mục)</option>
                    {events
                        .filter(ev => timeline.some(t => t.event_id === ev.id))
                        .map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.name} ({timeline.filter(t => t.event_id === ev.id).length} mục)
                            </option>
                        ))
                    }
                </select>
            </div>

            {/* ── Nội dung chính ── */}
            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải lịch trình...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <span>🗓️</span>
                    <p>Chưa có lịch trình nào{canManage ? " — hãy thêm mục đầu tiên!" : "."}</p>
                </div>
            ) : (
                // Hiển thị từng nhóm sự kiện
                sortedEventIds.map(eventId => {
                    const items = grouped[eventId];
                    const evName = getEventName(Number(eventId));
                    const evDate = getEventDate(Number(eventId));
                    const activeNow = items.filter(t => getItemStatus(t.start_time, t.end_time) === "active").length;

                    return (
                        <div key={eventId} style={{ marginBottom: 32 }}>
                            {/* Header nhóm sự kiện */}
                            <div style={{
                                background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
                                borderRadius: "12px 12px 0 0",
                                padding: "14px 20px",
                                display: "flex", alignItems: "center",
                                justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                            }}>
                                <div>
                                    <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>
                                        🎪 {evName}
                                    </div>
                                    {evDate && (
                                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                                            📅 {fmtDate(evDate)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <span style={{
                                        background: "rgba(255,255,255,0.2)", color: "white",
                                        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600
                                    }}>
                                        {items.length} mục
                                    </span>
                                    {activeNow > 0 && (
                                        <span style={{
                                            background: "#10b981", color: "white",
                                            padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700
                                        }}>
                                            🔴 LIVE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Visual Timeline */}
                            <div className="card" style={{
                                borderRadius: "0 0 12px 12px",
                                borderTop: "none", padding: "24px 24px 16px"
                            }}>
                                <div style={{ position: "relative", paddingLeft: 32 }}>
                                    {/* Đường dọc */}
                                    <div style={{
                                        position: "absolute", left: 11, top: 6, bottom: 6,
                                        width: 2,
                                        background: "linear-gradient(to bottom, #6366f1, #94a3b8)",
                                        borderRadius: 2,
                                    }} />

                                    {items.map((item, idx) => {
                                        const status = getItemStatus(item.start_time, item.end_time);
                                        const cfg = ITEM_STATUS_CFG[status];
                                        const startT = fmtTime(item.start_time);
                                        const endT = fmtTime(item.end_time);
                                        const isLast = idx === items.length - 1;

                                        return (
                                            <div key={item.id} style={{
                                                position: "relative",
                                                marginBottom: isLast ? 0 : 20,
                                            }}>
                                                {/* Dot trên đường dọc */}
                                                <div style={{
                                                    position: "absolute",
                                                    left: -27, top: 8,
                                                    width: 14, height: 14,
                                                    borderRadius: "50%",
                                                    background: cfg.dot,
                                                    border: "2.5px solid white",
                                                    boxShadow: `0 0 0 2.5px ${cfg.dot}`,
                                                    zIndex: 1,
                                                    // Hiệu ứng nhấp nháy khi đang diễn ra
                                                    animation: status === "active" ? "pulse 1.5s infinite" : "none",
                                                }} />

                                                {/* Card nội dung */}
                                                <div style={{
                                                    background: cfg.bg || "var(--bg-card)",
                                                    border: `1px solid ${status === "active" ? "#10b981" : "var(--border-color)"}`,
                                                    borderRadius: 10,
                                                    padding: "12px 16px",
                                                    transition: "all 0.2s",
                                                }}>
                                                    {/* Dòng 1: giờ + tiêu đề + badge trạng thái */}
                                                    <div style={{
                                                        display: "flex", alignItems: "flex-start",
                                                        justifyContent: "space-between", gap: 10, flexWrap: "wrap"
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            {/* Khung giờ */}
                                                            <div style={{
                                                                background: status === "active" ? "#10b981" : "var(--color-primary)",
                                                                color: "white",
                                                                padding: "3px 10px",
                                                                borderRadius: 6,
                                                                fontSize: 13,
                                                                fontWeight: 700,
                                                                fontFamily: "monospace",
                                                                whiteSpace: "nowrap",
                                                            }}>
                                                                🕐 {startT}{endT ? ` → ${endT}` : ""}
                                                            </div>
                                                            {/* Tiêu đề */}
                                                            <span style={{
                                                                fontWeight: 700,
                                                                fontSize: 14,
                                                                color: "var(--text-primary)",
                                                            }}>
                                                                {item.title}
                                                            </span>
                                                        </div>

                                                        {/* Badge trạng thái + nút xóa */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{
                                                                fontSize: 11, fontWeight: 600,
                                                                color: cfg.labelColor,
                                                                background: cfg.dot + "22",
                                                                padding: "2px 8px",
                                                                borderRadius: 999,
                                                            }}>
                                                                {status === "active" && "🔴 "}
                                                                {cfg.label}
                                                            </span>
                                                            {canManage && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    style={{ padding: "2px 8px", fontSize: 11 }}
                                                                    onClick={() => handleDelete(item.id)}
                                                                    title="Xóa">
                                                                    🗑
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mô tả */}
                                                    {item.description && (
                                                        <p style={{
                                                            fontSize: 13,
                                                            color: "var(--text-secondary)",
                                                            marginTop: 8,
                                                            paddingLeft: 4,
                                                            borderLeft: "2px solid var(--border-color)",
                                                        }}>
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* ── CSS animation pulse ── */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 2.5px #10b981; }
                    50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0.3); }
                }
            `}</style>

            {/* ── Modal thêm mục lịch trình ── */}
            <Modal
                title="✨ Thêm mục lịch trình mới"
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setError(""); }}
                maxWidth="920px">
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 24, padding: "10px 0" }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="grid-2" style={{ gap: 24 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 15, fontWeight: 700 }}>Sự kiện tiếp nhận <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <select className="form-control"
                                style={{ height: 50, fontSize: 15, borderRadius: 12 }}
                                value={form.event_id}
                                onChange={e => setForm({ ...form, event_id: e.target.value })}
                                required>
                                <option value="">-- Chọn sự kiện từ danh sách --</option>
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.start_date).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 15, fontWeight: 700 }}>Tiêu đề hoạt động <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input className="form-control"
                                style={{ height: 50, fontSize: 15, borderRadius: 12 }}
                                placeholder="VD: Khai mạc, Phát biểu, Tiệc tối..."
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                required />
                        </div>
                    </div>

                    <div className="grid-2" style={{ gap: 24 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 15, fontWeight: 700 }}>Thời điểm bắt đầu <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input type="datetime-local" className="form-control"
                                style={{ height: 50, fontSize: 15, borderRadius: 12 }}
                                value={form.start_time}
                                onChange={e => setForm({ ...form, start_time: e.target.value })}
                                required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 15, fontWeight: 700 }}>Thời điểm kết thúc (tùy chọn)</label>
                            <input type="datetime-local" className="form-control"
                                style={{ height: 50, fontSize: 15, borderRadius: 12 }}
                                value={form.end_time}
                                onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 15, fontWeight: 700 }}>Ghi chú nội dung kịch bản</label>
                        <textarea className="form-control" rows="4"
                            style={{ fontSize: 15, padding: 16, borderRadius: 12, lineHeight: 1.6 }}
                            placeholder="Chi tiết diễn biến, nhân sự phụ trách, lưu ý kỹ thuật..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 16 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} style={{ borderRadius: 12, padding: "12px 32px", fontSize: 15 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary"
                            style={{ borderRadius: 12, padding: "12px 40px", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 20px -5px rgba(79,70,229,0.3)" }}
                            disabled={submitting}>
                            {submitting ? "Đang xử lý..." : "✅ Lưu lịch trình"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
