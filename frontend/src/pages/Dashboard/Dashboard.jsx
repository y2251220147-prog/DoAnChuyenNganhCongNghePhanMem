import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { getStaff } from "../../services/staffService";
import { getGuests } from "../../services/guestService";
import { getBudget } from "../../services/budgetService";
import "../../styles/global.css";

const STAT_CARDS = [
    { icon: "🎪", label: "Total Events", key: "events", color: "indigo" },
    { icon: "👥", label: "Staff Members", key: "staff", color: "cyan" },
    { icon: "🎟️", label: "Total Guests", key: "guests", color: "emerald" },
    { icon: "💰", label: "Budget Items", key: "budget", color: "amber" },
];

export default function Dashboard() {

    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [staffCount, setStaffCount] = useState(0);
    const [guestsCount, setGuestsCount] = useState(0);
    const [budgetCount, setBudgetCount] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [evRes, stRes, guRes, buRes] = await Promise.all([
                    getEvents().catch(() => ({ data: [] })),
                    getStaff().catch(() => ({ data: [] })),
                    getGuests().catch(() => ({ data: [] })),
                    getBudget().catch(() => ({ data: [] }))
                ]);
                setEvents(evRes.data || []);
                setStaffCount((stRes.data || []).length);
                setGuestsCount((guRes.data || []).length);
                setBudgetCount((buRes.data || []).length);
            } catch {
                /* empty */
            }
        };
        fetchStats();
    }, []);

    const roleGreeting = {
        admin: "Welcome back, Admin! Here's your complete system overview.",
        organizer: "Hello! Manage your events and teams from here.",
        user: "Welcome! Browse available events below.",
    };

    const role = user?.role || "user";

    const getStatValue = (key) => {
        if (key === "events") return events.length;
        if (key === "staff") return staffCount;
        if (key === "guests") return guestsCount;
        if (key === "budget") return budgetCount;
        return "—";
    };

    return (
        <Layout>
            {/* Page header */}
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                        {roleGreeting[role] || "Welcome to Event Management"}
                    </p>
                </div>
                {(role === "admin" || role === "organizer") && (
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/events")}
                    >
                        🎪 View Events
                    </button>
                )}
            </div>

            {/* Stat cards – only for admin/organizer */}
            {(role === "admin" || role === "organizer") && (
                <div className="grid-4" style={{ marginBottom: "28px" }}>
                    {STAT_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="card-stat"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate("/" + card.key)}
                            title={`View all ${card.label}`}
                        >
                            <div className={`card-stat-icon ${card.color}`}>
                                {card.icon}
                            </div>
                            <div className="card-stat-info">
                                <h3>{getStatValue(card.key)}</h3>
                                <p>{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent events table */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700" }}>
                        {role === "user" ? "Available Events" : "Recent Events"}
                    </h3>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate("/events")}
                    >
                        View all →
                    </button>
                </div>

                <div className="data-table-wrapper" style={{ boxShadow: "none", border: "none" }}>
                    {events.length === 0 ? (
                        <div className="empty-state">
                            <span>🎪</span>
                            <p>No events yet</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Date</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.slice(0, 5).map((event) => (
                                    <tr key={event.id}>
                                        <td style={{ fontWeight: 600 }}>{event.name}</td>
                                        <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                            📅 {new Date(event.date).toLocaleDateString()}
                                        </td>
                                        <td>📍 {event.location}</td>
                                        <td style={{ color: "var(--text-secondary)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {event.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}