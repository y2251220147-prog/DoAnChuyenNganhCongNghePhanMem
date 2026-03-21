import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/layout.css";

const NAV_ITEMS = {
    admin: [
        {
            label: "Main",
            items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
            ],
        },
        {
            label: "Management",
            items: [
                { to: "/staff", icon: "👥", text: "Staff" },
                { to: "/guests", icon: "🎟️", text: "Guests" },
                { to: "/timeline", icon: "📅", text: "Timeline" },
                { to: "/budget", icon: "💰", text: "Budget" },
                { to: "/checkin", icon: "✅", text: "Check-in" },
            ],
        },
        {
            label: "Admin",
            items: [
                { to: "/admin/users", icon: "🔧", text: "Users", badge: "Admin" },
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ],
        },
    ],
    organizer: [
        {
            label: "Main",
            items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
            ],
        },
        {
            label: "Management",
            items: [
                { to: "/staff", icon: "👥", text: "Staff" },
                { to: "/guests", icon: "🎟️", text: "Guests" },
                { to: "/timeline", icon: "📅", text: "Timeline" },
                { to: "/budget", icon: "💰", text: "Budget" },
                { to: "/checkin", icon: "✅", text: "Check-in" },
            ],
        },
        {
            label: "Account",
            items: [
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ],
        },
    ],
    user: [
        {
            label: "Main",
            items: [
                { to: "/dashboard", icon: "📊", text: "Dashboard" },
                { to: "/events", icon: "🎪", text: "Events" },
            ],
        },
        {
            label: "Account",
            items: [
                { to: "/reset-password", icon: "🔒", text: "Reset Password" },
            ],
        },
    ],
};

export default function Sidebar() {

    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const role = user?.role || "user";
    const sections = NAV_ITEMS[role] || NAV_ITEMS.user;
    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    const handleLogout = () => {
        logoutUser();
        navigate("/");
    };

    return (
        <div className="sidebar">

            {/* Logo */}
            <div className="sidebar-logo">
                <h2>
                    <span className="logo-icon">🎯</span>
                    EventPro
                </h2>
                <p>Management System</p>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {sections.map((section) => (
                    <div key={section.label} className="sidebar-nav-section">
                        <div className="sidebar-nav-label">{section.label}</div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    "sidebar-link" + (isActive ? " active" : "")
                                }
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.text}
                                {item.badge && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="user-name">{user?.name || "User"}</div>
                        <div className="user-role">{role}</div>
                    </div>
                    <button
                        className="sidebar-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            </div>

        </div>
    );
}
