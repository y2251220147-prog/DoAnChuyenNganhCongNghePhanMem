import "../../index.css";
import "../../styles/global.css";
import "../../styles/layout.css";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {

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