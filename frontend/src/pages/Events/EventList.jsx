import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import {
    changeStatus, createEvent, deleteEvent,
    getEvents, updateEvent
} from "../../services/eventService";
import "../../styles/global.css";

// ── Workflow config ───────────────────────────────────────────
const WORKFLOW = {
    draft: { label: "Bản nháp", cls: "badge-draft", next: ["planning", "cancelled"] },
    planning: { label: "Lên kế hoạch", cls: "badge-planning", next: ["approved", "cancelled"] },
    approved: { label: "Đã duyệt", cls: "badge-approved", next: ["running", "cancelled"] },
    running: { label: "Đang diễn ra", cls: "badge-running", next: ["completed", "cancelled"] },
    completed: { label: "Hoàn thành", cls: "badge-completed", next: [] },
    cancelled: { label: "Đã hủy", cls: "badge-cancelled", next: [] },
};

const STATUS_LABEL = {
    draft: "Bản nháp",
    planning: "Lên kế hoạch",
    approved: "Đã duyệt",
    running: "Đang diễn ra",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
};

const EVENT_TYPES = [
    "Hội thảo", "Hội nghị", "Tiệc nội bộ", "Team building",
    "Ra mắt sản phẩm", "Đào tạo", "Khác"
];

const EMPTY_FORM = {
    name: "", description: "", event_type: "",
    start_date: "", end_date: "",
    venue_type: "offline", location: "", capacity: "",
    total_budget: "", status: "draft",
};

