import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

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

    // Kiểm tra token có hết hạn không khi khởi động app
    const getValidToken = () => {
        const t = localStorage.getItem("token");
        if (!t) return null;
        try {
            const payload = JSON.parse(atob(t.split(".")[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem("token"); // token hết hạn, xóa luôn
                return null;
            }
            return t;
        } catch { return null; }
    };

    const [token, setToken] = useState(getValidToken);
    const [user, setUser] = useState(() => {
        const t = getValidToken();
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
    const logoutUser = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const updateUserAvatar = (newAvatarUrl) => {
        setUser(prev => ({
            ...prev,
            avatar: newAvatarUrl
        }));
    };

    const updateProfileData = (newData) => {
        setUser(prev => ({
            ...prev,
            ...newData
        }));
    };

    // Tự động tải thông tin đầy đủ khi khởi động app
    useEffect(() => {
        if (!token) return;
        const fetchFullProfile = async () => {
            try {
                const res = await api.get("/users/profile");
                if (res.data) {
                    setUser(prev => ({ ...prev, ...res.data }));
                }
            } catch (err) {
                console.error("AuthContext sync error:", err);
            }
        };
        fetchFullProfile();
    }, [token]);

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http')) return avatarPath;
        // fallback to server uploads
        return `http://localhost:5000/${avatarPath}`;
    };

    return (
        <AuthContext.Provider value={{ token, user, loginUser, logoutUser, updateUserAvatar, updateProfileData, getAvatarUrl }}>
            {children}
        </AuthContext.Provider>
    );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);