import { useContext } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";

export default function Dashboard() {

    const { user } = useContext(AuthContext);

    return (

        <Layout>

            <h2 className="page-title">
                Dashboard
            </h2>

            <div className="stats-grid">

                <div className="stat-card">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-value">12</div>
                    <div className="stat-label">Tổng Events</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👔</div>
                    <div className="stat-value">25</div>
                    <div className="stat-label">Tổng Staff</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">140</div>
                    <div className="stat-label">Tổng Guests</div>
                </div>

                {user?.role === "admin" && (
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">--</div>
                        <div className="stat-label">Tổng Users</div>
                    </div>
                )}

            </div>

            <div className="profile-card">
                <h3>🔔 Chào mừng</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.8 }}>
                    Bạn đang đăng nhập với vai trò{" "}
                    <span className={`role-badge ${user?.role || "user"}`}>
                        {user?.role || "user"}
                    </span>
                    . Sử dụng menu bên trái để điều hướng đến các chức năng của bạn.
                </p>
            </div>

        </Layout>

    );

}