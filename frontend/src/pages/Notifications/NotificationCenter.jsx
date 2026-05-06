import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { getNotifications, markRead, markAllRead, deleteNotif } from "../../services/notificationService";
import "../../styles/global.css";

const TYPE_CFG = {
    task_assigned:  { icon: "📋", color: "#6366f1", label: "Nhiệm vụ" },
    status_change:  { icon: "🔄", color: "#f59e0b", label: "Trạng thái" },
    event_reminder: { icon: "📅", color: "#10b981", label: "Nhắc nhở" },
    event_approved: { icon: "✅", color: "#059669", label: "Duyệt sự kiện" },
    checkin:        { icon: "🎯", color: "#059669", label: "Check-in" },
    budget_alert:   { icon: "💰", color: "#ef4444", label: "Ngân sách" },
    registration:   { icon: "🎟️", color: "#6366f1", label: "Đăng ký" },
    default:        { icon: "🔔", color: "#94a3b8", label: "Thông báo" },
};

export default function NotificationCenter() {
    const navigate = useNavigate();
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
        // Đánh dấu đã đọc
        if (!n.read_at) {
            try {
                await markRead(n.id);
                setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
            } catch {/**/ }
        }
        // Nếu có link → điều hướng đến trang liên quan
        if (n.link) {
            navigate(n.link);
        }
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
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">Trung tâm Thông báo</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                        {unreadCnt > 0 ? (
                            <span>Bạn đang có <strong>{unreadCnt}</strong> cập nhật mới chưa phản hồi.</span>
                        ) : (
                            "Tuyệt vời! Bạn đã xử lý tất cả thông báo quan trọng."
                        )}
                    </p>
                </div>
                {unreadCnt > 0 && (
                    <button className="btn btn-outline" style={{ borderRadius: 14, height: 48, fontWeight: 700, padding: "0 20px" }} onClick={handleMarkAll}>
                        ✓ Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div style={{ 
                display: "flex", gap: 8, marginBottom: 28, padding: "8px", 
                background: "#f1f5f9", borderRadius: 16, width: "fit-content" 
            }}>
                {[
                    { key: "all", label: "Tất cả thông báo", count: notifs.length },
                    { key: "unread", label: "Chưa đọc", count: unreadCnt },
                ].map(t => (
                    <button key={t.key} 
                        style={{ 
                            padding: "10px 24px", borderRadius: 12, border: "none",
                            fontSize: 13, fontWeight: 800, cursor: "pointer",
                            background: filter === t.key ? "var(--color-primary)" : "transparent",
                            color: filter === t.key ? "#fff" : "#64748b",
                            transition: "all 0.2s"
                        }}
                        onClick={() => setFilter(t.key)}>
                        {t.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>({t.count})</span>
                    </button>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filtered.map(n => {
                        const cfg = TYPE_CFG[n.type] || TYPE_CFG.default;
                        const isUnread = !n.read_at;
                        return (
                            <div key={n.id}
                                onClick={() => handleRead(n)}
                                className="notification-item"
                                style={{
                                    display: "flex", alignItems: "center", gap: 20,
                                    padding: "24px 32px",
                                    background: isUnread ? "rgba(99,102,241,0.03)" : "#fff",
                                    border: `1px solid ${isUnread ? "rgba(99,102,241,0.12)" : "#f1f5f9"}`,
                                    borderRadius: 20,
                                    cursor: n.link ? "pointer" : isUnread ? "pointer" : "default",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isUnread ? "0 10px 15px -10px rgba(99,102,241,0.1)" : "none",
                                    position: "relative",
                                }}
                            >
                                {/* Left Indicator */}
                                {isUnread && (
                                    <div style={{ 
                                        position: "absolute", left: 0, top: "20%", bottom: "20%", 
                                        width: 4, background: "var(--color-primary)", borderRadius: "0 4px 4px 0" 
                                    }} />
                                )}

                                {/* Icon */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    background: cfg.color + "12",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 24, flexShrink: 0, border: `1px solid ${cfg.color}15`
                                }}>
                                    {cfg.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 900, color: cfg.color,
                                            background: cfg.color + "12", padding: "4px 12px", borderRadius: 8,
                                            textTransform: "uppercase", letterSpacing: "0.05em"
                                        }}>
                                            {cfg.label}
                                        </span>
                                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", fontWeight: 500 }}>
                                            {fmtTime(n.created_at)}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: isUnread ? 800 : 700, fontSize: 16, color: "#1e293b", marginBottom: 4 }}>
                                        {n.title}
                                    </div>
                                    {n.message && (
                                        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, fontWeight: 500 }}>
                                            {n.message}
                                        </div>
                                    )}
                                </div>

                                {/* Action button for desktop */}
                                {n.link && (
                                    <div style={{
                                        padding: "8px 16px", borderRadius: 10, background: "#f8fafc",
                                        fontSize: 12, fontWeight: 700, color: "var(--color-primary)",
                                        border: "1px solid #e2e8f0"
                                    }}>
                                        Xử lý ngay →
                                    </div>
                                )}

                                {/* Delete */}
                                <button
                                    onClick={(e) => handleDelete(n.id, e)}
                                    className="btn-delete-notif"
                                    style={{
                                        background: "#fff1f2", border: "none", color: "#ef4444",
                                        cursor: "pointer", width: 32, height: 32, borderRadius: 10, 
                                        fontSize: 14, flexShrink: 0, opacity: 0.5,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.2s"
                                    }}
                                    title="Gỡ bỏ">✕</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
