import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { getNotifications, markRead, markAllRead, deleteNotif } from "../../services/notificationService";
import "../../styles/global.css";

const TYPE_CFG = {
    task_assigned: { icon: "📋", color: "#6366f1", label: "Nhiệm vụ" },
    status_change: { icon: "🔄", color: "#f59e0b", label: "Trạng thái" },
    event_reminder: { icon: "📅", color: "#10b981", label: "Nhắc nhở" },
    checkin: { icon: "✅", color: "#059669", label: "Check-in" },
    budget_alert: { icon: "💰", color: "#ef4444", label: "Ngân sách" },
    default: { icon: "🔔", color: "#94a3b8", label: "Thông báo" },
};

export default function NotificationCenter() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all | unread

    const load = async () => {
        setLoading(true);
        try {
            const r = await getNotifications();
            setNotifs(r.data || []);
        } catch {/**/ }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleRead = async (n) => {
        if (n.read_at) return;
        try {
            await markRead(n.id);
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
        } catch {/**/ }
    };

    const handleMarkAll = async () => {
        try {
            await markAllRead();
            setNotifs(prev => prev.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
        } catch {/**/ }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteNotif(id);
            setNotifs(prev => prev.filter(x => x.id !== id));
        } catch {/**/ }
    };

    const fmtTime = (d) => {
        if (!d) return "";
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return "Vừa xong";
        if (m < 60) return `${m} phút trước`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} giờ trước`;
        return new Date(d).toLocaleDateString("vi-VN");
    };

    const filtered = filter === "unread" ? notifs.filter(n => !n.read_at) : notifs;
    const unreadCnt = notifs.filter(n => !n.read_at).length;

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>🔔 Thông báo</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        {unreadCnt > 0 ? `${unreadCnt} chưa đọc` : "Tất cả đã đọc"}
                    </p>
                </div>
                {unreadCnt > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={handleMarkAll}>
                        ✓ Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {[
                    { key: "all", label: `Tất cả (${notifs.length})` },
                    { key: "unread", label: `Chưa đọc (${unreadCnt})` },
                ].map(t => (
                    <button key={t.key} className={`btn btn-sm ${filter === t.key ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setFilter(t.key)}>{t.label}</button>
                ))}
            </div>

            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <span>🔔</span>
                    <p>{filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map(n => {
                        const cfg = TYPE_CFG[n.type] || TYPE_CFG.default;
                        const isUnread = !n.read_at;
                        return (
                            <div key={n.id}
                                onClick={() => handleRead(n)}
                                style={{
                                    display: "flex", alignItems: "flex-start", gap: 14,
                                    padding: "14px 18px",
                                    background: isUnread ? "rgba(99,102,241,0.04)" : "var(--bg-card)",
                                    border: `1px solid ${isUnread ? "rgba(99,102,241,0.15)" : "var(--border-color)"}`,
                                    borderRadius: "var(--border-radius)",
                                    cursor: "pointer",
                                    transition: "var(--transition)",
                                    position: "relative",
                                }}>
                                {/* Icon */}
                                <div style={{
                                    width: 38, height: 38, borderRadius: "50%",
                                    background: cfg.color + "18",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18, flexShrink: 0,
                                }}>
                                    {cfg.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, color: cfg.color,
                                            background: cfg.color + "15", padding: "1px 8px", borderRadius: 999
                                        }}>
                                            {cfg.label}
                                        </span>
                                        {isUnread && (
                                            <span style={{
                                                width: 7, height: 7, background: "var(--color-primary)",
                                                borderRadius: "50%", flexShrink: 0
                                            }} />
                                        )}
                                    </div>
                                    <div style={{ fontWeight: isUnread ? 600 : 400, fontSize: 14, color: "var(--text-primary)", marginBottom: 3 }}>
                                        {n.title}
                                    </div>
                                    {n.message && (
                                        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                            {n.message}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                                        {fmtTime(n.created_at)}
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={(e) => handleDelete(n.id, e)}
                                    style={{
                                        background: "none", border: "none", color: "var(--text-muted)",
                                        cursor: "pointer", padding: 4, borderRadius: 6, fontSize: 16,
                                        flexShrink: 0, opacity: 0.6
                                    }}
                                    title="Xóa">✕</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
