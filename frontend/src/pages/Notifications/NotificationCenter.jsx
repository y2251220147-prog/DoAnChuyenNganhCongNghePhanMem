import { getEvents } from "../../services/eventService";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";
import api from "../../services/api";

const NOTIF_TYPES = {
    task_assigned:  { icon: "📋", color: "#6366f1", label: "Nhiệm vụ" },
    status_change:  { icon: "🔄", color: "#f59e0b", label: "Trạng thái" },
    event_reminder: { icon: "📅", color: "#10b981", label: "Nhắc nhở" },
    event_approved: { icon: "✅", color: "#059669", label: "Duyệt sự kiện" },
    checkin:        { icon: "🎯", color: "#059669", label: "Check-in" },
    budget_alert:   { icon: "💰", color: "#ef4444", label: "Ngân sách" },
    registration:   { icon: "🎟️", color: "#6366f1", label: "Đăng ký" },
    broadcast:      { icon: "📢", color: "#7c3aed", label: "Thông báo chung" },
    default:        { icon: "🔔", color: "#94a3b8", label: "Thông báo" },
};

export default function NotificationCenter() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stream, setStream] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(true);
    const [viewFilter, setViewFilter] = useState("all");

    // Broadcast form states
    const [isDrafting, setIsDrafting] = useState(false);
    const [events, setEvents] = useState([]);
    const [draft, setDraft] = useState({ eventId: "", title: "", message: "" });
    const [isSending, setIsSending] = useState(false);

    const syncNotifications = async () => {
        setIsRefreshing(true);
        try {
            const r = await getNotifications();
            setStream(r.data || []);
            
            if (user?.role !== "user") {
                const evR = await getEvents();
                setEvents(evR.data || []);
            }
        } catch (e) {
            console.error("Notif sync failed", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => { syncNotifications(); }, []);

    const markAsRead = async (n) => {
        if (!n.read_at) {
            try {
                await markRead(n.id);
                setStream(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
            } catch {/**/}
        }
        if (n.link) navigate(n.link);
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!draft.eventId || !draft.title || !draft.message) return alert("Vui lòng nhập đầy đủ thông tin");
        
        setIsSending(true);
        try {
            // US-016: Send notification to all attendees of an event
            await api.post(`/events/${draft.eventId}/broadcast`, {
                title: draft.title,
                message: draft.message,
                type: 'broadcast'
            });
            alert("Đã gửi thông báo thành công!");
            setDraft({ eventId: "", title: "", message: "" });
            setIsDrafting(false);
            syncNotifications();
        } catch (err) {
            alert("Lỗi khi gửi thông báo: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSending(false);
        }
    };

    const displayed = viewFilter === "unread" ? stream.filter(n => !n.read_at) : stream;
    const pendingCount = stream.filter(n => !n.read_at).length;

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 28 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900 }}>Trung tâm Thông báo</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        {pendingCount > 0 ? `Bạn có ${pendingCount} thông báo mới chưa xem` : "Bạn đã cập nhật mọi thứ!"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    {user?.role !== "user" && (
                        <button className="btn btn-primary btn-sm" onClick={() => setIsDrafting(!isDrafting)}>
                            {isDrafting ? "✕ Hủy soạn" : "📢 Gửi thông báo sự kiện"}
                        </button>
                    )}
                    {pendingCount > 0 && (
                        <button className="btn btn-outline btn-sm" onClick={async () => {
                            await markAllRead();
                            setStream(prev => prev.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
                        }}>✓ Đọc tất cả</button>
                    )}
                </div>
            </div>

            {/* US-016: Broadcast Panel */}
            {isDrafting && (
                <div className="card" style={{ marginBottom: 24, padding: 20, border: "2px solid var(--color-primary-light)", background: "rgba(99,102,241,0.02)" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: "var(--color-primary)" }}>🚀 Soạn thông báo thay đổi sự kiện</h3>
                    <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="form-group">
                            <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: "block" }}>Chọn Sự kiện:</label>
                            <select 
                                className="form-control"
                                style={{ borderRadius: 10, padding: "8px 12px" }}
                                value={draft.eventId}
                                onChange={e => setDraft({...draft, eventId: e.target.value})}
                                required
                            >
                                <option value="">-- Chọn sự kiện mục tiêu --</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.status})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: "block" }}>Tiêu đề:</label>
                            <input 
                                type="text" className="form-control" placeholder="Ví dụ: Thay đổi thời gian bắt đầu..."
                                style={{ borderRadius: 10 }}
                                value={draft.title}
                                onChange={e => setDraft({...draft, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: "block" }}>Nội dung chi tiết:</label>
                            <textarea 
                                className="form-control" rows="3" placeholder="Nhập nội dung thông báo gửi đến tất cả người tham gia..."
                                style={{ borderRadius: 10, resize: "none" }}
                                value={draft.message}
                                onChange={e => setDraft({...draft, message: e.target.value})}
                                required
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                            <button className="btn btn-primary" type="submit" disabled={isSending}>
                                {isSending ? "⌛ Đang gửi..." : "✈️ Gửi cho tất cả người tham gia"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[
                    { k: "all", l: `Tất cả (${stream.length})` },
                    { k: "unread", l: `Chưa đọc (${pendingCount})` },
                ].map(f => (
                    <button key={f.k} className={`btn btn-sm ${viewFilter === f.k ? "btn-primary" : "btn-outline"}`}
                        style={{ borderRadius: 20, padding: "5px 15px" }}
                        onClick={() => setViewFilter(f.k)}>{f.l}</button>
                ))}
            </div>

            {isRefreshing ? (
                <div className="empty-state" style={{ padding: 60 }}>⌛ Đang đồng bộ hóa...</div>
            ) : displayed.length === 0 ? (
                <div className="empty-state" style={{ padding: 80, border: "1px dashed var(--border-color)", borderRadius: 20 }}>
                    <span style={{ fontSize: 40 }}>📭</span>
                    <p style={{ marginTop: 12, color: "var(--text-muted)" }}>{viewFilter === "unread" ? "Không có thông báo mới" : "Hộp thư của bạn đang trống"}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayed.map(n => {
                        const config = NOTIF_TYPES[n.type] || NOTIF_TYPES.default;
                        const unread = !n.read_at;
                        return (
                            <div key={n.id}
                                onClick={() => markAsRead(n)}
                                className="card-hover"
                                style={{
                                    display: "flex", gap: 16, padding: "16px 20px",
                                    background: unread ? "rgba(99,102,241,0.03)" : "var(--bg-card)",
                                    border: `1px solid ${unread ? "rgba(99,102,241,0.12)" : "var(--border-color)"}`,
                                    borderRadius: 16, cursor: "pointer", transition: "all 0.2s ease",
                                    boxShadow: unread ? "0 4px 12px rgba(99,102,241,0.05)" : "none",
                                    position: "relative"
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: config.color + "15",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 22, flexShrink: 0, color: config.color
                                }}>
                                    {config.icon}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, color: "white",
                                            background: config.color, padding: "2px 8px", borderRadius: 6,
                                            textTransform: "uppercase", letterSpacing: "0.02em"
                                        }}>
                                            {config.label}
                                        </span>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>• {formatRelativeTime(n.created_at)}</span>
                                        {unread && <div style={{ width: 8, height: 8, background: "var(--color-primary)", borderRadius: "50%" }}></div>}
                                    </div>
                                    <h4 style={{ fontSize: 15, fontWeight: unread ? 800 : 600, color: "var(--text-primary)", marginBottom: 4 }}>{n.title}</h4>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.message}</p>
                                </div>

                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await deleteNotif(n.id);
                                        setStream(prev => prev.filter(x => x.id !== n.id));
                                    }}
                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: 4 }}
                                    title="Gỡ bỏ"
                                >✕</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}

function formatRelativeTime(date) {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(date).toLocaleDateString("vi-VN");
}

