import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";
import "../../styles/global.css";

export default function CheckinScanner() {

    const [qr, setQr] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const checkin = async (e) => {
        e.preventDefault();
        if (!qr.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            await api.post("/checkin", { qr_code: qr });
            setMessage({ type: "success", text: "✅ Check-in successful!" });
            setQr("");
        } catch (err) {
            setMessage({ type: "error", text: "❌ " + (err.response?.data?.message || "Check-in failed") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>QR Check-in</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Scan guest QR codes to record attendance
                    </p>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Manual Entry / Scanner</h3>

                    {message && (
                        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={checkin} className="form-group">
                        <label>Guest QR Code</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                className="form-control"
                                placeholder="Scan or enter QR code string..."
                                value={qr}
                                onChange={(e) => setQr(e.target.value)}
                                autoFocus
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !qr.trim()}
                                style={{ flexShrink: 0 }}
                            >
                                {loading ? "..." : "Check in"}
                            </button>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                            Ensure the scanner is in focus on the input field above.
                        </p>
                    </form>
                </div>

                <div className="card-stat" style={{ alignSelf: "start" }}>
                    <div className="card-stat-icon indigo">📱</div>
                    <div className="card-stat-info">
                        <h3>Scanner Ready</h3>
                        <p>Awaiting input</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}