import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getUnreadCount } from "../../services/notificationService";

const PAGE_TITLES = {
    "/dashboard":    { title: "Dashboard",                  sub: "Tổng quan hệ thống" },
    "/events":       { title: "Sự kiện",                    sub: "Quản lý tất cả sự kiện" },
    "/staff":        { title: "Nhân sự tổ chức",            sub: "Thành viên ban tổ chức" },
    "/guests":       { title: "Khách mời",                  sub: "Danh sách khách & mã QR" },
    "/timeline":     { title: "Tiến độ công việc",          sub: "Lịch trình & nhiệm vụ" },
    "/budget":       { title: "Ngân sách",                  sub: "Quản lý tài chính" },
    "/checkin":      { title: "Check-in",                   sub: "Quét mã điểm danh" },
    "/feedback":     { title: "Phản hồi",                   sub: "Đánh giá & góp ý" },
    "/reports":      { title: "Báo cáo",                    sub: "Thống kê & biểu đồ" },
    "/venues":       { title: "Địa điểm & Tài nguyên",      sub: "Quản lý phòng họp, thiết bị" },
    "/admin/users":  { title: "Quản lý tài khoản",          sub: "Chỉ dành cho Admin" },
    "/notifications":{ title: "Thông báo",                  sub: "Trung tâm thông báo" },
    "/reset-password":{ title: "Đổi mật khẩu",             sub: "Bảo mật tài khoản" },
};

const ROLE_ICON  = { admin: "🔧", organizer: "🎪", user: "👤" };
const ROLE_LABEL = { admin: "Admin", organizer: "Organizer", user: "User" };

export default function Header() {
    const { user, getAvatarUrl } = useContext(AuthContext);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const page = PAGE_TITLES[pathname] || { title: "EventPro", sub: "" };
    const role = user?.role || "user";

    const [unread, setUnread] = useState(0);
    const [bellAnim, setBellAnim] = useState(false);
    const [searchQ, setSearchQ] = useState("");

    const handleGlobalSearch = (e) => {
        if (e.key === "Enter" && searchQ.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
            setSearchQ("");
        }
    };

    // Lấy số thông báo chưa đọc khi load và poll mỗi 60s
    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const r = await getUnreadCount();
                const cnt = r.data?.count ?? 0;
                if (mounted) {
                    if (cnt > unread) setBellAnim(true); // có thông báo mới → rung chuông
                    setUnread(cnt);
                }
            } catch { /**/ }
        };
        fetch();
        const interval = setInterval(fetch, 60000); // poll 60s
        return () => { mounted = false; clearInterval(interval); };
    }, [pathname, unread]); // re-fetch khi chuyển trang

    useEffect(() => {
        if (bellAnim) {
            const t = setTimeout(() => setBellAnim(false), 1000);
            return () => clearTimeout(t);
        }
    }, [bellAnim]);

    return (
        <header className="header">
            <div className="header-left">
                <div className="page-title">{page.title}</div>
                <div className="breadcrumb">{page.sub}</div>
            </div>

            <div className="header-search" style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 20px" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="🔍 Tìm nhanh sự kiện, địa điểm..." 
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        onKeyDown={handleGlobalSearch}
                        style={{
                            borderRadius: "20px",
                            paddingLeft: "15px",
                            background: "var(--bg-main)",
                            height: "38px"
                        }}
                    />
                </div>
            </div>

            <div className="header-right">
                {/* Notification Bell */}
                <button
                    id="header-notif-btn"
                    onClick={() => navigate("/notifications")}
                    title={unread > 0 ? `${unread} thông báo chưa đọc` : "Thông báo"}
                    style={{
                        position: "relative", background: "none", border: "none",
                        cursor: "pointer", padding: "6px 10px", borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-secondary)", fontSize: 20,
                        transition: "background 0.2s",
                        animation: bellAnim ? "bellShake 0.6s ease" : "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover, rgba(99,102,241,0.08))"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                    🔔
                    {unread > 0 && (
                        <span style={{
                            position: "absolute", top: 2, right: 2,
                            background: "var(--color-danger, #ef4444)",
                            color: "#fff", borderRadius: 999,
                            fontSize: 10, fontWeight: 700, lineHeight: 1,
                            minWidth: 16, height: 16, padding: "0 4px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 0 2px var(--bg-card, #1e1e2e)",
                        }}>
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </button>

                <span className={`header-badge ${role}`}>
                    {ROLE_ICON[role]}&nbsp;{ROLE_LABEL[role]}
                </span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginLeft: "10px" }} onClick={() => navigate("/profile")}>
                    <div style={{ 
                        width: 32, height: 32, borderRadius: "50%", overflow: "hidden", 
                        background: "var(--bg-card, #1e1e2e)", display: "flex", 
                        alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
                        border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                        flexShrink: 0
                    }}>
                        {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U"
                        )}
                    </div>
                    <span className="header-user-name" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {user?.name || "User"}
                    </span>
                </div>
            </div>

            {/* CSS animation cho bell shake */}
            <style>{`
                @keyframes bellShake {
                    0%,100% { transform: rotate(0deg); }
                    15%     { transform: rotate(-15deg); }
                    30%     { transform: rotate(12deg); }
                    45%     { transform: rotate(-10deg); }
                    60%     { transform: rotate(8deg); }
                    75%     { transform: rotate(-5deg); }
                }
            `}</style>
        </header>
    );
}
