import { createContext, useContext, useState } from "react";

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

    const logoutUser = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);