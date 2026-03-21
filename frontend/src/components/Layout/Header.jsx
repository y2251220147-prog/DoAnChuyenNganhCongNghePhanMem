import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const PAGE_TITLES = {
    "/dashboard": { title: "Dashboard", sub: "Overview & Statistics" },
    "/events": { title: "Events", sub: "Manage all events" },
    "/staff": { title: "Staff", sub: "Team members" },
    "/guests": { title: "Guests", sub: "Guest list" },
    "/timeline": { title: "Timeline", sub: "Event schedule" },
    "/budget": { title: "Budget", sub: "Financial overview" },
    "/checkin": { title: "Check-in", sub: "Attendance scanner" },
    "/admin/users": { title: "User Management", sub: "Admin only" },
    "/reset-password": { title: "Reset Password", sub: "Account security" },
};

const ROLE_LABEL = {
    admin: "Admin",
    organizer: "Organizer",
    user: "User",
};

export default function Header() {

    const { user } = useContext(AuthContext);
    const location = useLocation();
    const page = PAGE_TITLES[location.pathname] || { title: "EventPro", sub: "" };
    const role = user?.role || "user";

    return (
        <header className="header">
            <div className="header-left">
                <div className="page-title">{page.title}</div>
                <div className="breadcrumb">{page.sub}</div>
            </div>
            <div className="header-right">
                <span className={`header-badge ${role}`}>
                    {role === "admin" && "🔧"}
                    {role === "organizer" && "🎪"}
                    {role === "user" && "👤"}
                    &nbsp;
                    {ROLE_LABEL[role] || role}
                </span>
                <span className="header-user-name">{user?.name || "User"}</span>
            </div>
        </header>
    );
}
