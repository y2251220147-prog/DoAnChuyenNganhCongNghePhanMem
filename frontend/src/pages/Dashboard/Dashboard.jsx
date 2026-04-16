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
            <div className="page-header" style={{ marginBottom: 48, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
                        <span className="gradient-text">Hệ thống Quản trị Analytics</span>
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500, lineHeight: 1.6 }}>
                        {role === "admin" && <span>🔥 Chào buổi tốt, <strong>{user?.name || "Quản trị viên"}</strong>! Hệ thống đang hoạt động ổn định.</span>}
                        {role === "organizer" && <span>✨ Chào <strong>{user?.name}</strong>! Bạn đang phụ trách <strong>{events.length}</strong> sự kiện chiến lược.</span>}
                        {role === "user" && <span>👋 Rất vui được gặp lại bạn, <strong>{user?.name}</strong>! Chúc bạn một ngày làm việc hiệu quả.</span>}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    {(role === "admin" || role === "organizer") ? (
                        <>
                            <button className="btn btn-outline" style={{ borderRadius: 14, height: 52, padding: "0 24px", fontWeight: 700 }} onClick={() => navigate("/reports")}>
                                📊 Xem báo cáo chi tiết
                            </button>
                            <button className="btn btn-primary" style={{ borderRadius: 14, height: 52, padding: "0 28px", fontWeight: 800, boxShadow: "0 8px 16px -4px rgba(99,102,241,0.4)" }} onClick={() => navigate("/events")}>
                                ➕ Tạo sự kiện mới
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" style={{ borderRadius: 14, height: 52, padding: "0 28px", fontWeight: 800, boxShadow: "0 8px 16px -4px rgba(99,102,241,0.4)" }} onClick={() => navigate("/calendar")}>
                            📅 Lịch trình công việc
                        </button>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                {STAT_CARDS.map((card) => (
                    <div key={card.label} className="card-stat" 
                        style={{ 
                            cursor: "pointer", 
                            padding: "32px 24px", 
                            borderRadius: 24, 
                            background: "#fff", 
                            border: "1px solid #f1f5f9",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        onClick={() => navigate(card.path)}>
                        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.05, transform: "rotate(-15deg)" }}>{card.icon}</div>
                        <div className={`card-stat-icon ${card.color}`} style={{ width: 56, height: 56, fontSize: 24, borderRadius: 16, marginBottom: 20 }}>{card.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{loading ? "…" : card.value}</h3>
                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget summary */}
            {(role === "admin" || role === "organizer") && !loading && (
                <div className="card" 
                    style={{ 
                        marginBottom: 32, cursor: "pointer", padding: 32, borderRadius: 24, 
                        background: "linear-gradient(135deg, #fffbeb 0%, #fff 100%)", 
                        border: "1px solid #fef3c7",
                        boxShadow: "0 10px 30px -10px rgba(245,158,11,0.15)"
                    }}
                    onClick={() => navigate("/budget")}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <p style={{
                                fontSize: "11px", color: "#b45309", fontWeight: 800,
                                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8
                            }}>
                                💸 TỔNG CHI PHÍ THỰC TẾ (TẤT CẢ DỰ ÁN)
                            </p>
                            <h3 style={{ fontSize: "36px", fontWeight: 900, color: "#92400e", letterSpacing: "-0.02em" }}>
                                {formatVND(budgetTotal)}
                            </h3>
                        </div>
                        <div className="card-stat-icon amber" style={{ width: 72, height: 72, fontSize: 32, borderRadius: 20, boxShadow: "0 10px 20px -5px rgba(245,158,11,0.3)" }}>💰</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ border: "1px solid #f1f5f9", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)", borderRadius: 28, padding: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <div>
                        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#1e293b" }}>
                            {role === "user" ? "📍 Lộ trình Sự kiện của tôi" : "🎪 Tiêu điểm Sự kiện gần đây"}
                        </h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Cập nhật mới nhất từ hệ thống quản lý</p>
                    </div>
                    <button className="btn btn-outline" style={{ borderRadius: 12, padding: "10px 20px", fontWeight: 700 }} onClick={() => navigate(role === 'user' ? "/my-portal" : "/events")}>
                        {role === 'user' ? "Xem tất cả vé công việc →" : "Truy cập kho sự kiện →"}
                    </button>
                </div>
                <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 60 }}><span>⏳</span><p>Đang đồng bộ dữ liệu hệ thống...</p></div>
                    ) : (role === 'user' ? myRegs.length === 0 : events.length === 0) ? (
                        <div className="empty-state" style={{ padding: 80 }}>
                            <div style={{ fontSize: 64, marginBottom: 20 }}>🎪</div>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#64748b" }}>{role === 'user' ? "Chưa có sự kiện nào được ghi nhận cho bạn." : "Danh sách sự kiện hiện đang trống."}</p>
                            <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 8 }}>Bắt đầu bằng cách khám phá hoặc tạo sự kiện mới ngay hôm nay!</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 24 }}>Thông tin Sự kiện</th>
                                    <th>Thời gian Tổ chức</th>
                                    <th>Địa điểm / Hình thức</th>
                                    <th style={{ textAlign: "right", paddingRight: 24 }}>Trạng thái vận hành</th>
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
                                            <td style={{ padding: "20px 24px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎪</div>
                                                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{name}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--color-primary-dark)", fontWeight: 700, fontSize: 14 }}>
                                                📅 {fmtDate(e.start_date || e.created_at)}
                                            </td>
                                            <td style={{ color: "#64748b", fontWeight: 500 }}>
                                                {e.location || (e.venue_type === "online" ? "🌐 Trực tuyến (Online)" : "—")}
                                            </td>
                                            <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                <span className={s.cls} style={{ padding: "6px 14px", borderRadius: 10, fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                                            </td>
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
