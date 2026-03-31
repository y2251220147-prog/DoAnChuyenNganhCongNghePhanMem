import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";
import { resetPassword } from "../services/authService";
import "../styles/global.css";
import "../styles/employee-theme.css";

export default function ResetPassword() {
    const { user } = useContext(AuthContext);
    const isUser = user?.role === "user";

    const [oldPassword, setOld]     = useState("");
    const [newPassword, setNew]     = useState("");
    const [confirmNew, setConfirm]  = useState("");
    const [loading, setLoading]     = useState(false);
    const [message, setMessage]     = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); setMessage(null);
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

    // ── User role: dark theme form ─────────────────────────────────────────
    if (isUser) {
        return (
            <Layout title="Đổi mật khẩu" subtitle="Bảo mật tài khoản của bạn">
                {/* Security banner */}
                <div style={{
                    background: "linear-gradient(135deg, var(--emp-surface2) 0%, rgba(108,114,255,0.06) 100%)",
                    border: "1px solid var(--emp-border)",
                    borderRadius: "var(--emp-radius)",
                    padding: "22px 28px",
                    marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 16,
                }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--emp-radius)", background: "rgba(108,114,255,0.12)", border: "1px solid rgba(108,114,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔒</div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Bảo mật tài khoản</div>
                        <div style={{ fontSize: 12, color: "var(--emp-text2)", lineHeight: 1.6 }}>
                            Sử dụng ít nhất 6 ký tự, kết hợp chữ hoa, chữ thường và số để tăng độ bảo mật.
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="emp-panel" style={{ maxWidth: 460 }}>
                    {message && (
                        <div style={{
                            marginBottom: 16, padding: "11px 14px", borderRadius: "var(--emp-radius-sm)", fontSize: 13,
                            background: message.type === "success" ? "var(--emp-green-bg)" : "var(--emp-red-bg)",
                            border: `1px solid ${message.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                            color: message.type === "success" ? "var(--emp-green)" : "var(--emp-red)",
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="emp-form-group">
                            <label className="emp-form-label">Mật khẩu hiện tại</label>
                            <input type="password" className="emp-form-input"
                                placeholder="Nhập mật khẩu hiện tại"
                                value={oldPassword} onChange={e => setOld(e.target.value)} required />
                        </div>
                        <div className="emp-divider" />
                        <div className="emp-form-group">
                            <label className="emp-form-label">Mật khẩu mới</label>
                            <input type="password" className="emp-form-input"
                                placeholder="Tối thiểu 6 ký tự"
                                value={newPassword} onChange={e => setNew(e.target.value)} required />
                        </div>
                        <div className="emp-form-group">
                            <label className="emp-form-label">Xác nhận mật khẩu mới</label>
                            <input type="password" className="emp-form-input"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmNew} onChange={e => setConfirm(e.target.value)} required />
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button type="submit" className="emp-btn emp-btn-primary"
                                style={{ flex: 1, justifyContent: "center", padding: "11px", borderRadius: "var(--emp-radius-sm)" }}
                                disabled={loading}>
                                {loading ? "Đang cập nhật..." : "🔒 Cập nhật mật khẩu"}
                            </button>
                            <button type="button" className="emp-btn emp-btn-outline"
                                style={{ padding: "11px 18px", borderRadius: "var(--emp-radius-sm)" }}
                                onClick={() => navigate("/profile")}>
                                Huỷ
                            </button>
                        </div>
                    </form>
                </div>
            </Layout>
        );
    }

    // ── Admin/Organizer: old light theme ────────────────────────────────────
    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Đổi mật khẩu</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Cập nhật mật khẩu tài khoản</p>
                </div>
            </div>
            <div className="grid-2">
                <div className="card">
                    {message && (
                        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>{message.text}</div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input type="password" className="form-control" placeholder="Nhập mật khẩu hiện tại"
                                value={oldPassword} onChange={e => setOld(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input type="password" className="form-control" placeholder="Tối thiểu 6 ký tự"
                                value={newPassword} onChange={e => setNew(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu mới</label>
                            <input type="password" className="form-control" placeholder="Nhập lại mật khẩu mới"
                                value={confirmNew} onChange={e => setConfirm(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
                            {loading ? "Đang cập nhật..." : "🔒 Cập nhật mật khẩu"}
                        </button>
                    </form>
                </div>
                <div className="card-stat" style={{ alignSelf: "start" }}>
                    <div className="card-stat-icon indigo">🔐</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 16 }}>Mẹo bảo mật</h3>
                        <p style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, textTransform: "none", letterSpacing: 0 }}>
                            Dùng ít nhất 6 ký tự, kết hợp chữ hoa, chữ số và ký tự đặc biệt.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
