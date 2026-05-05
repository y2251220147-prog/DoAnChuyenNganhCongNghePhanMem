import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../services/userService";
import UploadAvatar from "../../components/UploadAvatar";

export default function ProfilePage() {
    const { user, logoutUser, updateProfileData, getAvatarUrl } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        gender: "",
        address: ""
    });

    const [stats, setStats] = useState({
        total: 12,
        attended: 8,
        upcoming: 4
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile();
                const data = res.data;
                setFormData({
                    name: data.name || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    address: data.address || "",
                    department_name: data.department_name || "",
                    role_in_dept: data.role_in_dept || "",
                });
                if (data.stats) {
                    setStats({
                        total: data.stats.total || 0,
                        attended: data.stats.attended || 0,
                        upcoming: data.stats.upcoming || 0
                    });
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin hồ sơ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            await updateProfile(formData);
            updateProfileData(formData);
            setMessage({ type: "success", text: "✨ Cập nhật hồ sơ thành công!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Lỗi cập nhật hồ sơ." });
        } finally {
            setSaving(false);
        }
    };

    const attendRate = stats.total > 0 ? Math.round(stats.attended / stats.total * 100) : 0;
    const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

    if (loading) return (
        <Layout title="Hồ sơ cá nhân">
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="loader" style={{ marginBottom: 15, fontSize: 32 }}>⏳</div>
                <p style={{ fontWeight: 600 }}>Đang tải dữ liệu hồ sơ...</p>
            </div>
        </Layout>
    );

    return (
        <Layout title="Hồ sơ cá nhân">
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                
                {/* ── HEADER SECTION ── */}
                <div style={{ 
                    marginBottom: 32, padding: '48px', borderRadius: 32, 
                    background: "linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)",
                    color: "#fff", position: 'relative', overflow: 'hidden',
                    boxShadow: "0 20px 40px rgba(79, 70, 229, 0.15)"
                }}>
                    <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: '20%', width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 40, position: 'relative', zIndex: 1 }}>
                        <UploadAvatar />


                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                                <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0 }}>{user?.name || "Thành viên"}</h1>
                                <span style={{ background: "rgba(255,255,255,0.2)", padding: '6px 14px', borderRadius: 12, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: "0.05em", backdropFilter: "blur(8px)" }}>
                                    {user?.role}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, opacity: 0.9 }}>
                                <div style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>📧 {user?.email}</div>
                                <div style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>📍 {formData.address || "Chưa cập nhật địa chỉ"}</div>
                                {formData.department_name && <div style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>🏢 {formData.department_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ gap: 32, gridTemplateColumns: '1.6fr 1fr' }}>
                    
                    {/* LEFT: INFO FORM */}
                    <div className="card" style={{ padding: 40, borderRadius: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Thông tin cá nhân</h3>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Cập nhật thông tin định danh của bạn trên hệ thống</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Họ và tên</label>
                                    <input className="form-control" style={{ height: 52, borderRadius: 12 }} type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Số điện thoại</label>
                                    <input className="form-control" style={{ height: 52, borderRadius: 12 }} type="text" name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Giới tính</label>
                                    <select className="form-control" style={{ height: 52, borderRadius: 12 }} name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="">Chọn giới tính</option>
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Email (Hệ thống)</label>
                                    <input className="form-control" style={{ height: 52, borderRadius: 12, background: 'var(--bg-main)', border: 'none' }} type="email" value={user?.email || ""} disabled />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 40 }}>
                                <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Địa chỉ liên lạc</label>
                                <input className="form-control" style={{ height: 52, borderRadius: 12 }} type="text" name="address" value={formData.address} onChange={handleChange} />
                            </div>

                            {message.text && (
                                <div style={{ 
                                    padding: '16px', borderRadius: 16, marginBottom: 32, textAlign: 'center', fontSize: 14, fontWeight: 700,
                                    background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
                                    color: message.type === "success" ? "#10b981" : "#ef4444",
                                    border: `1px solid ${message.type === "success" ? "#d1fae5" : "#fee2e2"}`
                                }}>
                                    {message.text}
                                </div>
                            )}

                            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%', height: 56, borderRadius: 14, fontSize: 16, fontWeight: 800 }}>
                                {saving ? "Đang xử lý..." : "Lưu thay đổi hồ sơ"}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: STATS & SECURITY */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        
                        <div className="card" style={{ padding: 32, borderRadius: 32 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: "0.08em", marginBottom: 24 }}>Thống kê tham dự</h3>
                            <div className="grid-2" style={{ gap: 16 }}>
                                {[
                                    { lbl: "ĐĂNG KÝ", val: stats.total, color: "var(--color-primary)", bg: "#f5f3ff", icon: "🎫" },
                                    { lbl: "THAM DỰ", val: stats.attended, color: "#10b981", bg: "#ecfdf5", icon: "✅" },
                                    { lbl: "TỈ LỆ", val: `${attendRate}%`, color: "#06b6d4", bg: "#ecfeff", icon: "📊" },
                                    { lbl: "SẮP TỚI", val: stats.upcoming, color: "#f59e0b", bg: "#fff7ed", icon: "⏰" },
                                ].map(s => (
                                    <div key={s.lbl} style={{ padding: 20, borderRadius: 20, background: s.bg, border: '1px solid rgba(0,0,0,0.02)' }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>{s.lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 32, borderRadius: 32 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: "0.08em", marginBottom: 24 }}>Bảo mật & Tài khoản</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button className="btn btn-outline" style={{ height: 52, borderRadius: 12, justifyContent: 'center', fontWeight: 700 }} onClick={() => window.location.href = "/reset-password"}>
                                    🔒 Thay đổi mật khẩu
                                </button>
                                <button className="btn" style={{ height: 52, borderRadius: 12, justifyContent: 'center', background: '#fef2f2', color: '#ef4444', fontWeight: 700 }} onClick={logoutUser}>
                                    🚪 Đăng xuất hệ thống
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
