import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { createEvent, deleteEvent, getEvents, updateEvent } from "../../services/eventService";
import "../../styles/global.css";

export default function EventList() {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: "", date: "", location: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getEvents();
            setEvents(res.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event? All related data will be lost.")) return;
        try {
            await deleteEvent(id);
            setEvents(events.filter(e => e.id !== id));
        } catch { alert("Delete failed"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            if (editingId) {
                await updateEvent(editingId, formData);
            } else {
                await createEvent(formData);
            }
            setModalOpen(false);
            setFormData({ name: "", date: "", location: "", description: "" });
            setEditingId(null);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || (editingId ? "Update failed" : "Create failed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (ev) => {
        setFormData({
            name: ev.name,
            date: ev.date?.slice(0, 10) || "",
            location: ev.location,
            description: ev.description || ""
        });
        setEditingId(ev.id);
        setError("");
        setModalOpen(true);
    };

    const handleAddClick = () => {
        setFormData({ name: "", date: "", location: "", description: "" });
        setEditingId(null);
        setError("");
        setModalOpen(true);
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Events</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Manage all your events in one place
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        + Create Event
                    </button>
                )}
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading events...</p></div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <span>🎪</span>
                        <p>No events found{canManage ? ". Create one above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Event Name</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Description</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((e, i) => (
                                <tr key={e.id}>
                                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>🎪 {e.name}</td>
                                    <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                        📅 {new Date(e.date).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>📍 {e.location}</td>
                                    <td style={{ color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {e.description || "—"}
                                    </td>
                                    {canManage && (
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleEditClick(e)}
                                                    title="Edit Event"
                                                >✎</button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(e.id)}
                                                    title="Delete Event"
                                                >🗑</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                title={editingId ? "Edit Event" : "Create New Event"}
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setError(""); }}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group">
                        <label>Event Name</label>
                        <input
                            className="form-control"
                            placeholder="e.g. Annual Tech Conference 2025"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input
                            className="form-control"
                            placeholder="e.g. Hanoi Convention Center"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Brief description of the event..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={submitting}
                    >
                        {submitting ? "Saving..." : (editingId ? "Save Changes" : "Create Event")}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
