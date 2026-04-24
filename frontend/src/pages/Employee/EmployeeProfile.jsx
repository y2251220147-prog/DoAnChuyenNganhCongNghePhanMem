import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { AuthContext } from "../../context/AuthContext";
import { getMyRegistrations } from "../../services/attendeeService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/employee-theme.css";

export default function EmployeeProfile() {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [myRegs, setMyRegs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);

    // Thêm state cho form cập nhật thông tin cá nhân
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "Nhân viên",
        email: user?.email || "email@company.com",
        department: user?.department || "Phòng ban",
        phone: user?.phone || "0123456789"
    });

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

    const initials = formData.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();

    const handleSaveProfile = (e) => {
        e.preventDefault();
        // Giả lập lưu thành công (cấu trúc không đổi, chỉ thêm UI)
        setIsEditing(false);
        alert("🎉 Cập nhật thông tin cá nhân thành công!");
    };

    return (
        <EmployeeLayout title="👤 Quản lý hồ sơ" unreadCount={unread}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", paddingBottom: "30px" }}>
                
                {/* Khối Header Profile Tích hợp Sửa Thông Tin */}
                <div style={{ background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(to right, #4f46e5, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "28px", fontWeight: "700", boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)" }}>
                            {initials}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            {!isEditing ? (
                                <div>
                                    <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#1e293b" }}>{formData.name}</h2>
                                    <div style={{ display: "flex", gap: "12px", color: "#64748b", fontSize: "14px", marginBottom: "12px" }}>
                                        <span>📧 {formData.email}</span>
                                        <span>🏢 {formData.department}</span>
                                        <span>📞 {formData.phone}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <span style={{ padding: "4px 12px", background: "#dcfce7", color: "#166534", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>Trạng thái: Hoạt động</span>
                                        <span style={{ padding: "4px 12px", background: "#e0e7ff", color: "#3730a3", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>Vai trò: {user?.role || "Employee"}</span>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Họ và tên</label>
                                            <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ padding: "8px", borderRadius: "8px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Số điện thoại</label>
                                            <input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: "8px", borderRadius: "8px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Email</label>
                                            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: "8px", borderRadius: "8px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Phòng ban</label>
                                            <input className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} style={{ padding: "8px", borderRadius: "8px" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                        <button type="submit" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "white", fontWeight: "600", cursor: "pointer" }}>💾 Lưu cập nhật</button>
                                        <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Hủy</button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #4f46e5", background: "white", color: "#4f46e5", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                                ✎ Cập nhật hồ sơ
                            </button>
                        )}
                    </div>
                </div>

                {/* Khối Thống kê & Cài đặt */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    
                    {/* Thống kê */}
                    <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#334155" }}>📊 Thành tích tham gia</h3>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Đang tải dữ liệu...</div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", borderLeft: "4px solid #3b82f6", textAlign: "center" }}>
                                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#3b82f6" }}>{total}</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TỔNG ĐĂNG KÝ</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", borderLeft: "4px solid #10b981", textAlign: "center" }}>
                                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>{attended}</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>ĐÃ CÓ MẶT</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", borderLeft: "4px solid #f59e0b", textAlign: "center" }}>
                                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>{upcoming}</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>SỰ KIỆN SẮP TỚI</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", borderLeft: "4px solid #8b5cf6", textAlign: "center" }}>
                                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#8b5cf6" }}>{attendRate}%</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TỶ LỆ THAM DỰ</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cài đặt & Bảo mật */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#334155" }}>🔔 Tùy chọn thông báo</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {[
                                    { label:"Nhắc nhở sự kiện (Trước 24h)", defaultCheck:true },
                                    { label:"Thông báo có sự kiện mới",     defaultCheck:true },
                                    { label:"Email biên lai đăng ký",    defaultCheck:true }
                                ].map(item => (
                                    <label key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", cursor: "pointer" }}>
                                        <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>{item.label}</span>
                                        <input type="checkbox" defaultChecked={item.defaultCheck} style={{ width: "18px", height: "18px", accentColor: "#4f46e5" }} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: "#fff1f2", padding: "20px", borderRadius: "16px", border: "1px solid #fecdd3" }}>
                            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#be123c" }}>🛡️ Bảo mật tài khoản</h3>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => navigate("/reset-password")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #fda4af", background: "white", color: "#e11d48", fontWeight: "600", cursor: "pointer" }}>
                                    🔑 Đổi mật khẩu
                                </button>
                                <button onClick={() => { logoutUser(); navigate("/"); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e11d48", color: "white", fontWeight: "600", cursor: "pointer" }}>
                                    🚪 Đăng xuất ngay
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </EmployeeLayout>
    );
}
