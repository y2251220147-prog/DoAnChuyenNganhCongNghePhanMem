import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/layout.css";

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState("loading"); // loading, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify/${token}`);
                setStatus("success");
                setMessage(res.data.message);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Xác thực thất bại.");
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>
                    {status === "loading" && "⏳"}
                    {status === "success" && "✅"}
                    {status === "error" && "❌"}
                </div>
                
                <h2>
                    {status === "loading" && "Đang xác thực..."}
                    {status === "success" && "Thành công!"}
                    {status === "error" && "Lỗi xác thực"}
                </h2>
                
                <p style={{ margin: "20px 0", color: "#94a3b8" }}>
                    {message || "Vui lòng đợi trong giây lát..."}
                </p>

                {status !== "loading" && (
                    <Link to="/" className="btn btn-primary" style={{ display: "inline-block", marginTop: "10px" }}>
                        Quay lại Đăng nhập
                    </Link>
                )}
            </div>
        </div>
    );
}
