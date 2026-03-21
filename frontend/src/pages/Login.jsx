import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/authService";
import "../styles/layout.css";

export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { loginUser } = useContext(AuthContext);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");
        setLoading(true);

        try {

            const res = await login({ email, password });

            loginUser(res.data.token);

            navigate("/dashboard");

        } catch (err) {

            setError(err.response?.data?.message || "Đăng nhập thất bại");

        } finally {
            setLoading(false);
        }

    };

    return (

        <div className="auth-page">

            <div className="auth-card">

                <h2>🎯 Event Manager</h2>
                <p className="auth-subtitle">Đăng nhập vào hệ thống</p>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            className="form-control"
                            placeholder="Nhập email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>

                </form>

                <div className="auth-link">
                    Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </div>

            </div>

        </div>

    );

}