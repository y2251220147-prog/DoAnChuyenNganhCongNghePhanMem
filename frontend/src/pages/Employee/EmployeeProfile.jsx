import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getMyRegistrations } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import UploadAvatar from "../../components/UploadAvatar";
import "../../styles/global.css";

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

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Hồ sơ & Cài đặt</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Quản lý thông tin cá nhân và thiết lập tài khoản</p>
                </div>
            </div>

            <div className="card" style={{ padding: 40, borderRadius: 32, marginBottom: 32, background: "linear-gradient(to right, #f8fafc, #fff)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                        <UploadAvatar />
                    </div>
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <h3 style={{ fontSize: 24, fontWeight: 800 }}>{user?.name || "Nhân viên"}</h3>
                            <span className="badge badge-success" style={{ fontSize: 10 }}>Đang hoạt động</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 16 }}>
                            {user?.department ? <strong>{user.department}</strong> : null} {user?.department ? " • " : ""}{user?.email}
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn btn-outline" style={{ borderRadius: 12, fontSize: 13, fontWeight: 700 }} onClick={() => navigate("/reset-password")}>
                                🔒 Đổi mật khẩu
                            </button>
                            <button className="btn btn-outline" style={{ borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#ef4444", borderColor: "#fecaca" }} onClick={() => { logoutUser(); navigate("/"); }}>
                                ↩ Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ gap: 32 }}>
                {/* Stats Card */}
                <div className="card" style={{ padding: 32, borderRadius: 28 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "var(--text-primary)" }}>Thống kê tham dự</h4>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                            <div style={{ fontSize: 24 }}>⏳</div>
                            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Đang tính toán...</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {[
                                { val: total, lbl: "Đã đăng ký", color: "var(--color-primary)", bg: "var(--bg-main)" },
                                { val: attended, lbl: "Đã tham dự", color: "#10b981", bg: "#ecfdf5" },
                                { val: upcoming, lbl: "Sắp diễn ra", color: "#64748b", bg: "#f8fafc" },
                                { val: `${attendRate}%`, lbl: "Tỉ lệ chuyên cần", color: "#f59e0b", bg: "#fff7ed" },
                            ].map(s => (
                                <div key={s.lbl} style={{ background: s.bg, borderRadius: 20, padding: 24, textAlign: "center" }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.lbl}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications Card */}
                <div className="card" style={{ padding: 32, borderRadius: 28 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "var(--text-primary)" }}>Tuỳ chỉnh thông báo</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {[
                            { label: "Nhắc nhở sự kiện trước 24h", desc: "Nhận thông báo đẩy và email nhắc nhở", check: true },
                            { label: "Thông báo sự kiện mới", desc: "Luôn cập nhật các sự kiện sắp tổ chức", check: true },
                            { label: "Xác nhận đăng ký thành công", desc: "Gửi email xác nhận kèm mã vé QR", check: true },
                            { label: "Báo cáo tiến độ nhiệm vụ", desc: "Thông báo khi quản lý cập nhật công việc", check: false },
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</div>
                                </div>
                                <div style={{ position: "relative", width: 44, height: 24 }}>
                                    <input type="checkbox" defaultChecked={item.check} style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer", position: "absolute", zIndex: 2 }} />
                                    <div style={{ 
                                        width: "100%", height: "100%", background: item.check ? "var(--color-primary)" : "#e2e8f0", 
                                        borderRadius: 20, transition: "all 0.2s", position: "relative" 
                                    }}>
                                        <div style={{ 
                                            position: "absolute", width: 18, height: 18, background: "#fff", borderRadius: "50%", 
                                            top: 3, left: item.check ? 23 : 3, transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
