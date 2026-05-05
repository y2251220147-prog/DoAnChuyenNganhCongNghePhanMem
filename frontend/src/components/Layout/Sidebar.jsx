import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getUnreadCount } from "../../services/notificationService";
import "../../styles/layout.css";

const NAV = {
    admin: [
        {
            label: "Tổng quan", items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/reports",   icon: "📈", text: "Báo cáo & Thống kê" },
            ]
        },
        {
            label: "Sự kiện", items: [
                { to: "/events",   icon: "🎪", text: "Quản lý sự kiện" },
                { to: "/timeline", icon: "📅", text: "Tiến độ công việc" },
                { to: "/budget",   icon: "💰", text: "Ngân sách" },
                { to: "/venues",   icon: "📍", text: "Địa điểm" },
            ]
        },
        {
            // Nhân sự tổ chức = vai trò trong từng sự kiện (event_staff)
            // Phòng ban       = cơ cấu tổ chức công ty  (departments)
            // → 2 khái niệm khác nhau, cần cả 2
            label: "Nhân sự & Tham dự", items: [
                { to: "/staff",       icon: "🎭", text: "Nhân sự sự kiện" },
                { to: "/departments", icon: "🏢", text: "Phòng ban" },
                { to: "/guests",      icon: "🎟️", text: "DS người tham gia sự kiện" },
                { to: "/checkin",     icon: "✅", text: "Check-in" },
                { to: "/feedback",    icon: "💬", text: "Phản hồi" },
            ]
        },
        {
            label: "Hệ thống", items: [
                { to: "/admin/users",    icon: "🔧", text: "Tài khoản", badge: "Admin" },
                { to: "/notifications",  icon: "🔔", text: "Thông báo" },
                { to: "/profile",        icon: "👤", text: "Hồ sơ cá nhân" },
                { to: "/reset-password", icon: "🔒", text: "Đổi mật khẩu" },
            ]
        },
    ],

    organizer: [
        {
            label: "Tổng quan", items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/reports",   icon: "📈", text: "Báo cáo" },
            ]
        },
        {
            label: "Sự kiện", items: [
                { to: "/events",   icon: "🎪", text: "Quản lý sự kiện" },
                { to: "/timeline", icon: "📅", text: "Tiến độ công việc" },
                { to: "/budget",   icon: "💰", text: "Ngân sách" },
                { to: "/venues",   icon: "📍", text: "Địa điểm" },
            ]
        },
        {
            label: "Nhân sự & Tham dự", items: [
                { to: "/staff",       icon: "🎭", text: "Nhân sự sự kiện" },
                { to: "/departments", icon: "🏢", text: "Phòng ban" },
                { to: "/guests",      icon: "🎟️", text: "DS người tham gia sự kiện" },
                { to: "/checkin",     icon: "✅", text: "Check-in" },
                { to: "/feedback",    icon: "💬", text: "Phản hồi" },
            ]
        },
        {
            label: "Cá nhân", items: [
                { to: "/my-portal",      icon: "🙋", text: "Sự kiện của tôi" },
                { to: "/notifications",  icon: "🔔", text: "Thông báo" },
                { to: "/profile",        icon: "👤", text: "Hồ sơ cá nhân" },
                { to: "/reset-password", icon: "🔒", text: "Đổi mật khẩu" },
            ]
        },
    ],

    user: [
        {
            label: "Trang chủ", items: [
                { to: "/dashboard", icon: "🏠", text: "Trang chủ" },
                { to: "/calendar",  icon: "📅", text: "Lịch sự kiện" },
            ]
        },
        {
            label: "Sự kiện", items: [
                { to: "/events",    icon: "🎪", text: "Khám phá sự kiện" },
                { to: "/my-portal", icon: "🙋", text: "Sự kiện của tôi" },
            ]
        },
        {
            label: "Cá nhân", items: [
                { to: "/notifications",  icon: "🔔", text: "Thông báo" },
                { to: "/feedback",       icon: "💬", text: "Gửi phản hồi" },
                { to: "/profile",        icon: "👤", text: "Hồ sơ cá nhân" },
                { to: "/reset-password", icon: "🔒", text: "Đổi mật khẩu" },
            ]
        },
    ],
};

export default function Sidebar() {
    const { user, logoutUser, getAvatarUrl } = useContext(AuthContext);
    const navigate = useNavigate();
    const role = user?.role || "user";
    const sections = NAV[role] || NAV.user;
    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    const [unread, setUnread] = useState(0);
    useEffect(() => {
        const fetch = async () => {
            try { const r = await getUnreadCount(); setUnread(r.data?.count ?? 0); } catch { /**/ }
        };
        fetch();
        const iv = setInterval(fetch, 60000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <h2><span className="logo-icon">🎯</span>EventPro</h2>
                <p>Management System</p>
            </div>
            <nav className="sidebar-nav">
                {sections.map(s => (
                    <div key={s.label} className="sidebar-nav-section">
                        <div className="sidebar-nav-label">{s.label}</div>
                        {s.items.map(item => (
                            <NavLink key={item.to} to={item.to}
                                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
                                <span className="nav-icon">{item.icon}</span>
                                {item.text}
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                                {item.to === "/notifications" && unread > 0 && (
                                    <span style={{
                                        marginLeft: "auto", background: "var(--color-danger, #ef4444)",
                                        color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700,
                                        minWidth: 18, height: 18, padding: "0 5px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        lineHeight: 1, flexShrink: 0,
                                    }}>
                                        {unread > 99 ? "99+" : unread}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt="Avatar" 
                                 style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : initials}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="user-name">{user?.name || "User"}</div>
                        <div className="user-role">{role}</div>
                    </div>
                    <button className="sidebar-logout-btn"
                        onClick={() => { logoutUser(); navigate("/"); }} title="Logout">Logout</button>
                </div>
            </div>
        </div>
    );
}
