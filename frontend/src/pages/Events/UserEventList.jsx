import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getAvailableEvents, getRegisteredEvents } from "../../services/eventService";
import { selfRegister } from "../../services/attendeeService";
import "../../styles/global.css";

const TABS = {
    AVAILABLE: "available",
    UPCOMING: "upcoming",
    PAST: "past"
};

export default function UserEventList() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = async (tab) => {
        setLoading(true);
        try {
            if (tab === TABS.AVAILABLE) {
                const r = await getAvailableEvents();
                setEvents(r.data || []);
            } else {
                const r = await getRegisteredEvents();
                const allRegistered = r.data || [];
                const now = new Date();
                
                if (tab === TABS.UPCOMING) {
                    setEvents(allRegistered.filter(e => new Date(e.end_date) > now && e.status !== "completed"));
                } else if (tab === TABS.PAST) {
                    setEvents(allRegistered.filter(e => new Date(e.end_date) <= now || e.status === "completed"));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents(activeTab);
    }, [activeTab]);

    const handleJoin = async (eventId) => {
        if (!window.confirm("Bạn có chắc chắn muốn đăng ký tham gia sự kiện này?")) return;
        try {
            await selfRegister(eventId);
            alert("Đăng ký thành công!");
            // Switch to upcoming tab
            if (activeTab === TABS.AVAILABLE) {
                setActiveTab(TABS.UPCOMING);
            } else {
                loadEvents(activeTab);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Đăng ký thất bại");
        }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: "20px" }}>
                <div>
                    <h2>Sự kiện</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Tìm kiếm, đăng ký và theo dõi các sự kiện của bạn.
                    </p>
                </div>
            </div>

            {/* Custom Tabs */}
            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border-color)", marginBottom: "24px" }}>
                <div 
                    onClick={() => setActiveTab(TABS.UPCOMING)}
                    style={{ 
                        padding: "12px 4px", cursor: "pointer", fontWeight: 600,
                        color: activeTab === TABS.UPCOMING ? "var(--color-primary)" : "var(--text-secondary)",
                        borderBottom: activeTab === TABS.UPCOMING ? "3px solid var(--color-primary)" : "3px solid transparent",
                        transition: "all 0.2s"
                    }}>
                    Sắp tham gia
                </div>
                <div 
                    onClick={() => setActiveTab(TABS.AVAILABLE)}
                    style={{ 
                        padding: "12px 4px", cursor: "pointer", fontWeight: 600,
                        color: activeTab === TABS.AVAILABLE ? "var(--color-primary)" : "var(--text-secondary)",
                        borderBottom: activeTab === TABS.AVAILABLE ? "3px solid var(--color-primary)" : "3px solid transparent",
                        transition: "all 0.2s"
                    }}>
                    Sự kiện có sẵn
                </div>
                <div 
                    onClick={() => setActiveTab(TABS.PAST)}
                    style={{ 
                        padding: "12px 4px", cursor: "pointer", fontWeight: 600,
                        color: activeTab === TABS.PAST ? "var(--color-primary)" : "var(--text-secondary)",
                        borderBottom: activeTab === TABS.PAST ? "3px solid var(--color-primary)" : "3px solid transparent",
                        transition: "all 0.2s"
                    }}>
                    Đã tham gia
                </div>
            </div>

            <div className="data-table-wrapper" style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tải sự kiện...</p></div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <span>{activeTab === TABS.AVAILABLE ? "🎪" : "📅"}</span>
                        <p>
                            {activeTab === TABS.AVAILABLE && "Trống. Không có sự kiện nào đang mở đăng ký."}
                            {activeTab === TABS.UPCOMING && "Bạn chưa đăng ký sự kiện nào sắp tới."}
                            {activeTab === TABS.PAST && "Bạn chưa tham gia sự kiện nào."}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tên sự kiện</th>
                                <th>Thời gian</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "right" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev) => (
                                <tr key={ev.id}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>🎪 {ev.name}</div>
                                        {ev.owner_name && (
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                                👤 Ban tổ chức: {ev.owner_name}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                        <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                            Ngày {fmtDate(ev.start_date)}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                        {ev.venue_type === "online" ? "🌐 Online" : `📍 ${ev.location || "—"}`}
                                    </td>
                                    <td>
                                        <StatusBadge status={ev.status} isRegistered={activeTab !== TABS.AVAILABLE && activeTab !== TABS.PAST} />
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="actions" style={{ justifyContent: "flex-end" }}>
                                            <button className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/events/${ev.id}`)} title="Xem chi tiết">
                                                Chi tiết
                                            </button>
                                            {activeTab === TABS.AVAILABLE && (
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => handleJoin(ev.id)}>
                                                    Tham gia
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
}

function StatusBadge({ status, isRegistered }) {
    if (isRegistered) {
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", padding: "3px 10px",
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: "#d1fae5", color: "#059669"
            }}>
                Đã đăng ký
            </span>
        );
    }

    const cfg = {
        draft: { label: "Bản nháp", bg: "#f1f5f9", color: "#64748b" },
        planning: { label: "Lên kế hoạch", bg: "#fef3c7", color: "#d97706" },
        approved: { label: "Đã duyệt", bg: "#ede9fe", color: "#7c3aed" },
        running: { label: "Đang diễn ra", bg: "#d1fae5", color: "#059669" },
        completed: { label: "Hoàn thành", bg: "#dbeafe", color: "#2563eb" },
        cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#dc2626" },
    }[status] || { label: status, bg: "#f1f5f9", color: "#64748b" };

    return (
        <span style={{
            display: "inline-flex", alignItems: "center", padding: "3px 10px",
            borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: cfg.bg, color: cfg.color
        }}>
            {cfg.label}
        </span>
    );
}
