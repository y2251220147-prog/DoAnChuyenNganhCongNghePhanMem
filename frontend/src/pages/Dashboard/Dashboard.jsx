import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations } from "../../services/attendeeService";
import "../../styles/global.css";

// FIX: Cập nhật STATUS_BADGE theo workflow mới
const STATUS_CFG = {
    draft: { label: "Bản nháp", cls: "badge badge-default" },
    planning: { label: "Lên kế hoạch", cls: "badge badge-warning" },
    approved: { label: "Đã duyệt", cls: "badge badge-admin" },
    running: { label: "Đang diễn ra", cls: "badge badge-success" },
    completed: { label: "Hoàn thành", cls: "badge badge-organizer" },
    cancelled: { label: "Đã hủy", cls: "badge badge-danger" },
};

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [staffCount, setStaffCount] = useState(0);
    const [guestsCount, setGuestsCount] = useState(0);
    const [budgetTotal, setBudgetTotal] = useState(0);
    const [checkedIn, setCheckedIn] = useState(0);
    const [myRegs, setMyRegs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [evRes, reportRes, myRes] = await Promise.all([
                    getEvents().catch(() => ({ data: [] })),
                    user.role !== 'user' ? import("../../services/api").then(m => m.default.get("/reports/overview")).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
                    user.role === 'user' ? getMyRegistrations().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
                ]);
                const evList = evRes.data || [];
                const overview = reportRes.data || {};
                setEvents(evList);
                setMyRegs(myRes.data || []);
                
                if (user.role !== 'user') {
                    setStaffCount(evList.reduce((n, e) => n + (e.staff_count || 0), 0));
                    setGuestsCount(overview.attendees?.total || 0);
                    setCheckedIn(overview.attendees?.checkedIn || 0);
                    setBudgetTotal(overview.budget?.actual || 0);
                }
            } catch {/**/ }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [user.id, user.role]);

    const role = user?.role || "user";
    const formatVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    // FIX: dùng start_date thay vì date
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const STAT_CARDS = role === 'user' ? [
        { icon: "🎪", label: "Tổng sự kiện", value: events.length, color: "indigo", path: "/events" },
        { icon: "🙋", label: "Sự kiện của tôi", value: myRegs.length, color: "cyan", path: "/my-portal" },
        { icon: "📅", label: "Xem lịch", value: "📅", color: "emerald", path: "/calendar" },
        { icon: "✅", label: "Đã tham gia", value: myRegs.filter(r => r.checked_in).length, color: "rose", path: "/my-portal" },
    ] : [
        { icon: "🎪", label: "Tổng sự kiện", value: events.length, color: "indigo", path: "/events" },
        { icon: "👥", label: "Nhân sự", value: staffCount, color: "cyan", path: "/staff" },
        { icon: "🎟️", label: "Khách mời", value: guestsCount, color: "emerald", path: "/guests" },
        { icon: "✅", label: "Đã check-in", value: checkedIn, color: "rose", path: "/checkin" },
    ];

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                        {role === "admin" && `Xin chào ${user?.name || "Admin"}! Đây là tổng quan toàn hệ thống.`}
                        {role === "organizer" && `Xin chào ${user?.name || "Tổ chức"}! Quản lý sự kiện và nhóm của bạn tại đây.`}
                        {role === "user" && `Chào mừng quay trở lại, ${user?.name || "Nhân viên"}!`}
                    </p>
                </div>
                {(role === "admin" || role === "organizer") ? (
                    <button className="btn btn-primary" onClick={() => navigate("/events")}>
                        🎪 Xem sự kiện
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={() => navigate("/calendar")}>
                        📅 Xem lịch trình
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid-4" style={{ marginBottom: "28px" }}>
                {STAT_CARDS.map((card) => (
                    <div key={card.label} className="card-stat" style={{ cursor: "pointer" }}
                        onClick={() => navigate(card.path)}>
                        <div className={`card-stat-icon ${card.color}`}>{card.icon}</div>
                        <div className="card-stat-info">
                            <h3>{loading ? "…" : card.value}</h3>
                            <p>{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget summary */}
            {(role === "admin" || role === "organizer") && !loading && (
                <div className="card" style={{ marginBottom: "24px", cursor: "pointer" }}
                    onClick={() => navigate("/budget")}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <p style={{
                                fontSize: "12px", color: "var(--text-muted)", fontWeight: 600,
                                textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
                                Tổng Ngân Sách (Tất Cả Sự Kiện)
                            </p>
                            <h3 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-primary)", marginTop: "4px" }}>
                                {formatVND(budgetTotal)}
                            </h3>
                        </div>
                        <div className="card-stat-icon amber" style={{ width: 52, height: 52, fontSize: 22, borderRadius: 14 }}>💰</div>
                    </div>
                </div>
            )}

            {/* Recent events / My events */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700" }}>
                        {role === "user" ? "📍 Sự kiện của tôi sắp tới" : "🎪 Sự kiện gần đây"}
                    </h3>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(role === 'user' ? "/my-portal" : "/events")}>
                        {role === 'user' ? "Chi tiết vé QR →" : "Xem tất cả →"}
                    </button>
                </div>
                <div className="data-table-wrapper" style={{ boxShadow: "none", border: "none" }}>
                    {loading ? (
                        <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                    ) : (role === 'user' ? myRegs.length === 0 : events.length === 0) ? (
                        <div className="empty-state">
                            <span>🎪</span>
                            <p>{role === 'user' ? "Bạn chưa đăng ký sự kiện nào. Hãy khám phá ngay!" : "Chưa có sự kiện nào"}</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên sự kiện</th>
                                    <th>Thời gian bắt đầu {role === 'user' && " & QR"}</th>
                                    <th>Địa điểm</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(role === 'user' ? myRegs : events).slice(0, 5).map((e) => {
                                    const ev = role === 'user' ? e : e;
                                    const name = role === 'user' ? e.event_name : e.name;
                                    const status = role === 'user' ? (e.checked_in ? 'completed' : e.event_status) : e.status;
                                    const s = STATUS_CFG[status] || STATUS_CFG.draft;
                                    
                                    return (
                                        <tr key={e.id}>
                                            <td style={{ fontWeight: 600 }}>🎪 {name}</td>
                                            <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                                📅 {fmtDate(e.start_date || e.created_at)}
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>
                                                {e.location || (e.venue_type === "online" ? "🌐 Online" : "—")}
                                            </td>
                                            <td><span className={s.cls}>{s.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}
