import { createContext, useContext, useState } from "react";
import { logout } from "../services/authService";


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

// Hàm decode JWT payload (không cần thư viện)
function decodeToken(token) {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const t = localStorage.getItem("token");
        return t ? decodeToken(t) : null;
    });

    const loginUser = (token) => {
        localStorage.setItem("token", token);
        setToken(token);
        setUser(decodeToken(token));
    };

    // GHI CHÚ BẢO MẬT: Token vẫn hợp lệ trên server cho đến khi hết hạn (2 giờ).
    // Logout chỉ xóa token khỏi localStorage — không vô hiệu hóa token trên server.
    // Để thu hồi token ngay lập tức cần implement server-side blacklist hoặc dùng refresh token.
    const logoutUser = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ token, user, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);