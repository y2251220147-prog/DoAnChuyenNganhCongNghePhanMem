import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getStaff } from "../../services/staffService";
import { getGuests } from "../../services/guestService";
import { getBudget } from "../../services/budgetService";
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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [evRes, stRes, guRes, buRes] = await Promise.all([
                    getEvents().catch(() => ({ data: [] })),
                    getStaff().catch(() => ({ data: [] })),
                    getGuests().catch(() => ({ data: [] })),
                    getBudget().catch(() => ({ data: [] })),
                ]);
                const evList = evRes.data || [];
                const guList = guRes.data || [];
                const buList = buRes.data || [];
                setEvents(evList);
                setStaffCount((stRes.data || []).length);
                setGuestsCount(guList.length);
                setCheckedIn(guList.filter(g => g.checked_in).length);
                setBudgetTotal(buList.reduce((s, b) => s + Number(b.cost || 0), 0));
            } catch {/**/ }
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    const role = user?.role || "user";
    const formatVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    // FIX: dùng start_date thay vì date
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const STAT_CARDS = [
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
                        {role === "admin" && "Xin chào Admin! Đây là tổng quan toàn hệ thống."}
                        {role === "organizer" && "Xin chào! Quản lý sự kiện và nhóm của bạn tại đây."}
                        {role === "user" && "Xin chào! Xem các sự kiện có sẵn bên dưới."}
                    </p>
                </div>
                {(role === "admin" || role === "organizer") && (
                    <button className="btn btn-primary" onClick={() => navigate("/events")}>
                        🎪 Xem sự kiện
                    </button>
                )}
            </div>

            {/* Stat cards */}
            {(role === "admin" || role === "organizer") && (
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
            )}

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

            {/* Recent events */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700" }}>
                        {role === "user" ? "Sự kiện có sẵn" : "Sự kiện gần đây"}
                    </h3>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate("/events")}>
                        Xem tất cả →
                    </button>
                </div>
                <div className="data-table-wrapper" style={{ boxShadow: "none", border: "none" }}>
                    {loading ? (
                        <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                    ) : events.length === 0 ? (
                        <div className="empty-state"><span>🎪</span><p>Chưa có sự kiện nào</p></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên sự kiện</th>
                                    <th>Thời gian bắt đầu</th>
                                    <th>Địa điểm</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.slice(0, 5).map((event) => {
                                    const s = STATUS_CFG[event.status] || STATUS_CFG.draft;
                                    return (
                                        <tr key={event.id}>
                                            <td style={{ fontWeight: 600 }}>🎪 {event.name}</td>
                                            <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                                {/* FIX: dùng start_date thay vì date */}
                                                📅 {fmtDate(event.start_date)}
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>
                                                {event.venue_type === "online"
                                                    ? "🌐 Online"
                                                    : `📍 ${event.location || "—"}`}
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
