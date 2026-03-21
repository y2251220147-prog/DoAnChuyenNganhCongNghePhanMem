import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import { getProfile, updateProfile } from "../services/userService";
import { resetPassword } from "../services/authService";

export default function UserProfile() {

    const [profile, setProfile] = useState({ name: "", email: "", phone: "", address: "", gender: "male", is_verified: 0 });
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
    const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await getProfile();
            setProfile({
                name: res.data.name || "",
                email: res.data.email || "",
                phone: res.data.phone || "",
                address: res.data.address || "",
                gender: res.data.gender || "male",
                is_verified: res.data.is_verified || 0
            });
        } catch {
            setProfileMsg({ text: "Không thể tải thông tin", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profile);
            setProfileMsg({ text: "Cập nhật thông tin thành công!", type: "success" });
            setTimeout(() => setProfileMsg({ text: "", type: "" }), 3000);
        } catch (err) {
            setProfileMsg({
                text: err.response?.data?.message || "Có lỗi xảy ra",
                type: "error"
            });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordMsg({ text: "Mật khẩu mới không khớp!", type: "error" });
            return;
        }

        if (passwords.newPassword.length < 6) {
            setPasswordMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự!", type: "error" });
            return;
        }

        try {
            await resetPassword({
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setPasswordMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setPasswordMsg({ text: "", type: "" }), 3000);
        } catch (err) {
            setPasswordMsg({
                text: err.response?.data?.message || "Có lỗi xảy ra",
                type: "error"
            });
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="empty-state">
                    <p>Đang tải...</p>
                </div>
            </Layout>
        );
    }

    return (

        <Layout>

            <h2 className="page-title">Hồ sơ cá nhân</h2>

            <div className="profile-container">

                {/* UPDATE PROFILE */}
                <div className="profile-card">
                    <h3>👤 Thông tin cá nhân</h3>

                    {profileMsg.text && (
                        <div className={`alert alert-${profileMsg.type}`}>
                            {profileMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                            <label>Tên</label>
                            <input
                                className="form-control"
                                placeholder="Nhập tên"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Nhập email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                required
                            />
                        </div>
                        
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Số điện thoại</label>
                                <input
                                    className="form-control"
                                    placeholder="Nhập số điện thoại"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Giới tính</label>
                                <select 
                                    className="form-control"
                                    value={profile.gender}
                                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Địa chỉ</label>
                            <input
                                className="form-control"
                                placeholder="Nhập địa chỉ"
                                value={profile.address}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            />
                        </div>
                        <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                            <button type="submit" className="btn btn-primary">
                                💾 Lưu thông tin
                            </button>
                        </div>
                    </form>
                </div>

                {/* CHANGE PASSWORD */}
                <div className="profile-card">
                    <h3>🔒 Đổi mật khẩu</h3>

                    {passwordMsg.text && (
                        <div className={`alert alert-${passwordMsg.type}`}>
                            {passwordMsg.text}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Nhập mật khẩu hiện tại"
                                value={passwords.oldPassword}
                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Nhập lại mật khẩu mới"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                            <button type="submit" className="btn btn-success">
                                🔑 Đổi mật khẩu
                            </button>
                        </div>
                    </form>
                </div>

            </div>

        </Layout>

    );

}
