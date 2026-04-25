import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { AuthContext } from "../../context/AuthContext";
import { getMyRegistrations } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import UploadAvatar from "../../components/UploadAvatar";
import "../../styles/employee-theme.css";

export default function EmployeeProfile() {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [myRegs, setMyRegs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [regRes, notifRes] = await Promise.all([
                    getMyRegistrations().catch(() => ({ data: [] })),
                    getNotifications().catch(() => ({ data: [] })),
                ]);
                setMyRegs(regRes.data || []);
                setUnread((notifRes.data || []).filter(n => !n.read_at).length);
            } catch { /**/ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const attended = myRegs.filter(r => r.checked_in).length;
    const total = myRegs.length;
    const attendRate = total > 0 ? Math.round(attended / total * 100) : 0;
    const upcoming = myRegs.filter(r => r.start_date && new Date(r.start_date) > new Date() && !r.checked_in).length;

    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
        : "NV";

    return (
        <EmployeeLayout title="Hồ sơ &amp; Cài đặt" unreadCount={unread}>
            {/* Profile header */}
            <div className="emp-profile-header">
                <UploadAvatar />
                <div style={{ flex:1 }}>
                    <div style={{ fontSize:19, fontWeight:600 }}>{user?.name || "Nhân viên"}</div>
                    <div style={{ fontSize:13, color:"var(--emp-text2)", marginTop:3 }}>
                        {user?.department ? `${user.department} · ` : ""}{user?.email}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                        <span className="emp-badge emp-badge-gray">
                            {user?.role === "organizer" ? "Organizer" : "Employee"}
                        </span>
                        <span className="emp-badge emp-badge-green">Đang hoạt động</span>
                    </div>
                </div>
                <button className="emp-btn emp-btn-outline emp-btn-sm"
                    onClick={() => navigate("/reset-password")}>
                    🔒 Đổi mật khẩu
                </button>
            </div>

            {/* Stats + Settings grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                {/* Attendance stats */}
                <div className="emp-panel">
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Thống kê tham dự</div>
                    {loading ? (
                        <div className="emp-empty" style={{ padding:"20px 0" }}><p>Đang tải...</p></div>
                    ) : (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                            {[
                                { val: total, lbl: "Đã đăng ký", color: "var(--emp-accent)" },
                                { val: attended, lbl: "Đã tham dự", color: "var(--emp-green)" },
                                { val: upcoming, lbl: "Sắp diễn ra", color: "var(--emp-text)" },
                                { val: `${attendRate}%`, lbl: "Tỉ lệ có mặt", color: "var(--emp-amber)" },
                            ].map(s => (
                                <div key={s.lbl} style={{ background:"var(--emp-bg2)", borderRadius:"var(--emp-radius-sm)", padding:14, textAlign:"center" }}>
                                    <div style={{ fontSize:24, fontWeight:300, fontFamily:"var(--emp-mono)", color:s.color }}>{s.val}</div>
                                    <div style={{ fontSize:10, color:"var(--emp-text3)", marginTop:3, textTransform:"uppercase", fontWeight:500, letterSpacing:"0.05em" }}>{s.lbl}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notification settings */}
                <div className="emp-panel">
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Tuỳ chỉnh thông báo</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                        {[
                            { label:"Nhắc sự kiện trước 1 ngày", defaultCheck:true },
                            { label:"Thông báo sự kiện mới",     defaultCheck:true },
                            { label:"Email xác nhận đăng ký",    defaultCheck:true },
                            { label:"Thông báo thay đổi lịch",   defaultCheck:false },
                        ].map(item => (
                            <div key={item.label} className="emp-toggle-row">
                                <span style={{ fontSize:13, color:"var(--emp-text2)" }}>{item.label}</span>
                                <label className="emp-toggle">
                                    <input type="checkbox" defaultChecked={item.defaultCheck} />
                                    <span className="emp-toggle-slider" />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Danger zone */}
            <div className="emp-panel">
                <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Tài khoản</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <button className="emp-btn emp-btn-outline emp-btn-sm" onClick={() => navigate("/reset-password")}>
                        🔒 Đổi mật khẩu
                    </button>
                    <button className="emp-btn emp-btn-cancel emp-btn-sm" onClick={() => { logoutUser(); navigate("/"); }}>
                        ↩ Đăng xuất
                    </button>
                </div>
            </div>
        </EmployeeLayout>
    );
}
