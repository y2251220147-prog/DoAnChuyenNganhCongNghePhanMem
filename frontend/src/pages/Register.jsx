import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import "../styles/layout.css";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        gender: "Nam",
        password: "",
        confirmPassword: ""
    });

    const [securityCode, setSecurityCode] = useState("");
    const [userSecurityCode, setUserSecurityCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Generate security code on mount
    React.useEffect(() => {
        generateSecurityCode();
    }, []);

    const generateSecurityCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSecurityCode(code);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Mật khẩu xác nhận không khớp");
        }

        if (userSecurityCode !== securityCode) {
            return setError("Mã bảo mật không chính xác");
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                gender: formData.gender
            });
            alert("Đăng ký thành công!");
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ width: "450px" }}>
                <h2>Event Manager</h2>
                <div className="auth-subtitle">Tạo tài khoản mới</div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Nhập họ và tên"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Nhập địa chỉ email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                className="form-control"
                                placeholder="Số điện thoại"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Giới tính</label>
                            <select
                                name="gender"
                                className="form-control"
                                value={formData.gender}
                                onChange={handleChange}
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
                            type="text"
                            name="address"
                            className="form-control"
                            placeholder="Địa chỉ cư trú"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-control"
                            placeholder="••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Mã bảo mật: <span className="security-badge" style={{ backgroundColor: "#6366f1", color: "white", padding: "2px 8px", borderRadius: "4px", marginLeft: "10px", fontWeight: "bold", cursor: "pointer" }} onClick={generateSecurityCode} title="Nhấn để đổi mã">
                                {securityCode}
                            </span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập mã bảo mật 6 số"
                            value={userSecurityCode}
                            onChange={(e) => setUserSecurityCode(e.target.value)}
                            maxLength={6}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Đăng ký"}
                    </button>
                </form>

                <div className="auth-link">
                    Đã có tài khoản? <Link to="/">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;