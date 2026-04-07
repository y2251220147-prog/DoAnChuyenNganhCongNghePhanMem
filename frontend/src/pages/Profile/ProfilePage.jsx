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
                    address: data.address || ""
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
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                
                {/* ── SECTION 1: IDENTITY HEADER ── */}
                <div className="emp-panel" style={{ marginBottom: 30, padding: '40px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ 
                        position: 'absolute', top: -100, right: -100, width: 300, height: 300, 
                        background: 'radial-gradient(circle, var(--emp-accent-glow) 0%, transparent 70%)', 
                        opacity: 0.5, pointerEvents: 'none' 
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'relative', zIndex: 1 }}>
                        <UploadAvatar />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--emp-text)' }}>{user?.name || "Người dùng"}</h1>
                                <span className="emp-badge emp-badge-purple" style={{ textTransform: 'uppercase', padding: '4px 12px' }}>
                                    {user?.role}
                                </span>
                            </div>
                            <p style={{ fontSize: 15, color: 'var(--emp-text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                {user?.email}
                            </p>
                            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                <span className="emp-badge emp-badge-green">Kích hoạt</span>
                                {user?.department && <span className="emp-badge emp-badge-gray">{user.department}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: BENTO GRID ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 30 }}>
                    
                    {/* LEFT COL: INFO FORM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        <div className="emp-panel">
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--emp-accent-light)', display: 'flex', alignItems: 'center', justify內容: 'center', color: 'var(--emp-accent)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                Thông tin cá nhân
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                    <div className="emp-form-group">
                                        <label className="emp-form-label">Tên hiển thị</label>
                                        <input className="emp-form-input" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="VD: Nguyễn Văn An" />
                                    </div>
                                    <div className="emp-form-group">
                                        <label className="emp-form-label">Số điện thoại</label>
                                        <input className="emp-form-input" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="VD: 0987 654 321" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                    <div className="emp-form-group">
                                        <label className="emp-form-label">Giới tính</label>
                                        <select className="emp-form-select" name="gender" value={formData.gender} onChange={handleChange}>
                                            <option value="">Chọn giới tính</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                    <div className="emp-form-group">
                                        <label className="emp-form-label">Gmail</label>
                                        <input className="emp-form-input" type="email" value={user?.email || ""} disabled />
                                    </div>
                                </div>

                                <div className="emp-form-group" style={{ marginBottom: 32 }}>
                                    <label className="emp-form-label">Địa chỉ hiện tại</label>
                                    <input className="emp-form-input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="VD: 123 Núi Thành, Hải Châu, Đà Nẵng" />
                                </div>

                                {message.text && (
                                    <div className={`emp-badge emp-badge-${message.type === "success" ? "green" : "red"}`} style={{ width: '100%', padding: '16px', borderRadius: 12, marginBottom: 24, justifyContent: 'center', fontSize: 14 }}>
                                        {message.text}
                                    </div>
                                )}

                                <button className="emp-btn emp-btn-primary" type="submit" disabled={saving} style={{ width: '100%', height: 52, fontSize: 15, fontWeight: 700, borderRadius: 12, gap: 10 }}>
                                    {saving ? "🔄 Đang lưu..." : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                            Cập nhật hồ sơ ngay
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COL: STATS & ACCOUNT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        
                        {/* STATS BENTO */}
                        <div className="emp-panel">
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--emp-text2)' }}>Thống kê tham dự</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { label: "Sự kiện tham gia", val: stats.total, color: "var(--emp-accent)", icon: "🎫" },
                                    { label: "Đã có mặt", val: stats.attended, color: "var(--emp-green)", icon: "✅" },
                                    { label: "Tỉ lệ chuyên cần", val: `${attendRate}%`, color: "var(--emp-cyan)", icon: "📊" },
                                    { label: "Sắp tới", val: stats.upcoming, color: "var(--emp-amber)", icon: "⏰" },
                                ].map(s => (
                                    <div key={s.label} className="emp-bento-card">
                                        <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--emp-text3)', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECURITY BENTO */}
                        <div className="emp-panel">
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--emp-text2)' }}>Tài khoản & Bảo mật</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <button className="emp-btn emp-btn-outline" style={{ justifyContent: 'center', height: 48, borderRadius: 12 }} onClick={() => window.location.href = "/reset-password"}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    Thay đổi mật khẩu
                                </button>
                                <button className="emp-btn emp-btn-cancel" style={{ justifyContent: 'center', height: 48, borderRadius: 12 }} onClick={logoutUser}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    Đăng xuất tài khoản
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
