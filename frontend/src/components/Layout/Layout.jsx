import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import EmployeeLayout from "./EmployeeLayout";
import "../../index.css";
import "../../styles/global.css";
import "../../styles/layout.css";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children, title, subtitle }) {
    const { user } = useContext(AuthContext);

    // User (employee) role → dùng dark Employee layout
    if (user?.role === "user") {
        return (
            <EmployeeLayout title={title} subtitle={subtitle}>
                {children}
            </EmployeeLayout>
        );
    }

    // Admin / Organizer → layout cũ
    return (
        <div className="layout">
            <Sidebar />
            <div className="main">
                <Header />
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
}