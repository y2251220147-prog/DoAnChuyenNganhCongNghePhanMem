import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { createBudget, deleteBudget, getBudget, updateBudget } from "../../services/budgetService";
import "../../styles/global.css";

export default function BudgetList() {

    const [budgetItems, setBudgetItems] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ event_id: "", item: "", cost: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { user } = useContext(AuthContext);
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const loadData = async () => {
        setLoading(true);
        try {
            const [bRes, eRes] = await Promise.all([getBudget(), getEvents()]);
            setBudgetItems(bRes.data || []);
            setEvents(eRes.data || []);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this budget item?")) return;
        try {
            await deleteBudget(id);
            setBudgetItems(budgetItems.filter(b => b.id !== id));
        } catch { alert("Delete failed"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!editingId && !formData.event_id) return setError("Please select an event.");
        setSubmitting(true);
        try {
            if (editingId) {
                await updateBudget(editingId, { item: formData.item, cost: formData.cost });
            } else {
                await createBudget(formData);
            }
            setModalOpen(false);
            setFormData(prev => ({ ...prev, item: "", cost: "" }));
            setEditingId(null);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || (editingId ? "Update failed" : "Create failed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (b) => {
        setFormData({ event_id: b.event_id, item: b.item, cost: b.cost });
        setEditingId(b.id);
        setError("");
        setModalOpen(true);
    };

    const handleAddClick = () => {
        setFormData({ event_id: events[0]?.id || "", item: "", cost: "" });
        setEditingId(null);
        setError("");
        setModalOpen(true);
    };

    const totalCost = budgetItems.reduce((sum, item) => sum + Number(item.cost), 0);
    const formatVND = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    const getEventName = (eventId) => {
        const ev = events.find(e => e.id === eventId);
        return ev ? ev.name : `Event #${eventId}`;
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Event Budget</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Track expenses and financial planning
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        + Add Expense
                    </button>
                )}
            </div>

            <div className="grid-2" style={{ marginBottom: "24px" }}>
                <div className="card-stat">
                    <div className="card-stat-icon indigo">📋</div>
                    <div className="card-stat-info">
                        <h3>{budgetItems.length}</h3>
                        <p>Total Items</p>
                    </div>
                </div>
                <div className="card-stat">
                    <div className="card-stat-icon amber">💰</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: "18px" }}>{formatVND(totalCost)}</h3>
                        <p>Total Cost</p>
                    </div>
                </div>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading budget...</p></div>
                ) : budgetItems.length === 0 ? (
                    <div className="empty-state">
                        <span>💸</span>
                        <p>No budget records found{canManage ? ". Add expenses above!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item Name</th>
                                <th>Event</th>
                                <th style={{ textAlign: "right" }}>Cost (VND)</th>
                                {canManage && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {budgetItems.map((b, i) => (
                                <tr key={b.id}>
                                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>💼 {b.item}</td>
                                    <td>
                                        <span className="badge badge-default">
                                            {getEventName(b.event_id)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right", color: "var(--color-primary-dark)", fontWeight: 600 }}>
                                        {formatVND(b.cost)}
                                    </td>
                                    {canManage && (
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleEditClick(b)}
                                                    title="Edit"
                                                >✎</button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(b.id)}
                                                    title="Delete"
                                                >🗑</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colSpan={canManage ? 3 : 3} style={{ textAlign: "right" }}>Total:</th>
                                <th style={{ textAlign: "right", color: "var(--color-primary)", fontSize: "15px" }}>
                                    {formatVND(totalCost)}
                                </th>
                                {canManage && <th></th>}
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            <Modal
                title={editingId ? "Edit Expense" : "Add Expense"}
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setError(""); }}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}
                    {!editingId && (
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
                    )}
                    <div className="form-group">
                        <label>Item Name</label>
                        <input
                            className="form-control"
                            placeholder="e.g. Sound system rental"
                            value={formData.item}
                            onChange={e => setFormData({ ...formData, item: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Cost (VND)</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 5000000"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                            required
                            min="0"
                            step="1000"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={submitting}
                    >
                        {submitting ? "Saving..." : (editingId ? "Save Changes" : "Add Expense")}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
