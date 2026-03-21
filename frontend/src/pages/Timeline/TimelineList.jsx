import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { createTimeline, deleteTimeline, getTimeline } from "../../services/timelineService";
import "../../styles/global.css";

export default function TimelineList() {

    const [timeline, setTimeline] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", title: "", start_time: "", end_time: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [tRes, eRes] = await Promise.all([getTimeline(), getEvents()]);
            setTimeline(tRes.data || []);
            setEvents(eRes.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this milestone?")) return;
        try {
            await deleteTimeline(id);
            setTimeline(timeline.filter(t => t.id !== id));
        } catch { alert("Delete failed"); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.event_id) return setError("Please select an event.");
        setSubmitting(true);
        try {
            await createTimeline(formData);
            setModalOpen(false);
            setFormData(prev => ({ ...prev, title: "", start_time: "", end_time: "", description: "" }));
            loadData();
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
                    <h2>Event Timeline</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Schedule and milestones for events
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                        + Add Milestone
                    </button>
                )}
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading timeline...</p></div>
                ) : timeline.length === 0 ? (
                    <div className="empty-state">
                        <span>📅</span>
                        <p>No timeline events yet{canManage ? ". Add one above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Milestone</th>
                                <th>Event</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {timeline.map((t, i) => (
                                <tr key={t.id}>
                                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>📌 {t.title}</td>
                                    <td>
                                        <span className="badge badge-default">
                                            {getEventName(t.event_id)}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                        🕒 {new Date(t.start_time).toLocaleString()}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {t.end_time ? new Date(t.end_time).toLocaleString() : "—"}
                                    </td>
                                    {canManage && (
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(t.id)}
                                                    title="Delete Milestone"
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

            <Modal title="Add Milestone" isOpen={isModalOpen} onClose={() => { setModalOpen(false); setError(""); }}>
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
                        <label>Milestone Title</label>
                        <input
                            className="form-control"
                            placeholder="Opening ceremony"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Start Time</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Time</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            className="form-control"
                            rows="2"
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
                        {submitting ? "Adding..." : "Add Milestone"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
