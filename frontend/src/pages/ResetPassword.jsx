import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";
import { resetPassword } from "../services/authService";
import "../styles/global.css";
import "../styles/employee-theme.css";

export default function ResetPassword() {
    const { user } = useContext(AuthContext);
    const isRegularUser = user?.role === "user";

    const [form, setForm] = useState({ current: "", next: "", verify: "" });
    const [ui, setUi] = useState({ isSubmitting: false, feedback: null });
    
    const navigate = useNavigate();

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const processPasswordChange = async (e) => {
        e.preventDefault();
        setUi({ ...ui, feedback: null });

        if (form.next !== form.verify) {
            return setUi({ isSubmitting: false, feedback: { type: "error", text: "Mật khẩu xác nhận không khớp." } });
        }
        
        if (form.next.length < 6) {
            return setUi({ isSubmitting: false, feedback: { type: "error", text: "Độ dài mật khẩu phải từ 6 ký tự." } });
        }

        setUi({ isSubmitting: true, feedback: null });
        try {
            await resetPassword({ oldPassword: form.current, newPassword: form.next });
            setUi({ isSubmitting: false, feedback: { type: "success", text: "🎉 Tuyệt vời! Mật khẩu của bạn đã được thay đổi." } });
            setForm({ current: "", next: "", verify: "" });
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            const msg = err.response?.data?.message || "Xảy ra lỗi khi đổi mật khẩu.";
            setUi({ isSubmitting: false, feedback: { type: "error", text: "⚠️ " + msg } });
        }
    };

    // ── Giao diện dành cho User (Dark Theme) ─────────────────────────────────
    if (isRegularUser) {
        return (
            <Layout title="Đổi mật khẩu" subtitle="Bảo mật tài khoản của bạn">
                <div style={{
                    background: "linear-gradient(135deg, var(--emp-surface2) 0%, rgba(108,114,255,0.06) 100%)",
                    border: "1px solid var(--emp-border)",
                    borderRadius: "var(--emp-radius)",
                    padding: "22px 28px",
                    marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 16,
                }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--emp-radius)", background: "rgba(108,114,255,0.12)", border: "1px solid rgba(108,114,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🛡️</div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Trung tâm bảo mật</div>
                        <div style={{ fontSize: 12, color: "var(--emp-text2)", lineHeight: 1.6 }}>
                            Khuyên dùng mật khẩu mạnh bao gồm chữ cái, chữ số và các ký hiệu đặc biệt.
                        </div>
                    </div>
                </div>

                <div className="emp-panel" style={{ maxWidth: 460 }}>
                    {ui.feedback && (
                        <div style={{
                            marginBottom: 16, padding: "11px 14px", borderRadius: "var(--emp-radius-sm)", fontSize: 13,
                            background: ui.feedback.type === "success" ? "var(--emp-green-bg)" : "var(--emp-red-bg)",
                            border: `1px solid ${ui.feedback.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                            color: ui.feedback.type === "success" ? "var(--emp-green)" : "var(--emp-red)",
                        }}>
                            {ui.feedback.text}
                        </div>
                    )}

                    <form onSubmit={processPasswordChange}>
                        <div className="emp-form-group">
                            <label className="emp-form-label">Mật khẩu hiện tại</label>
                            <input type="password" name="current" className="emp-form-input"
                                placeholder="Nhập mật khẩu đang sử dụng"
                                value={form.current} onChange={handleInput} required />
                        </div>
                        <div className="emp-divider" />
                        <div className="emp-form-group">
                            <label className="emp-form-label">Mật khẩu mới</label>
                            <input type="password" name="next" className="emp-form-input"
                                placeholder="Nhập tối thiểu 6 ký tự"
                                value={form.next} onChange={handleInput} required />
                        </div>
                        <div className="emp-form-group">
                            <label className="emp-form-label">Xác nhận mật khẩu mới</label>
                            <input type="password" name="verify" className="emp-form-input"
                                placeholder="Nhập lại mật khẩu mới để xác nhận"
                                value={form.verify} onChange={handleInput} required />
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button type="submit" className="emp-btn emp-btn-primary"
                                style={{ flex: 1, justifyContent: "center", padding: "11px", borderRadius: "var(--emp-radius-sm)" }}
                                disabled={ui.isSubmitting}>
                                {ui.isSubmitting ? "Đang xử lý..." : "🔑 Đổi mật khẩu"}
                            </button>
                            <button type="button" className="emp-btn emp-btn-outline"
                                style={{ padding: "11px 18px", borderRadius: "var(--emp-radius-sm)" }}
                                onClick={() => navigate("/profile")}>
                                Quay lại
                            </button>
                        </div>
                    </form>
                </div>
            </Layout>
        );
    }

    // ── Giao diện dành cho Admin/Organizer (Light Theme) ──────────────────────
    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Thay đổi mật khẩu</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Quản lý và cập nhật thông tin bảo mật</p>
                </div>
            </div>
            <div className="grid-2">
                <div className="card">
                    {ui.feedback && (
                        <div className={`alert ${ui.feedback.type === "success" ? "alert-success" : "alert-error"}`}>{ui.feedback.text}</div>
                    )}
                    <form onSubmit={processPasswordChange}>
                        <div className="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input type="password" name="current" className="form-control" placeholder="Mật khẩu hiện tại"
                                value={form.current} onChange={handleInput} required />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input type="password" name="next" className="form-control" placeholder="Mật khẩu mới (6+ ký tự)"
                                value={form.next} onChange={handleInput} required />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu</label>
                            <input type="password" name="verify" className="form-control" placeholder="Nhập lại mật khẩu mới"
                                value={form.verify} onChange={handleInput} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={ui.isSubmitting}>
                            {ui.isSubmitting ? "Đang cập nhật..." : "🔐 Xác nhận đổi mật khẩu"}
                        </button>
                    </form>
                </div>
                <div className="card-stat" style={{ alignSelf: "start" }}>
                    <div className="card-stat-icon indigo">🛡️</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 16 }}>Lưu ý bảo mật</h3>
                        <p style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, textTransform: "none", letterSpacing: 0 }}>
                            Hệ thống yêu cầu mật khẩu mạnh để bảo vệ dữ liệu của bạn. Tránh sử dụng mật khẩu dễ đoán như ngày sinh hoặc tên.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
