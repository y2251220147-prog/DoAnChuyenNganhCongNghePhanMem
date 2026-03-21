import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Sidebar() {

    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate("/");
    };

    const isActive = (path) => location.pathname === path ? "active" : "";

    const adminLinks = [
        { to: "/dashboard", icon: "📊", label: "Dashboard" },
        { to: "/admin/users", icon: "👥", label: "Quản lý Users" },
        { to: "/events", icon: "🎉", label: "Events" },
        { to: "/staff", icon: "👔", label: "Staff" },
        { to: "/guests", icon: "🎫", label: "Guests" },
        { to: "/timeline", icon: "📅", label: "Timeline" },
        { to: "/budget", icon: "💰", label: "Budget" },
        { to: "/checkin", icon: "✅", label: "Checkin" },
    ];

    const organizerLinks = [
        { to: "/dashboard", icon: "📊", label: "Dashboard" },
        { to: "/events", icon: "🎉", label: "Events" },
        { to: "/staff", icon: "👔", label: "Staff" },
        { to: "/guests", icon: "🎫", label: "Guests" },
        { to: "/timeline", icon: "📅", label: "Timeline" },
        { to: "/budget", icon: "💰", label: "Budget" },
        { to: "/checkin", icon: "✅", label: "Checkin" },
        { to: "/organizer/users", icon: "👥", label: "Xem Users" },
    ];

    const userLinks = [
        { to: "/dashboard", icon: "📊", label: "Dashboard" },
        { to: "/profile", icon: "👤", label: "Hồ sơ cá nhân" },
        { to: "/events", icon: "🎉", label: "Events" },
    ];

    const getLinks = () => {
        if (!user) return [];
        switch (user.role) {
            case "admin": return adminLinks;
            case "organizer": return organizerLinks;
            default: return userLinks;
        }
    };

    const getRoleBadge = () => {
        if (!user) return "";
        switch (user.role) {
            case "admin": return "badge-admin";
            case "organizer": return "badge-organizer";
            default: return "badge-user";
        }
    };

    return (

        <div className="sidebar">

            <div className="sidebar-brand">
                <h2><span>Event Manager</span></h2>
            </div>

            {user && (
                <div className="sidebar-user-info">
                    <div className="user-name">ID: {user.id}</div>
                    <span className={`user-role-badge ${getRoleBadge()}`}>
                        {user.role}
                    </span>
                </div>
            )}

            <nav>
                {getLinks().map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={isActive(link.to)}
                    >
                        <span className="nav-icon">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <span className="nav-icon">🚪</span>
                    <span>Đăng xuất</span>
                </button>
            </div>

        </div>

    );

}