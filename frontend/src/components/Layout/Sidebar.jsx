import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/layout.css";

const NAV = {
    admin: [
        {
            label: "Main", items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
                { to: "/reports", icon: "📈", text: "Reports" },
            ]
        },
        {
            label: "Management", items: [
                { to: "/staff", icon: "👥", text: "Staff" },
                { to: "/guests", icon: "🎟️", text: "Guests" },
                { to: "/timeline", icon: "📅", text: "Timeline" },
                { to: "/budget", icon: "💰", text: "Budget" },
                { to: "/venues", icon: "🏢", text: "Địa điểm & Thiết bị" },
                { to: "/checkin", icon: "✅", text: "Check-in" },
                { to: "/feedback", icon: "💬", text: "Feedback" },
            ]
        },
        {
            label: "Admin", items: [
                { to: "/admin/users", icon: "🔧", text: "Users", badge: "Admin" },
                { to: "/notifications", icon: "🔔", text: "Thông báo" },
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ]
        },
    ],
    organizer: [
        {
            label: "Main", items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
                { to: "/reports", icon: "📈", text: "Reports" },
            ]
        },
        {
            label: "Management", items: [
                { to: "/staff", icon: "👥", text: "Staff" },
                { to: "/guests", icon: "🎟️", text: "Guests" },
                { to: "/timeline", icon: "📅", text: "Timeline" },
                { to: "/budget", icon: "💰", text: "Budget" },
                { to: "/venues", icon: "🏢", text: "Địa điểm & Thiết bị" },
                { to: "/checkin", icon: "✅", text: "Check-in" },
                { to: "/feedback", icon: "💬", text: "Feedback" },
            ]
        },
        {
            label: "Account", items: [
                { to: "/notifications", icon: "🔔", text: "Thông báo" },
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ]
        },
    ],
    user: [
        {
            label: "Main", items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
            ]
        },
        {
            label: "Account", items: [
                { to: "/feedback", icon: "💬", text: "Give Feedback" },
                { to: "/notifications", icon: "🔔", text: "Thông báo" },
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ]
        },
    ],
};

export default function Sidebar() {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const role = user?.role || "user";
    const sections = NAV[role] || NAV.user;
    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "U";

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
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
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
