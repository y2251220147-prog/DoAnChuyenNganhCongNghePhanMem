import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../services/userService";
import "../../styles/global.css";

export default function Profile() {
    const { user, setAuth } = useContext(AuthContext);
    const [profile, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "", phone: "", department: "", position: "", avatar: ""
    });
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await getProfile();
            const data = res.data;
            setProfileData(data);
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                department: data.department || "",
                position: data.position || "",
                avatar: data.avatar || ""
            });
        } catch (err) {
            setMessage({ type: "error", text: "Lỗi tải thông tin cá nhân." });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        try {
            const res = await updateProfile(formData);
            setProfileData(res.data.user);
            setIsEditing(false);
            setMessage({ type: "success", text: "Cập nhật thành công!" });
            // Cập nhật AuthContext nếu name/avatar hiển thị ở Navbar phụ thuộc
            const token = localStorage.getItem("token");
            if (token) {
                setAuth(token, res.data.user);
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Lỗi cập nhật." });
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Thông tin cá nhân</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                        Quản lý hồ sơ cá nhân và thông tin liên hệ của bạn.
                    </p>
                </div>
                {!isEditing && (
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                        ✏️ Chỉnh sửa
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: "20px" }}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
            ) : profile ? (
                <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                    {isEditing ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Họ và Tên <span style={{ color: "red" }}>*</span></label>
                                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Điện thoại</label>
                                <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                            </div>
                            {profile.role !== "user" && (
                                <>
                                    <div className="form-group" style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Phòng ban</label>
                                        <input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Chức vụ</label>
                                        <input type="text" name="position" className="form-input" value={formData.position} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                                    </div>
                                </>
                            )}
                            <div className="form-group" style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Avatar URL</label>
                                <input type="url" name="avatar" className="form-input" value={formData.avatar} onChange={handleChange} placeholder="https://..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
                                <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", overflow: "hidden", color: "var(--color-primary-dark)" }}>
                                    {profile.avatar ? <img src={profile.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>{profile.name}</h3>
                                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", display: "inline-block", padding: "2px 8px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px" }}>
                                        {profile.role.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>Email</p>
                                    <p style={{ fontWeight: 500 }}>{profile.email}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>Điện thoại</p>
                                    <p style={{ fontWeight: 500 }}>{profile.phone || "—"}</p>
                                </div>
                                {profile.role !== "user" && (
                                    <>
                                        <div>
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>Phòng ban</p>
                                            <p style={{ fontWeight: 500 }}>{profile.department || "—"}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>Chức vụ</p>
                                            <p style={{ fontWeight: 500 }}>{profile.position || "—"}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </Layout>
    );
}
