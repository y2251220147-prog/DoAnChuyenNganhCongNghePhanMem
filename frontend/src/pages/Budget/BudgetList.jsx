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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 32 }}>
                <div style={{ 
                    background: "var(--bg-card)", border: "1px solid var(--border-color)", 
                    borderRadius: 20, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📋</div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-primary)", lineHeight: 1.1 }}>{budgetItems.length}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>Hạng mục chi tiêu</div>
                    </div>
                </div>
                <div style={{ 
                    background: "var(--bg-card)", border: "1px solid #fde68a", 
                    borderRadius: 20, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20,
                    boxShadow: "0 10px 25px rgba(245,158,11,0.05)", background: "linear-gradient(135deg, var(--bg-card) 0%, #fffbeb 100%)"
                }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>💰</div>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#b45309", lineHeight: 1.1 }}>{formatVND(totalCost)}</div>
                        <div style={{ fontSize: 13, color: "#92400e", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>Tổng ngân sách đã chi</div>
                    </div>
                </div>
            </div>

            <div style={{ 
                background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-color)", 
                overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" 
            }}>
                {loading ? (
                    <div className="empty-state" style={{ padding: "80px 0" }}><span>⏳</span><p>Đang tổng hợp dữ liệu tài chính...</p></div>
                ) : budgetItems.length === 0 ? (
                    <div className="empty-state" style={{ padding: "80px 0" }}>
                        <span style={{ fontSize: 48, marginBottom: 16 }}>💸</span>
                        <p style={{ fontWeight: 600 }}>Chưa có bản ghi ngân sách nào được khởi tạo.</p>
                        {canManage && <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={handleAddClick}>Tạo khoản chi đầu tiên</button>}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24, width: 60 }}>#</th>
                                <th>Hạng mục chi tiêu</th>
                                <th>Sự kiện áp dụng</th>
                                <th style={{ textAlign: "right" }}>Số tiền dự toán</th>
                                {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {budgetItems.map((b, i) => (
                                <tr key={b.id} className="table-row-hover">
                                    <td style={{ color: "var(--text-muted)", paddingLeft: 24, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ fontSize: 18 }}>💼</div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{b.item}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", background: "rgba(99,102,241,0.08)", padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.15)" }}>
                                            🎯 {getEventName(b.event_id)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right", color: "var(--color-primary)", fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>
                                        {formatVND(b.cost)}
                                    </td>
                                    {canManage && (
                                        <td style={{ textAlign: "right", paddingRight: 20 }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleEditClick(b)} title="Chỉnh sửa" style={{ padding: 8, borderRadius: 10, color: "var(--color-primary)" }}>✏️</button>
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(b.id)} title="Xóa" style={{ padding: 8, borderRadius: 10, color: "#dc2626" }}>🗑️</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ background: "var(--bg-main)", borderTop: "2px solid var(--border-color)" }}>
                            <tr>
                                <th colSpan={3} style={{ textAlign: "right", padding: "20px 24px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Tổng cộng ngân sách:</th>
                                <th style={{ textAlign: "right", color: "#b45309", fontSize: "20px", fontWeight: 900, paddingRight: canManage ? "12px" : "24px" }}>
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
