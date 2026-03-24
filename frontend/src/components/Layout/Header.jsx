import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const PAGE_TITLES = {
    "/dashboard": { title: "Dashboard", sub: "Overview & Statistics" },
    "/events": { title: "Events", sub: "Manage all events" },
    "/staff": { title: "Staff", sub: "Team members" },
    "/guests": { title: "Guests", sub: "Guest list & QR codes" },
    "/timeline": { title: "Timeline", sub: "Event schedule" },
    "/budget": { title: "Budget", sub: "Financial overview" },
    "/checkin": { title: "Check-in", sub: "Attendance scanner" },
    "/feedback": { title: "Feedback", sub: "Event ratings & reviews" },
    "/reports": { title: "Reports", sub: "Charts & statistics" },
    "/admin/users": { title: "User Management", sub: "Admin only" },
    "/reset-password": { title: "Đổi mật khẩu", sub: "Bảo mật tài khoản" },
    "/venues": { title: "Địa điểm & Tài nguyên", sub: "Quản lý phòng họp, thiết bị" },
    "/notifications": { title: "Thông báo", sub: "Trung tâm thông báo" },
};

const ROLE_ICON = { admin: "🔧", organizer: "🎪", user: "👤" };
const ROLE_LABEL = { admin: "Admin", organizer: "Organizer", user: "User" };

export default function Header() {
    const { user } = useContext(AuthContext);
    const { pathname } = useLocation();
    const page = PAGE_TITLES[pathname] || { title: "EventPro", sub: "" };
    const role = user?.role || "user";

    return (
        <header className="header">
            <div className="header-left">
                <div className="page-title">{page.title}</div>
                <div className="breadcrumb">{page.sub}</div>
            </div>
            <div className="header-right">
                <span className={`header-badge ${role}`}>
                    {ROLE_ICON[role]} &nbsp;{ROLE_LABEL[role]}
                </span>
                <span className="header-user-name">{user?.name || "User"}</span>
            </div>
        </header>
    );
}
