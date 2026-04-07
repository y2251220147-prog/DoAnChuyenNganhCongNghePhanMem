import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/employee-theme.css";

const NAV_ITEMS = [
    {
        to: "/dashboard",
        label: "Trang chủ",
        icon: (
            <svg viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" />
            </svg>
        )
    },
    {
        to: "/events",
        label: "Sự kiện",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                <path d="M5 1v4M11 1v4M2 7h12" />
            </svg>
        )
    },
    {
        to: "/my-events",
        label: "Của tôi",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="5" r="3" />
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
        )
    },
    {
        to: "/calendar",
        label: "Lịch",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                <path d="M5 1v4M11 1v4M2 7h12M5 10h.5M8 10h.5M11 10h.5" />
            </svg>
        )
    },
];

const BOTTOM_NAV = [
    {
        to: "/notifications",
        label: "Thông báo",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5z" />
                <path d="M6.5 13.5a1.5 1.5 0 003 0" />
            </svg>
        ),
        showBadge: true
    },
    {
        to: "/feedback",
        label: "Phản hồi",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z" />
                <path d="M5 6h6M5 9h4" />
            </svg>
        )
    },
    {
        to: "/profile",
        label: "Hồ sơ",
        icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="6" r="2.5" />
                <path d="M14 14c0-3.3-2.7-6-6-6S2 10.7 2 14" />
            </svg>
        )
    },
];

export default function EmployeeLayout({ children, title, subtitle, unreadCount = 0 }) {
    const { user, getAvatarUrl } = useContext(AuthContext);
    const navigate = useNavigate();

    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
        : "NV";

    const today = new Date().toLocaleDateString("vi-VN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    return (
        <div className="emp-layout">
            {/* ── SIDEBAR ── */}
            <aside className="emp-sidebar">
                {/* Logo */}
                <div className="emp-sb-logo">⬡</div>

                {/* Top nav */}
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `emp-nav-icon${isActive ? " active" : ""}`}
                        title={item.label}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="emp-sb-spacer" />

                {/* Bottom nav */}
                {BOTTOM_NAV.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `emp-nav-icon${isActive ? " active" : ""}`}
                        title={item.label}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.showBadge && unreadCount > 0 && (
                            <div className="emp-nav-badge">
                                <span>{unreadCount > 9 ? "9+" : unreadCount}</span>
                            </div>
                        )}
                    </NavLink>
                ))}

                {/* Avatar */}
                <button
                    className="emp-sb-avatar"
                    onClick={() => navigate("/profile")}
                    title={user?.name}
                    style={{ 
                        padding: 0, overflow: "hidden", display: "flex", 
                        alignItems: "center", justifyContent: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)"
                    }}
                >
                    {user?.avatar ? (
                        <img src={getAvatarUrl(user.avatar)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : initials}
                </button>
            </aside>

            {/* ── CONTENT ── */}
            <div className="emp-content">
                {/* Topbar */}
                <div className="emp-topbar">
                    <div className="emp-tb-title">
                        <h2>{title || `Xin chào, ${user?.name || "Nhân viên"} 👋`}</h2>
                        <p>{subtitle || today}</p>
                    </div>

                    {/* Search */}
                    <div className="emp-tb-search">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <circle cx="7" cy="7" r="5" />
                            <path d="M11 11l3 3" />
                        </svg>
                        <input type="text" placeholder="Tìm kiếm sự kiện..."
                            onKeyDown={e => { if (e.key === "Enter") navigate(`/events?q=${e.target.value}`); }} />
                    </div>

                    {/* Notification icon */}
                    <NavLink to="/notifications" className="emp-icon-btn" title="Thông báo">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5z" />
                            <path d="M6.5 13.5a1.5 1.5 0 003 0" />
                        </svg>
                        {unreadCount > 0 && <div className="emp-notif-dot" />}
                    </NavLink>
                </div>

                {/* Page area */}
                <div className="emp-page-area">
                    {children}
                </div>
            </div>
        </div>
    );
}
