import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import Pagination from "../../components/UI/Pagination";
import { AuthContext } from "../../context/AuthContext";
import {
    changeStatus, createEvent, deleteEvent,
    searchEvents, updateEvent
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

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [searchParams, setSearchParams] = useSearchParams();

    // ── Search & Filter State (Initialize from URL) ──────────
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all");
    const [filterType, setFilterType] = useState(searchParams.get("type") || "");
    const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
    const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

    // ── Pagination State ─────────────────────────────────────
    const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const isAdmin = user?.role === "admin";
    const canManage = user?.role === "admin" || user?.role === "organizer";

    const load = useCallback(async (currentPage = page) => {
        setLoading(true);
        try {
            const params = {
                search,
                status: filterStatus === "all" ? "" : filterStatus,
                event_type: filterType,
                date_from: dateFrom,
                date_to: dateTo,
                page: currentPage,
                limit
            };
            const r = await searchEvents(params);
            setEvents(r.data?.data || []);
            setTotalItems(r.data?.pagination?.total || 0);
            setTotalPages(r.data?.pagination?.totalPages || 1);
        }
        catch (err) {
            console.error("Load events error:", err);
        }
        finally { setLoading(false); }
    }, [search, filterStatus, filterType, dateFrom, dateTo, page]);

    // Debounce search & Update URL
    useEffect(() => {
        const handler = setTimeout(() => {
            // Update URL params
            const params = {};
            if (search) params.search = search;
            if (filterStatus !== "all") params.status = filterStatus;
            if (filterType) params.type = filterType;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            if (page > 1) params.page = page;
            setSearchParams(params, { replace: true });

            load(page);
        }, 500);
        return () => clearTimeout(handler);
    }, [search, filterStatus, filterType, dateFrom, dateTo, page, load, setSearchParams]);

    // Load khi đổi trang (Đã gộp vào useEffect trên)

    // ── Tạo / Cập nhật ───────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault(); setError(""); setSubmitting(true);
        try {
            if (editingId) await updateEvent(editingId, form);
            else await createEvent(form);
            setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null);
            load();
        } catch (err) { setError(err.response?.data?.message || "Thao tác thất bại"); }
        finally { setSubmitting(false); }
    };

    const openEdit = (ev) => {
        setForm({
            name: ev.name || "",
            description: ev.description || "",
            event_type: ev.event_type || "",
            start_date: ev.start_date?.slice(0, 16) || "",
            end_date: ev.end_date?.slice(0, 16) || "",
            venue_type: ev.venue_type || "offline",
            location: ev.location || "",
            capacity: ev.capacity || "",
            total_budget: ev.total_budget || "",
            status: ev.status || "draft",
        });
        setEditingId(ev.id); setError(""); setModalOpen(true);
    };

    // ── Xóa ──────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm("Xóa sự kiện này? Tất cả dữ liệu liên quan sẽ mất.")) return;
        try { await deleteEvent(id); setEvents(events.filter(e => e.id !== id)); }
        catch (err) { alert(err.response?.data?.message || "Xóa thất bại"); }
    };

    // ── Chuyển trạng thái workflow ────────────────────────────
    const handleChangeStatus = async (ev, newStatus) => {
        const label = STATUS_LABEL[newStatus];
        if (!window.confirm(`Chuyển trạng thái sang "${label}"?`)) return;
        try {
            await changeStatus(ev.id, newStatus);
            load();
        } catch (err) { alert(err.response?.data?.message || "Thất bại"); }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <Layout>
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h2>Sự kiện</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Tìm thấy {totalItems} sự kiện · {events.filter(e => e.status === "running").length} đang hiển thị
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(""); setModalOpen(true); }}>
                        + Tạo sự kiện
                    </button>
                )}
            </div>

            {/* ── Thống kê nhanh ── */}
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: "Bản nháp", status: "draft", icon: "📝", color: "#94a3b8" },
                    { label: "Chờ duyệt", status: "planning", icon: "🕐", color: "#f59e0b" },
                    { label: "Đã duyệt", status: "approved", icon: "✅", color: "#6366f1" },
                    { label: "Đang diễn ra", status: "running", icon: "🔥", color: "#10b981" },
                ].map(s => (
                    <div key={s.status} className="card-stat" style={{ cursor: "pointer" }}
                        onClick={() => setFilterStatus(s.status)}>
                        <div className="card-stat-icon" style={{ background: s.color + "22", fontSize: 20 }}>{s.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ color: s.color }}>{events.filter(e => e.status === s.status).length}</h3>
                            <p>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Bộ lọc ── */}
            <div className="card" style={{ marginBottom: 16, padding: "16px" }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 240px" }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Tìm kiếm</label>
                        <input className="form-control" placeholder="🔍 Tên, mô tả, địa điểm..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 150px" }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Trạng thái</label>
                        <select className="form-control"
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="all">Tất cả</option>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 150px" }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Loại</label>
                        <select className="form-control"
                            value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="">Tất cả loại</option>
                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Từ ngày</label>
                        <input type="date" className="form-control"
                            value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Đến ngày</label>
                        <input type="date" className="form-control"
                            value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>

                    <button className="btn btn-outline" onClick={() => {
                        setSearch(""); setFilterStatus("all"); setFilterType("");
                        setDateFrom(""); setDateTo(""); setPage(1);
                    }} style={{ height: 42 }}>
                        Đặt lại
                    </button>
                </div>
            </div>

            {/* ── Bảng sự kiện ── */}
            <div className="data-table-wrapper">
                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Đang tìm kiếm...</p></div>
                ) : events.length === 0 ? (
                    <div className="empty-state"><span>🎪</span><p>Không tìm thấy kết quả nào phù hợp.</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Tên sự kiện</th><th>Loại</th>
                                <th>Thời gian</th><th>Địa điểm</th>
                                <th>Trạng thái</th><th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev, i) => {
                                const wf = WORKFLOW[ev.status] || WORKFLOW.draft;
                                const nextS = wf.next;
                                return (
                                    <tr key={ev.id}>
                                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>🎪 {ev.name}</div>
                                            {ev.owner_name && (
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                                    👤 {ev.owner_name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                            {ev.event_type || "—"}
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                                📅 {fmtDate(ev.start_date)}
                                            </div>
                                            <div style={{ color: "var(--text-muted)" }}>
                                                → {fmtDate(ev.end_date)}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                            {ev.venue_type === "online" ? "🌐 Online" : `📍 ${ev.location || "—"}`}
                                        </td>
                                        <td>
                                            {/* Badge trạng thái + dropdown chuyển */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <StatusBadge status={ev.status} />
                                                {canManage && nextS.length > 0 && (
                                                    <select
                                                        className="form-control"
                                                        style={{ fontSize: 11, padding: "2px 6px", height: 26 }}
                                                        value=""
                                                        onChange={e => { if (e.target.value) handleChangeStatus(ev, e.target.value); }}>
                                                        <option value="">Chuyển →</option>
                                                        {nextS.map(s => (
                                                            <option key={s} value={s}
                                                                disabled={s === "approved" && !isAdmin}>
                                                                {STATUS_LABEL[s]}{s === "approved" && !isAdmin ? " (cần Admin)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button className="btn btn-outline btn-sm"
                                                    onClick={() => navigate(`/events/${ev.id}`)} title="Xem chi tiết">👁</button>
                                                {canManage && !["running", "completed", "cancelled", "approved"].includes(ev.status) && (
                                                <button className="btn btn-outline btn-sm"
                                                    onClick={() => openEdit(ev)} title="Chỉnh sửa">✎</button>
                                            )}
                                            {/* Chỉ xóa được khi ở draft/planning/cancelled — không được xóa khi approved/running/completed */}
                                            {canManage && !["approved", "running", "completed"].includes(ev.status) && (
                                                    <button className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(ev.id)} title="Xóa">🗑</button>
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

            {/* ── Pagination ── */}
            <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
            />

            {/* ── Modal Tạo / Chỉnh sửa ── */}
            <Modal
                title={editingId ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setError(""); }}>
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Thông tin cơ bản */}
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
                        letterSpacing: "0.08em", marginBottom: 10
                    }}>🧾 Thông tin cơ bản</div>

                    <div className="form-group">
                        <label>Tên sự kiện <span style={{ color: "red" }}>*</span></label>
                        <input className="form-control" placeholder="VD: Hội thảo AI 2026"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Loại sự kiện</label>
                            <select className="form-control" value={form.event_type}
                                onChange={e => setForm({ ...form, event_type: e.target.value })}>
                                <option value="">-- Chọn loại --</option>
                                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Hình thức</label>
                            <select className="form-control" value={form.venue_type}
                                onChange={e => setForm({ ...form, venue_type: e.target.value })}>
                                <option value="offline">🏢 Offline</option>
                                <option value="online">🌐 Online</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" rows="2" placeholder="Mô tả ngắn về sự kiện..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    {/* Thời gian */}
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
                        letterSpacing: "0.08em", margin: "14px 0 10px"
                    }}>⏰ Thời gian diễn ra</div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Ngày bắt đầu <span style={{ color: "red" }}>*</span></label>
                            <input type="datetime-local" className="form-control"
                                value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Ngày kết thúc <span style={{ color: "red" }}>*</span></label>
                            <input type="datetime-local" className="form-control"
                                value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                        </div>
                    </div>

                    {/* Địa điểm */}
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
                        letterSpacing: "0.08em", margin: "14px 0 10px"
                    }}>📍 Địa điểm</div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Địa chỉ / Link</label>
                            <input className="form-control" placeholder={form.venue_type === "online" ? "https://meet.google.com/..." : "123 Nguyễn Huệ, Q1"}
                                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Sức chứa (người)</label>
                            <input type="number" className="form-control" placeholder="200"
                                value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                        </div>
                    </div>

                    {/* Ngân sách */}
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
                        letterSpacing: "0.08em", margin: "14px 0 10px"
                    }}>💰 Ngân sách</div>

                    <div className="form-group">
                        <label>Tổng ngân sách dự kiến (VND)</label>
                        <input type="number" className="form-control" placeholder="50000000"
                            value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
                    </div>

                    {/* Ghi chú deadline */}
                    {!editingId && (
                        <div style={{
                            background: "rgba(99,102,241,0.07)", borderRadius: 8, padding: "10px 14px",
                            marginBottom: 14, fontSize: 12, color: "var(--text-secondary)"
                        }}>
                            💡 Sau khi tạo, hệ thống sẽ tự động tạo <strong>4 deadline nội bộ</strong> mặc định
                            (chốt concept, địa điểm, marketing, tổng duyệt) dựa trên ngày bắt đầu.
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}
                        disabled={submitting}>
                        {submitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Tạo sự kiện")}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}

// ── Component badge trạng thái ─────────────────────────────────
function StatusBadge({ status }) {
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
