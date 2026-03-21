import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Header() {

    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate("/");
    };

    const getInitial = () => {
        return user ? (user.role || "U").charAt(0).toUpperCase() : "?";
    };

    return (

        <div className="header">

            <div className="header-title">
                Internal Event Management System
            </div>

            <div className="header-actions">
                <div className="header-user">
                    <div className="header-avatar">
                        {getInitial()}
                    </div>
                    <span className="header-user-name">
                        {user ? user.role.toUpperCase() : "Guest"}
                    </span>
                </div>

                <button
                    className="header-logout-btn"
                    onClick={handleLogout}
                >
                    Đăng xuất
                </button>
            </div>

        </div>

    );

}