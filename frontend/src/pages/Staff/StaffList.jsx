import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { assignStaff, getStaff, removeStaff } from "../../services/staffService";
import { getUsers } from "../../services/userService";
import "../../styles/global.css";

const ROLE_BADGE = {
    manager: "badge badge-admin",
    marketing: "badge badge-warning",
    technical: "badge badge-organizer",
    support: "badge badge-user",
    volunteer: "badge badge-default",
};

export default function StaffList() {

    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ event_id: "", user_id: "", role: "volunteer" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffRes, usersRes, eventsRes] = await Promise.all([
                getStaff(), getUsers(), getEvents()
            ]);
            setStaff(staffRes.data || []);
            setUsers(usersRes.data || []);
            setEvents(eventsRes.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this staff member?")) return;
        try {
            await removeStaff(id);
            setStaff(staff.filter(s => s.id !== id));
        } catch { alert("Remove failed"); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.event_id) return setError("Please select an event.");
        if (!formData.user_id) return setError("Please select a user.");
        setSubmitting(true);
        try {
            await assignStaff(formData);
            setModalOpen(false);
            setFormData(prev => ({ ...prev, user_id: "", role: "volunteer" }));
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Assignment failed");
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
                    <h2>Staff</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Team members assigned to events
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                        + Assign Staff
                    </button>
                )}
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading staff...</p></div>
                ) : staff.length === 0 ? (
                    <div className="empty-state">
                        <span>👥</span>
                        <p>No staff assigned yet{canManage ? ". Assign staff above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Event</th>
                                <th>Role</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s, i) => {
                                const matchedUser = users.find(u => u.id === s.user_id);
                                return (
                                    <tr key={s.id}>
                                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            👤 {s.user_name || (matchedUser ? matchedUser.name : `User #${s.user_id}`)}
                                        </td>
                                        <td>
                                            <span className="badge badge-default">
                                                {getEventName(s.event_id)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={ROLE_BADGE[s.role] || "badge badge-default"}>
                                                {s.role || "—"}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className="actions">
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(s.id)}
                                                        title="Remove Staff"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal title="Assign Staff to Event" isOpen={isModalOpen} onClose={() => { setModalOpen(false); setError(""); }}>
                <form onSubmit={handleAssign}>
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
                        <label>Select User</label>
                        <select
                            className="form-control"
                            value={formData.user_id}
                            onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                            required
                        >
                            <option value="">-- Choose User --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Assigned Role</label>
                        <select
                            className="form-control"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="manager">Manager</option>
                            <option value="marketing">Marketing</option>
                            <option value="technical">Technical</option>
                            <option value="support">Support</option>
                            <option value="volunteer">Volunteer</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={submitting}
                    >
                        {submitting ? "Assigning..." : "Assign Staff"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
