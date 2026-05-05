import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../services/userService";
import UploadAvatar from "../../components/UploadAvatar";

export default function ProfilePage() {
    const { user, logoutUser, updateProfileData } = useContext(AuthContext);
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
                    // Department info (read-only, set by admin)
                    department_name: data.department_name || "",
                    role_in_dept: data.role_in_dept || "",
                });
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
            setMessage({ type: "success", text: "Cập nhật hồ sơ thành công! ✨" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Lỗi cập nhật hồ sơ. Vui lòng thử lại." });
        } finally {
            setSaving(false);
        }
    };

    const attendRate = stats.total > 0 ? Math.round(stats.attended / stats.total * 100) : 0;

    if (loading) {
        return (
            <Layout title="Hồ sơ cá nhân">
                <div className="emp-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--emp-text2)' }}>
                    <div className="emp-loader" style={{ marginBottom: 15, fontSize: 30 }}>⏳</div>
                    <p>Đang tải dữ liệu hồ sơ cao cấp...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Thiết lập tài khoản">
            <div style={{ width: "100%", padding: "0 4px" }}>
                
                {/* ── SECTION 1: IDENTITY HEADER ── */}
                <div className="emp-panel" style={{ marginBottom: 30, padding: '48px', position: 'relative', overflow: 'hidden', borderRadius: 24, background: "linear-gradient(135deg, var(--emp-surface) 0%, rgba(108,114,255,0.05) 100%)" }}>
                    <div style={{ 
                        position: 'absolute', top: -50, right: -50, width: 400, height: 400, 
                        background: 'radial-gradient(circle, var(--emp-accent-glow) 0%, transparent 70%)', 
                        opacity: 0.3, pointerEvents: 'none' 
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 40, position: 'relative', zIndex: 1 }}>
                        <div style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)", borderRadius: "50%", padding: 4, background: "var(--emp-accent)" }}>
                            <UploadAvatar />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                                <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--emp-text)', margin: 0 }}>{user?.name || "Thành viên"}</h1>
                                <span className="emp-badge emp-badge-purple" style={{ textTransform: 'uppercase', padding: '6px 16px', borderRadius: 12, fontWeight: 800, fontSize: 12, letterSpacing: "0.1em" }}>
                                    {user?.role?.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                                <div style={{ fontSize: 16, color: 'var(--emp-text2)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                    {user?.email}
                                </div>
                                <div style={{ fontSize: 16, color: 'var(--emp-text2)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {formData.address || "Chưa cập nhật địa chỉ"}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                                <span className="emp-badge emp-badge-green" style={{ padding: "6px 14px", borderRadius: 10 }}>● Đang hoạt động</span>
                                {formData.department_name && (
                                    <span className="emp-badge emp-badge-gray" style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(99,102,241,0.12)", color: "#4338ca" }}>
                                        🏢 {formData.department_name}
                                    </span>
                                )}
                                {formData.role_in_dept && (
                                    <span className="emp-badge emp-badge-gray" style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(16,185,129,0.1)", color: "#047857" }}>
                                        💼 {formData.role_in_dept}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: BENTO GRID ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 30 }}>
                    
                    {/* LEFT COL: INFO FORM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        <div className="emp-panel" style={{ padding: 40, borderRadius: 24 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--emp-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emp-accent)', boxShadow: "0 8px 16px -4px rgba(108,114,255,0.2)" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span>Hồ sơ thành viên</span>
                                    <span style={{ fontSize: 12, color: "var(--emp-text3)", fontWeight: 500 }}>Cập nhật thông tin định danh của bạn</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
                                    <div className="emp-form-group" style={{ marginBottom: 0 }}>
                                        <label className="emp-form-label" style={{ fontWeight: 700 }}>Họ và tên đầy đủ</label>
                                        <input className="emp-form-input" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="VD: Nguyễn Văn An" style={{ padding: 16, fontSize: 15, borderRadius: 14 }} />
                                    </div>
                                    <div className="emp-form-group" style={{ marginBottom: 0 }}>
                                        <label className="emp-form-label" style={{ fontWeight: 700 }}>Số điện thoại</label>
                                        <input className="emp-form-input" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="VD: 0987 654 321" style={{ padding: 16, fontSize: 15, borderRadius: 14 }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
                                    <div className="emp-form-group" style={{ marginBottom: 0 }}>
                                        <label className="emp-form-label" style={{ fontWeight: 700 }}>Giới tính</label>
                                        <select className="emp-form-select" name="gender" value={formData.gender} onChange={handleChange} style={{ padding: "0 16px", height: 52, borderRadius: 14 }}>
                                            <option value="">Chọn giới tính</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khai báo khác</option>
                                        </select>
                                    </div>
                                    <div className="emp-form-group" style={{ marginBottom: 0 }}>
                                        <label className="emp-form-label" style={{ fontWeight: 700 }}>Email (Không thể sửa)</label>
                                        <input className="emp-form-input" type="email" value={user?.email || ""} disabled style={{ padding: 16, fontSize: 15, borderRadius: 14, opacity: 0.6, background: "rgba(255,255,255,0.05)" }} />
                                    </div>
                                </div>

                                <div className="emp-form-group" style={{ marginBottom: 40 }}>
                                    <label className="emp-form-label" style={{ fontWeight: 700 }}>Địa chỉ liên hệ hiện tại</label>
                                    <input className="emp-form-input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="VD: 123 Núi Thành, Hải Châu, Đà Nẵng" style={{ padding: 16, fontSize: 15, borderRadius: 14 }} />
                                </div>

                                {message.text && (
                                    <div className={`emp-badge emp-badge-${message.type === "success" ? "green" : "red"}`} style={{ width: '100%', padding: '18px', borderRadius: 16, marginBottom: 32, justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
                                        {message.text}
                                    </div>
                                )}

                                <button className="emp-btn emp-btn-primary" type="submit" disabled={saving} style={{ width: '100%', height: 60, fontSize: 16, fontWeight: 800, borderRadius: 16, gap: 12, boxShadow: "0 10px 25px -5px rgba(108,114,255,0.4)" }}>
                                    {saving ? "🔄 ĐANG LƯU DỮ LIỆU..." : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                            XÁC NHẬN CẬP NHẬT HỒ SƠ
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COL: STATS & ACCOUNT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        
                        {/* STATS BENTO */}
                        <div className="emp-panel" style={{ padding: 32, borderRadius: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, color: 'var(--emp-text2)', textTransform: 'uppercase', letterSpacing: "0.1em" }}>Hiệu suất tham xự</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { label: "SỰ KIỆN ĐÃ ĐĂNG KÝ", val: stats.total, color: "var(--emp-accent)", icon: "🎫" },
                                    { label: "ĐÃ CÓ MẶT", val: stats.attended, color: "#10b981", icon: "✅" },
                                    { label: "TỈ LỆ CHUYÊN CẦN", val: `${attendRate}%`, color: "#06b6d4", icon: "📊" },
                                    { label: "SỰ KIỆN SẮP TỚI", val: stats.upcoming, color: "#f59e0b", icon: "⏰" },
                                ].map(s => (
                                    <div key={s.label} className="emp-bento-card" style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
                                        <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--emp-text3)', textTransform: 'uppercase', marginTop: 8 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECURITY BENTO */}
                        <div className="emp-panel" style={{ padding: 32, borderRadius: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, color: 'var(--emp-text2)', textTransform: 'uppercase', letterSpacing: "0.1em" }}>Tài khoản & Bảo mật</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <button className="emp-btn emp-btn-outline" style={{ justifyContent: 'center', height: 56, borderRadius: 16, fontSize: 14, fontWeight: 700, border: "2px solid rgba(255,255,255,0.1)" }} onClick={() => window.location.href = "/reset-password"}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 10 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    Thay đổi mật khẩu đăng nhập
                                </button>
                                <button className="emp-btn emp-btn-cancel" style={{ justifyContent: 'center', height: 56, borderRadius: 16, fontSize: 14, fontWeight: 700, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none" }} onClick={logoutUser}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 10 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    Đăng xuất tài khoản ngay
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
