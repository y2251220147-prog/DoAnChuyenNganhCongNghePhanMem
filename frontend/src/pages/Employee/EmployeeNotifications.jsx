import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { getNotifications, markRead, markAllRead, deleteNotif } from "../../services/notificationService";
import "../../styles/global.css";

const NOTIF_CFG = {
    event_reminder: { icon: "📅", bg: "#eff6ff", color: "#3b82f6", label: "Nhắc nhở" },
    status_change:  { icon: "🔄", bg: "#fff7ed", color: "#f59e0b", label: "Cập nhật" },
    checkin:        { icon: "✅", bg: "#ecfdf5", color: "#10b981", label: "Xác nhận" },
    budget_alert:   { icon: "💰", bg: "#fef2f2", color: "#ef4444", label: "Cảnh báo" },
    task_assigned:  { icon: "📋", bg: "#f5f3ff", color: "#8b5cf6", label: "Nhiệm vụ" },
    default:        { icon: "🔔", bg: "#f8fafc", color: "#64748b", label: "Thông báo" },
};

const fmtTime = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const days = Math.floor(h / 24);
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return new Date(d).toLocaleDateString("vi-VN");
};

export default function EmployeeNotifications() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const load = async () => {
        setLoading(true);
        try { const r = await getNotifications(); setNotifs(r.data || []); }
        catch { /**/ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleRead = async (n) => {
        if (n.read_at) return;
        try {
            await markRead(n.id);
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
        } catch { /**/ }
    };

    const handleMarkAll = async () => {
        try {
            await markAllRead();
            setNotifs(prev => prev.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
        } catch { /**/ }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteNotif(id);
            setNotifs(prev => prev.filter(x => x.id !== id));
        } catch { /**/ }
    };

    const unreadCnt = notifs.filter(n => !n.read_at).length;
    const filtered = filter === "unread" ? notifs.filter(n => !n.read_at) : notifs;

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Trung tâm Thông báo</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{unreadCnt > 0 ? `Bạn có ${unreadCnt} thông báo chưa đọc` : "Bạn đã xem hết tất cả thông báo"}</p>
                </div>
                {unreadCnt > 0 && (
                    <button className="btn btn-outline" style={{ borderRadius: 12, fontSize: 13, fontWeight: 700 }} onClick={handleMarkAll}>
                        ✓ Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 32, background: "#f1f5f9", padding: 6, borderRadius: 14, width: "fit-content" }}>
                <button 
                    onClick={() => setFilter("all")}
                    style={{ 
                        padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                        background: filter === "all" ? "#fff" : "transparent",
                        color: filter === "all" ? "var(--color-primary)" : "var(--text-muted)",
                        boxShadow: filter === "all" ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.2s"
                    }}>
                    Tất cả ({notifs.length})
                </button>
                <button 
                    onClick={() => setFilter("unread")}
                    style={{ 
                        padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                        background: filter === "unread" ? "#fff" : "transparent",
                        color: filter === "unread" ? "var(--color-primary)" : "var(--text-muted)",
                        boxShadow: filter === "unread" ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.2s"
                    }}>
                    Chưa đọc ({unreadCnt})
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                    <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Đang tải thông báo...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: 100, textAlign: "center", border: "1px dashed #cbd5e1", background: "transparent" }}>
                    <div style={{ fontSize: 48, marginBottom: 24 }}>🔔</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>
                        {filter === "unread" ? "Tuyệt vời! Bạn không còn thông báo chưa đọc nào." : "Hiện tại bạn chưa có thông báo nào."}
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, borderRadius: 24, overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {filtered.map((n, idx) => {
                            const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.default;
                            const isUnread = !n.read_at;
                            return (
                                <div key={n.id} 
                                    onClick={() => handleRead(n)}
                                    style={{ 
                                        padding: 24, display: "flex", gap: 20, cursor: "pointer",
                                        background: isUnread ? "rgba(241, 245, 249, 0.4)" : "#fff",
                                        borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #f1f5f9",
                                        transition: "all 0.2s",
                                        position: "relative"
                                    }}
                                    className="notif-item-hover">
                                    
                                    {isUnread && (
                                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--color-primary)" }} />
                                    )}

                                    <div style={{ 
                                        width: 48, height: 48, borderRadius: 14, background: cfg.bg, flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                                    }}>
                                        {cfg.icon}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</span>
                                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>• {fmtTime(n.created_at)}</span>
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: isUnread ? 800 : 600, marginBottom: 4, color: "var(--text-primary)" }}>{n.title}</h4>
                                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.message}</p>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <button 
                                            onClick={(e) => handleDelete(n.id, e)}
                                            style={{ 
                                                width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent",
                                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                                color: "var(--text-muted)", transition: "all 0.2s"
                                            }}
                                            className="btn-delete-hover">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Layout>
    );
}
