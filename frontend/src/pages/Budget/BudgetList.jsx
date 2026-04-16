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
                    <h2 className="gradient-text">💰 Ngân sách & Chi phí</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Theo dõi dòng tiền, hoạch định ngân sách và quản lý chi tiêu chi tiết cho từng sự kiện.
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={handleAddClick} style={{ borderRadius: 12, padding: "10px 24px" }}>
                        + Thêm khoản chi mới
                    </button>
                )}
            </div>

            <div className="grid-2" style={{ marginBottom: "28px", gap: "24px" }}>
                <div className="card-stat" style={{ background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0" }}>
                    <div className="card-stat-icon indigo" style={{ borderRadius: 14 }}>📋</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 24, fontWeight: 800 }}>{budgetItems.length}</h3>
                        <p style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>Hạng mục chi tiêu</p>
                    </div>
                </div>
                <div className="card-stat" style={{ background: "linear-gradient(135deg, #fff 0%, #fffbeb 100%)", border: "1px solid #fde68a" }}>
                    <div className="card-stat-icon amber" style={{ borderRadius: 14 }}>💰</div>
                    <div className="card-stat-info">
                        <h3 style={{ fontSize: 24, fontWeight: 800, color: "#b45309" }}>{formatVND(totalCost)}</h3>
                        <p style={{ fontWeight: 600, color: "#92400e", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>Tổng ngân sách đã chi</p>
                    </div>
                </div>
            </div>

            <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tải dữ liệu...</p></div>
                ) : budgetItems.length === 0 ? (
                    <div className="empty-state">
                        <span>💸</span>
                        <p>Chưa có bản ghi ngân sách nào{canManage ? ". Hãy thêm chi phí ngay!" : "."}</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>#</th>
                                <th>Hạng mục chi tiêu</th>
                                <th>Sự kiện liên quan</th>
                                <th style={{ textAlign: "right" }}>Số tiền (VND)</th>
                                {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {budgetItems.map((b, i) => (
                                <tr key={b.id}>
                                    <td style={{ color: "var(--text-muted)", paddingLeft: 24 }}>{String(i + 1).padStart(2, '0')}</td>
                                    <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>💼 {b.item}</td>
                                    <td>
                                        <span className="badge badge-default" style={{ borderRadius: 6, fontWeight: 600 }}>
                                            {getEventName(b.event_id)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right", color: "var(--color-primary)", fontWeight: 800, fontSize: 15 }}>
                                        {formatVND(b.cost)}
                                    </td>
                                    {canManage && (
                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                            <div className="actions" style={{ justifyContent: "flex-end" }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => handleEditClick(b)} title="Chỉnh sửa" style={{ borderRadius: 8 }}>✎</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)} title="Xóa" style={{ borderRadius: 8 }}>🗑</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ background: "#f8fafc" }}>
                            <tr>
                                <th colSpan={3} style={{ textAlign: "right", padding: "16px 24px", fontWeight: 700, fontSize: 13, textTransform: "uppercase", color: "var(--text-secondary)" }}>Tổng cộng:</th>
                                <th style={{ textAlign: "right", color: "var(--color-primary)", fontSize: "18px", fontWeight: 900, paddingRight: canManage ? "12px" : "24px" }}>
                                    {formatVND(totalCost)}
                                </th>
                                {canManage && <th style={{ paddingRight: 24 }}></th>}
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            <Modal
                title={editingId ? "Chỉnh sửa khoản chi" : "Thêm khoản chi mới"}
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setError(""); }}
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {error && <div className="alert alert-error">{error}</div>}
                    {!editingId && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Sự kiện áp dụng</label>
                            <select
                                className="form-control"
                                value={formData.event_id}
                                onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                                required
                            >
                                <option value="">-- Chọn sự kiện trong danh sách --</option>
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Tên hạng mục / Khoản chi</label>
                        <input
                            className="form-control"
                            placeholder="VD: Thuê âm thanh, trang trí, tea-break..."
                            value={formData.item}
                            onChange={e => setFormData({ ...formData, item: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Số tiền dự toán (VND)</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="VD: 5000000"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                            required
                            min="0"
                            step="1000"
                        />
                    </div>
                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} style={{ borderRadius: 12, padding: "10px 24px" }}>Hủy</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ borderRadius: 12, padding: "10px 32px" }}
                            disabled={submitting}
                        >
                            {submitting ? "Đang xử lý..." : (editingId ? "Lưu thay đổi" : "✅ Xác nhận thêm chi phí")}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
