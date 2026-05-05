import "../../index.css";
import "../../styles/global.css";
import "../../styles/layout.css";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children, title, subtitle }) {
    // Admin / Organizer / User dùng chung layout chuẩn để đồng bộ giao diện
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