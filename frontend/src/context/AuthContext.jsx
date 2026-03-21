import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

// Manual JWT decode — no external dependency needed
const decodeToken = (token) => {
    try {
        if (!token) return null;
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = JSON.parse(atob(payload));
        return { id: decoded.id, role: decoded.role };
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(decodeToken(localStorage.getItem("token")));

    const loginUser = (newToken) => {

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(decodeToken(newToken));

    };

    const logoutUser = () => {

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);

    };

    return (

        <AuthContext.Provider
            value={{ token, user, loginUser, logoutUser }}
        >
            {children}
        </AuthContext.Provider>

    );

};