export default function EventList() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [collection, setCollection] = useState([]);
    const [isSyncing, setIsSyncing] = useState(true);
    const [view, setView] = useState({ modal: false, editId: null, busy: false });
    const [form, setForm] = useState(EMPTY_FORM);
    const [errorMsg, setErrorMsg] = useState("");
    const [query, setQuery] = useState({ text: "", status: "all" });

    const isPrivileged = user?.role === "admin" || user?.role === "organizer";

    const fetchEvents = async () => {
        setIsSyncing(true);
        try {
            const response = await getEvents();
            setCollection(response.data || []);
        } catch (err) {
            console.error("Failed to fetch events", err);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setView(prev => ({ ...prev, busy: true }));
        try {
            if (view.editId) await updateEvent(view.editId, form);
            else await createEvent(form);
            
            setView({ modal: false, editId: null, busy: false });
            setForm(EMPTY_FORM);
            fetchEvents();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Đã xảy ra lỗi trong quá trình lưu");
        } finally {
            setView(prev => ({ ...prev, busy: false }));
        }
    };

    const triggerEdit = (item) => {
        setForm({
            name: item.name || "",
            description: item.description || "",
            event_type: item.event_type || "",
            start_date: item.start_date?.slice(0, 16) || "",
            end_date: item.end_date?.slice(0, 16) || "",
            venue_type: item.venue_type || "offline",
            location: item.location || "",
            capacity: item.capacity || "",
            total_budget: item.total_budget || "",
            status: item.status || "draft",
        });
        setView({ modal: true, editId: item.id, busy: false });
        setErrorMsg("");
    };

    const confirmDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) return;
        try {
            await deleteEvent(id);
            setCollection(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Xóa không thành công");
        }
    };

    const updateWorkflowStatus = async (item, targetStatus) => {
        const statusText = STATUS_LABEL[targetStatus];
        if (!window.confirm(`Chuyển trạng thái sang "${statusText}"?`)) return;
        try {
            await changeStatus(item.id, targetStatus);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.message || "Cập nhật trạng thái thất bại");
        }
    };

    const displayedItems = collection.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(query.text.toLowerCase()) ||
            (item.location || "").toLowerCase().includes(query.text.toLowerCase());
        const matchesFilter = query.status === "all" || item.status === query.status;
        return matchesSearch && matchesFilter;
    });

    const formatShortDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' }) : "—";

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Hệ thống Sự kiện</h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                        Quản lý <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{collection.length}</span> chiến dịch sự kiện của bạn
                    </p>
                </div>
                {isPrivileged && (
                    <button className="btn btn-primary" 
                        style={{ borderRadius: 10, padding: "10px 20px", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
                        onClick={() => { setForm(EMPTY_FORM); setView({ modal: true, editId: null, busy: false }); setErrorMsg(""); }}>
                        <span style={{ marginRight: 8 }}>+</span> Tạo sự kiện mới
                    </button>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid-4" style={{ marginBottom: 28, gap: 16 }}>
                {[
                    { label: "Bản thảo", key: "draft", icon: "📝", color: "#64748b" },
                    { label: "Đang lập kế hoạch", key: "planning", icon: "🗓️", color: "#f59e0b" },
                    { label: "Đã phê duyệt", key: "approved", icon: "✔️", color: "#6366f1" },
                    { label: "Đang diễn ra", key: "running", icon: "🚀", color: "#10b981" },
                ].map(stat => (
                    <div key={stat.key} className="card-stat" 
                        style={{ 
                            cursor: "pointer", 
                            transition: "all 0.2s ease",
                            border: query.status === stat.key ? `1.5px solid ${stat.color}` : "1.5px solid transparent"
                        }}
                        onClick={() => setQuery(prev => ({ ...prev, status: prev.status === stat.key ? "all" : stat.key }))}>
                        <div className="card-stat-icon" style={{ background: stat.color + "15", color: stat.color }}>{stat.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ fontSize: 22, fontWeight: 800 }}>{collection.filter(i => i.status === stat.key).length}</h3>
                            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div style={{ 
                display: "flex", gap: 12, marginBottom: 20, padding: "12px", 
                background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)",
                borderRadius: 12, border: "1px solid var(--border-color)"
            }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
                    <input className="form-control" 
                        style={{ paddingLeft: 38, borderRadius: 10, border: "1px solid #e2e8f0" }}
                        placeholder="Tìm kiếm sự kiện, địa điểm..."
                        value={query.text} onChange={e => setQuery({ ...query, text: e.target.value })} />
                </div>
                <select className="form-control" 
                    style={{ maxWidth: 200, borderRadius: 10, border: "1px solid #e2e8f0" }}
                    value={query.status} onChange={e => setQuery({ ...query, status: e.target.value })}>
                    <option value="all">Mọi trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                </select>
            </div>

            {/* Main Content Area */}
            <div className="data-table-wrapper" style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                {isSyncing ? (
                    <div className="empty-state" style={{ padding: 60 }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: "3px solid #f3f3f3", borderTop: "3px solid var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}></div>
                        <p style={{ fontWeight: 600 }}>Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="empty-state" style={{ padding: 80 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🍃</div>
                        <p style={{ fontSize: 16, color: "var(--text-muted)" }}>Không tìm thấy sự kiện nào phù hợp</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ width: 50 }}>#</th>
                                <th>Thông tin sự kiện</th>
                                <th>Phân loại</th>
                                <th>Lịch trình</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "right" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedItems.map((item, idx) => {
                                const flow = WORKFLOW[item.status] || WORKFLOW.draft;
                                return (
                                    <tr key={item.id} style={{ transition: "background 0.2s" }}>
                                        <td style={{ color: "#94a3b8", fontWeight: 600 }}>{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{item.name}</div>
                                                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>ID: EV-{item.id} • {item.owner_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, fontWeight: 600, color: "#475569" }}>
                                                {item.event_type || "Chưa loại"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{formatShortDate(item.start_date)}</span>
                                                <span style={{ color: "#cbd5e1" }}>→</span>
                                                <span style={{ color: "#64748b" }}>{formatShortDate(item.end_date)}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: "#475569" }}>
                                            {item.venue_type === "online" ? "🌐 Trực tuyến" : `📍 ${item.location || "—"}`}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                <StatusBadge status={item.status} />
                                                {isPrivileged && flow.next.length > 0 && (
                                                    <div style={{ position: "relative" }}>
                                                        <select
                                                            className="form-control"
                                                            style={{ fontSize: 10, padding: "1px 4px", height: 22, background: "#f8fafc" }}
                                                            value=""
                                                            onChange={e => e.target.value && updateWorkflowStatus(item, e.target.value)}>
                                                            <option value="">Chuyển tiếp...</option>
                                                            {flow.next.map(s => (
                                                                <option key={s} value={s} disabled={s === "approved" && user?.role !== "admin"}>
                                                                    {STATUS_LABEL[s]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                                <button className="btn btn-outline btn-sm" style={{ padding: "6px" }}
                                                    onClick={() => navigate(`/events/${item.id}`)}>👁️</button>
                                                {isPrivileged && !["running", "completed", "cancelled", "approved"].includes(item.status) && (
                                                    <button className="btn btn-outline btn-sm" style={{ padding: "6px" }}
                                                        onClick={() => triggerEdit(item)}>✏️</button>
                                                )}
                                                {isPrivileged && !["approved", "running", "completed"].includes(item.status) && (
                                                    <button className="btn btn-danger btn-sm" style={{ padding: "6px" }}
                                                        onClick={() => confirmDelete(item.id)}>🗑️</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Create/Edit */}
            <Modal
                title={view.editId ? "Cập nhật chiến dịch" : "Khởi tạo chiến dịch mới"}
                isOpen={view.modal}
                onClose={() => setView({ ...view, modal: false })}>
                <form onSubmit={handleSave} style={{ padding: "4px 0" }}>
                    {errorMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errorMsg}</div>}

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Tên sự kiện <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="form-control" style={{ borderRadius: 8 }} placeholder="Nhập tiêu đề sự kiện..."
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>

                    <div className="grid-2" style={{ gap: 16, marginBottom: 18 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Phân loại</label>
                            <select className="form-control" style={{ borderRadius: 8 }} value={form.event_type}
                                onChange={e => setForm({ ...form, event_type: e.target.value })}>
                                <option value="">-- Chọn loại --</option>
                                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Hình thức</label>
                            <select className="form-control" style={{ borderRadius: 8 }} value={form.venue_type}
                                onChange={e => setForm({ ...form, venue_type: e.target.value })}>
                                <option value="offline">🏢 Trực tiếp</option>
                                <option value="online">🌐 Trực tuyến</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Mô tả chi tiết</label>
                        <textarea className="form-control" style={{ borderRadius: 8, minHeight: 80 }} placeholder="Ghi chú thêm về mục đích, nội dung..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="grid-2" style={{ gap: 16, marginBottom: 18 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Bắt đầu <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="datetime-local" className="form-control" style={{ borderRadius: 8 }}
                                value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Kết thúc <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="datetime-local" className="form-control" style={{ borderRadius: 8 }}
                                value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                        </div>
                    </div>

                    <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Vị trí / Liên kết</label>
                            <input className="form-control" style={{ borderRadius: 8 }} placeholder={form.venue_type === "online" ? "https://link..." : "Số 1, Lê Lợi..."}
                                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Số lượng khách</label>
                            <input type="number" className="form-control" style={{ borderRadius: 8 }} placeholder="Vd: 500"
                                value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Ngân sách dự tính (VND)</label>
                        <input type="number" className="form-control" style={{ borderRadius: 8 }} placeholder="Nhập số tiền..."
                            value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
                    </div>

                    <button type="submit" className="btn btn-primary" 
                        style={{ width: "100%", padding: "12px", borderRadius: 10, fontWeight: 700 }}
                        disabled={view.busy}>
                        {view.busy ? "Đang xử lý dữ liệu..." : (view.editId ? "Cập nhật ngay" : "Khởi tạo sự kiện")}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}

function StatusBadge({ status }) {
    const config = {
        draft: { label: "Bản nháp", bg: "#f1f5f9", text: "#64748b" },
        planning: { label: "Kế hoạch", bg: "#fffbeb", text: "#b45309" },
        approved: { label: "Đã duyệt", bg: "#eef2ff", text: "#4338ca" },
        running: { label: "Đang chạy", bg: "#ecfdf5", text: "#047857" },
        completed: { label: "Hoàn tất", bg: "#eff6ff", text: "#1d4ed8" },
        cancelled: { label: "Đã hủy", bg: "#fff1f1", text: "#b91c1c" },
    }[status] || { label: status, bg: "#f1f5f9", text: "#64748b" };

    return (
        <span style={{
            display: "inline-flex", padding: "2px 8px", borderRadius: 6,
            fontSize: 10, fontWeight: 800, textTransform: "uppercase",
            background: config.bg, color: config.text, border: `1px solid ${config.text}20`
        }}>
            {config.label}
        </span>
    );
}
