import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { createGuest, deleteGuest, getGuests } from "../../services/guestService";
import "../../styles/global.css";

export default function GuestList() {

    const [guests, setGuests] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", name: "", email: "", phone: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const load = async () => {
        setLoading(true);
        try {
            const [gRes, eRes] = await Promise.all([getGuests(), getEvents()]);
            setGuests(gRes.data || []);
            setEvents(eRes.data || []);
            if (eRes.data?.length > 0 && !formData.event_id) {
                setFormData(prev => ({ ...prev, event_id: eRes.data[0].id }));
            }
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this guest?")) return;
        try {
            await deleteGuest(id);
            setGuests(guests.filter(g => g.id !== id));
        } catch { alert("Delete failed"); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.event_id) return setError("Please select an event.");
        setSubmitting(true);
        try {
            await createGuest(formData);
            setModalOpen(false);
            setFormData(prev => ({ ...prev, name: "", email: "", phone: "" }));
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Create failed");
        } finally {
            setSubmitting(false);
        }
    };

    const getEventName = (eventId) => {
        const ev = events.find(e => e.id === eventId);
        return ev ? ev.name : `Event #${eventId}`;
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Guests</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Manage guest list for events
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                        + Add Guest
                    </button>
                )}
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading guests...</p></div>
                ) : guests.length === 0 ? (
                    <div className="empty-state">
                        <span>🎟️</span>
                        <p>No guests found{canManage ? ". Add guests above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Event</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {guests.map((g, i) => (
                                <tr key={g.id}>
                                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>🎟️ {g.name}</td>
                                    <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                    <td>{g.phone || "—"}</td>
                                    <td>
                                        <span className="badge badge-default">
                                            {getEventName(g.event_id)}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(g.id)}
                                                    title="Delete Guest"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="Add New Guest" isOpen={isModalOpen} onClose={() => { setModalOpen(false); setError(""); }}>
                <form onSubmit={handleCreate}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group">
                        <label>Event</label>
                        <select
                            className="form-control"
                            value={formData.event_id}
                            onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select Event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            className="form-control"
                            placeholder="Nguyen Van A"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="guest@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone (Optional)</label>
                        <input
                            type="tel"
                            className="form-control"
                            placeholder="0912 345 678"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={submitting}
                    >
                        {submitting ? "Adding..." : "Add Guest"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
