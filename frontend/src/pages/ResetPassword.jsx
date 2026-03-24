import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import { resetPassword } from "../services/authService";
import "../styles/global.css";

export default function ResetPassword() {

    const [oldPassword, setOld] = useState("");
    const [newPassword, setNew] = useState("");
    const [confirmNew, setConfirmNew] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmNew) {
            return setMessage({ type: "error", text: "New passwords do not match." });
        }
        if (newPassword.length < 6) {
            return setMessage({ type: "error", text: "New password must be at least 6 characters." });
        }

        setLoading(true);
        try {
            await resetPassword({ oldPassword, newPassword });
            setMessage({ type: "success", text: "✅ Password updated successfully!" });
            setOld(""); setNew(""); setConfirmNew("");
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            setMessage({ type: "error", text: "⚠️ " + (err.response?.data?.message || "Update failed.") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Reset Password</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Update your account password
                    </p>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    {message && (
                        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter current password"
                                value={oldPassword}
                                onChange={(e) => setOld(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChange={(e) => setNew(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Repeat new password"
                                value={confirmNew}
                                onChange={(e) => setConfirmNew(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "8px" }}
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "🔒 Update Password"}
                        </button>
                    </form>
                </div>

                <div className="card-stat" style={{ alignSelf: "start" }}>
                    <div className="card-stat-icon indigo">🔐</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: "16px" }}>Security Tips</h3>
                        <p style={{ fontSize: "12px", lineHeight: "1.6", marginTop: "8px", textTransform: "none", letterSpacing: "0" }}>
                            Use at least 6 characters. Mix letters, numbers and symbols for a stronger password.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
