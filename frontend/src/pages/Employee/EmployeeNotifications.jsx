import { useEffect, useState } from "react";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { getNotifications, markRead, markAllRead, deleteNotif } from "../../services/notificationService";
import "../../styles/employee-theme.css";

const NOTIF_CFG = {
    event_reminder: { icon:"📅", bg:"var(--emp-accent-light)", stroke:"var(--emp-accent)", label:"Nhắc nhở" },
    status_change:  { icon:"🔄", bg:"var(--emp-amber-bg)", stroke:"var(--emp-amber)", label:"Cập nhật" },
    checkin:        { icon:"✅", bg:"var(--emp-green-bg)", stroke:"var(--emp-green)", label:"Xác nhận" },
    budget_alert:   { icon:"💰", bg:"var(--emp-red-bg)", stroke:"var(--emp-red)", label:"Cảnh báo" },
    task_assigned:  { icon:"📋", bg:"var(--emp-accent-light)", stroke:"var(--emp-accent)", label:"Nhiệm vụ" },
    default:        { icon:"🔔", bg:"var(--emp-surface2)", stroke:"var(--emp-text3)", label:"Thông báo" },
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
        <EmployeeLayout title="Thông báo" subtitle={unreadCnt > 0 ? `${unreadCnt} chưa đọc` : "Tất cả đã đọc"} unreadCount={unreadCnt}>
            {/* Header actions */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div className="emp-pill-row" style={{ marginBottom:0 }}>
                    <button className={`emp-pill${filter==="all"?" active":""}`} onClick={() => setFilter("all")}>
                        Tất cả ({notifs.length})
                    </button>
                    <button className={`emp-pill${filter==="unread"?" active":""}`} onClick={() => setFilter("unread")}>
                        Chưa đọc ({unreadCnt})
                    </button>
                </div>
                {unreadCnt > 0 && (
                    <button className="emp-btn-ghost" style={{ fontSize:12 }} onClick={handleMarkAll}>
                        ✓ Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {loading ? (
                <div className="emp-empty"><div className="emp-empty-icon">⏳</div><p>Đang tải...</p></div>
            ) : filtered.length === 0 ? (
                <div className="emp-panel emp-empty">
                    <div className="emp-empty-icon">🔔</div>
                    <p>{filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}</p>
                </div>
            ) : (
                <div className="emp-panel" style={{ padding:"4px 20px" }}>
                    {filtered.map(n => {
                        const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.default;
                        const isUnread = !n.read_at;
                        return (
                            <div key={n.id} className={`emp-notif-item${isUnread ? " unread" : ""}`}
                                onClick={() => handleRead(n)}>
                                {/* Icon */}
                                <div className="emp-notif-icon" style={{ background:cfg.bg, fontSize:16 }}>
                                    {cfg.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                                        <span style={{ fontSize:10, fontWeight:600, color:cfg.stroke, background:cfg.bg, padding:"1px 8px", borderRadius:999 }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="emp-notif-text" style={{ fontWeight: isUnread ? 500 : 400 }}>
                                        {n.title}
                                    </div>
                                    {n.message && (
                                        <div style={{ fontSize:12, color:"var(--emp-text3)", marginTop:3, lineHeight:1.5 }}>
                                            {n.message}
                                        </div>
                                    )}
                                    <div className="emp-notif-time">{fmtTime(n.created_at)}</div>
                                </div>

                                {/* Unread dot + delete */}
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                                    {isUnread && <div className="emp-unread-dot" />}
                                    <button
                                        onClick={(e) => handleDelete(n.id, e)}
                                        style={{ background:"none", border:"none", color:"var(--emp-text3)", cursor:"pointer", padding:4, fontSize:14, opacity:0.5 }}
                                        title="Xóa">✕</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </EmployeeLayout>
    );
}
