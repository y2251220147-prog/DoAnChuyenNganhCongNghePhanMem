import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";
import { resetPassword } from "../services/authService";
import "../styles/global.css";

export default function ResetPassword() {
    const { user } = useContext(AuthContext);
    const [oldPassword, setOld]     = useState("");
    const [newPassword, setNew]     = useState("");
    const [confirmNew, setConfirm]  = useState("");
    const [loading, setLoading]     = useState(false);
    const [message, setMessage]     = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setMessage(null);
        if (newPassword !== confirmNew)
            return setMessage({ type: "error", text: "Mật khẩu mới không khớp." });
        if (newPassword.length < 6)
            return setMessage({ type: "error", text: "Mật khẩu tối thiểu 6 ký tự." });
        
        setLoading(true);
        try {
            await resetPassword({ oldPassword, newPassword });
            setMessage({ type: "success", text: "✅ Đổi mật khẩu thành công!" });
            setOld(""); setNew(""); setConfirm("");
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            setMessage({ type: "error", text: "⚠️ " + (err.response?.data?.message || "Đổi mật khẩu thất bại.") });
        } finally { setLoading(false); }
    };

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>🔐 Đổi mật khẩu</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>Bảo mật tài khoản của bạn bằng mật khẩu mạnh</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, maxWidth: 1000 }}>
                <div className="card" style={{ padding: 32, borderRadius: 24 }}>
                    {message && (
                        <div style={{ 
                            padding: '14px', borderRadius: 12, marginBottom: 24, fontSize: 14, fontWeight: 700,
                            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: message.type === "success" ? "#10b981" : "#ef4444",
                            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`
                        }}>
                            {message.text}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Mật khẩu hiện tại</label>
                            <input type="password" className="form-control" style={{ borderRadius: 12, height: 48 }} 
                                placeholder="Nhập mật khẩu hiện tại"
                                value={oldPassword} onChange={e => setOld(e.target.value)} required />
                        </div>
                        
                        <div style={{ height: 1, background: "#f1f5f9", margin: "24px 0" }} />

                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Mật khẩu mới</label>
                            <input type="password" className="form-control" style={{ borderRadius: 12, height: 48 }}
                                placeholder="Tối thiểu 6 ký tự"
                                value={newPassword} onChange={e => setNew(e.target.value)} required />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: 32 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Xác nhận mật khẩu mới</label>
                            <input type="password" className="form-control" style={{ borderRadius: 12, height: 48 }}
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmNew} onChange={e => setConfirm(e.target.value)} required />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 52, borderRadius: 12, fontWeight: 800 }} disabled={loading}>
                                {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                            </button>
                            <button type="button" className="btn btn-outline" style={{ height: 52, borderRadius: 12, padding: "0 24px", fontWeight: 700 }} onClick={() => navigate(-1)}>
                                Huỷ bỏ
                            </button>
                        </div>
                    </form>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="card" style={{ padding: 28, borderRadius: 24, background: "var(--bg-main)", border: "none" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(99, 102, 241, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>🛡️</div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Mẹo bảo mật</h3>
                        <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                "Sử dụng ít nhất 6 ký tự trở lên",
                                "Kết hợp chữ cái, số và ký tự đặc biệt",
                                "Không nên dùng thông tin cá nhân (ngày sinh, tên)",
                                "Thay đổi mật khẩu định kỳ để tăng an toàn"
                            ].map((tip, i) => (
                                <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <span style={{ color: "var(--color-primary)", fontWeight: 800 }}>•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="card" style={{ padding: 28, borderRadius: 24, background: "#fef2f2", border: "none" }}>
                        <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 700, lineHeight: 1.6 }}>
                            ⚠️ Lưu ý: Sau khi đổi mật khẩu thành công, bạn sẽ được chuyển hướng về trang Dashboard.
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
