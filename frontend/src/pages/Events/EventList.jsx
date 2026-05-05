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
import { getAllUsers } from "../../services/userService";
import { getDepartments } from "../../services/departmentService";
import { getVenues, getAllResources } from "../../services/venueService";
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
    organizer_id: "", department_id: "",
    venue_id: "", resources: [],
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
    const [users, setUsers] = useState([]);
    const [venues, setVenues] = useState([]);
    const [resourcesList, setResourcesList] = useState([]);
    const [departments, setDepartments] = useState([]);

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

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [uR, vR, rR, dR] = await Promise.all([
                    getAllUsers(),
                    getVenues(),
                    getAllResources(),
                    getDepartments()
                ]);
                setUsers(uR.data || []);
                setVenues(vR.data || []);
                setResourcesList(rR.data || []);
                setDepartments(dR.data || []);
            } catch (err) { console.error("Fetch initial data error:", err); }
        };
        fetchInitial();
    }, []);

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
            organizer_id: ev.organizer_id || "",
            department_id: ev.department_id || "",
            venue_id: ev.venue_id || "",
            resources: ev.resources || [],
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
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                        <span className="gradient-text">Sự kiện</span>
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>
                        Hiện có {totalItems} sự kiện trong hệ thống · {events.filter(e => e.status === "running").length} đang diễn ra sôi nổi
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary btn-lg" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(""); setModalOpen(true); }}>
                        ✨ Tạo sự kiện mới
                    </button>
                )}
            </div>

            {/* ── Thống kê nhanh ── */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
                {[
                    { label: "Bản nháp", status: "draft", icon: "📝", color: "#64748b" },
                    { label: "Lên kế hoạch", status: "planning", icon: "🗓️", color: "#f59e0b" },
                    { label: "Đã duyệt", status: "approved", icon: "✅", color: "#4f46e5" },
                    { label: "Đang diễn ra", status: "running", icon: "🔥", color: "#10b981" },
                ].map(s => (
                    <div key={s.status} className="card-stat" style={{ cursor: "pointer", border: filterStatus === s.status ? `2px solid ${s.color}` : "1px solid var(--border-color)" }}
                        onClick={() => setFilterStatus(s.status)}>
                        <div className="card-stat-icon" style={{ background: s.color + "15", color: s.color }}>{s.icon}</div>
                        <div className="card-stat-info">
                            <h3 style={{ color: s.color }}>{events.filter(e => e.status === s.status).length}</h3>
                            <p>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Bộ lọc ── */}
            <div className="card" style={{ marginBottom: 32, padding: "24px", border: "none", boxShadow: "var(--shadow-md)" }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: "2 1 300px" }}>
                        <label>Tìm kiếm thông minh</label>
                        <input className="form-control" style={{ background: "white" }} placeholder="🔍 Tên sự kiện, địa điểm hoặc mô tả..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 180px" }}>
                        <label>Trạng thái</label>
                        <select className="form-control" style={{ background: "white" }}
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="all">Tất cả trạng thái</option>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: "1 1 150px" }}>
                        <label>Khoảng ngày</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input type="date" className="form-control" style={{ background: "white" }}
                                value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            <span style={{ color: "var(--text-muted)" }}>→</span>
                            <input type="date" className="form-control" style={{ background: "white" }}
                                value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    </div>

                    <button className="btn btn-outline" onClick={() => {
                        setSearch(""); setFilterStatus("all"); setFilterType("");
                        setDateFrom(""); setDateTo(""); setPage(1);
                    }} style={{ height: 48, borderRadius: 12 }}>
                        🔄 Làm mới
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
                onClose={() => { setModalOpen(false); setError(""); }}
                maxWidth="1200px"
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }}>
                        
                        {/* Cột trái: Thông tin cơ bản & Thời gian */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ padding: 16, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
                                    <span style={{ fontSize: 20 }}>📝</span> THÔNG TIN CƠ BẢN
                                </div>
                                <div className="form-group">
                                    <label>Tên sự kiện <span style={{ color: "red" }}>*</span></label>
                                    <input className="form-control" placeholder="VD: Hội thảo AI 2026"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="grid-2" style={{ marginTop: 12 }}>
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
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Mô tả ngắn</label>
                                    <textarea className="form-control" rows="1" placeholder="Nhập mô tả sự kiện..."
                                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ padding: 16, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
                                    <span style={{ fontSize: 20 }}>⏰</span> THỜI GIAN & ĐỊA ĐIỂM
                                </div>
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
                                <div className="grid-2" style={{ marginTop: 12 }}>
                                    <div className="form-group">
                                        <label>{form.venue_type === "online" ? "Link họp trực tuyến" : "Địa điểm / Phòng"}</label>
                                        {form.venue_type === "offline" ? (
                                            <select 
                                                className="form-control"
                                                value={form.venue_id}
                                                onChange={e => {
                                                    const v = venues.find(vn => vn.id === parseInt(e.target.value));
                                                    setForm({ 
                                                        ...form, 
                                                        venue_id: e.target.value,
                                                        location: v ? v.name : "",
                                                        capacity: v ? v.capacity : form.capacity
                                                    });
                                                }}
                                            >
                                                <option value="">-- Chọn địa điểm --</option>
                                                {venues.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name} (Sức chứa: {v.capacity})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input className="form-control" placeholder="https://meet.google.com/..."
                                                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Sức chứa (người)</label>
                                        <input type="number" className="form-control" placeholder="200"
                                            value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} 
                                            readOnly={form.venue_type === "offline" && form.venue_id}
                                        />
                                    </div>
                                </div>

                                {/* ── CHỌN TÀI NGUYÊN (RESOURCES) ── */}
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
                                        📦 TÀI NGUYÊN & THIẾT BỊ 
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxHeight: 150, overflowY: "auto", padding: 10, background: "#f8fafc", borderRadius: 12 }}>
                                        {resourcesList.map(res => {
                                            const isChecked = form.resources.some(r => r.id === res.id);
                                            return (
                                                <label key={res.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 8, background: isChecked ? "#eff6ff" : "white", border: isChecked ? "1px solid #bfdbfe" : "1px solid #e2e8f0" }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked}
                                                        onChange={e => {
                                                            let newRes = [...form.resources];
                                                            if (e.target.checked) newRes.push({ id: res.id, resource_id: res.id, quantity: 1 });
                                                            else newRes = newRes.filter(r => r.id !== res.id);
                                                            setForm({ ...form, resources: newRes });
                                                        }}
                                                    />
                                                    <span>{res.name} <small style={{ color: "#94a3b8" }}>({res.category})</small></span>
                                                </label>
                                            );
                                        })}
                                        {resourcesList.length === 0 && <span style={{ fontSize: 11, color: "#94a3b8" }}>Chưa có tài nguyên nào trong kho.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Ngân sách & Phân công */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ padding: 16, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
                                    <span style={{ fontSize: 20 }}>💰</span> NGÂN SÁCH DỰ KIẾN
                                </div>
                                <div className="form-group">
                                    <label>Tổng ngân sách đầu tư (VND)</label>
                                    <div style={{ position: "relative" }}>
                                        <input type="number" className="form-control" style={{ paddingLeft: 40 }}
                                            placeholder="50000000"
                                            value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
                                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>₫</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, marginBottom: 0 }}>
                                        Để trống nếu chưa có dự toán cụ thể.
                                    </p>
                                </div>
                            </div>

                            <div style={{ padding: 16, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
                                    <span style={{ fontSize: 20 }}>👥</span> PHÂN CÔNG SỰ KIỆN
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Người tổ chức (Organizer)</label>
                                        <select className="form-control" value={form.organizer_id}
                                            onChange={e => setForm({ ...form, organizer_id: e.target.value })}>
                                            <option value="">-- Chọn nhân sự --</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>🏢 Phòng ban đảm nhiệm <span style={{ color: "red" }}>*</span></label>
                                        <select className="form-control" value={form.department_id}
                                            onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                                            <option value="">-- Chọn phòng ban --</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}{d.manager_name ? ` (TP: ${d.manager_name})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <small style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                            Phòng ban này sẽ chịu trách nhiệm chính cho sự kiện
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Hint Removed to save space */}
                        </div>
                    </div>

                    <div style={{ 
                        padding: "12px 0 0", borderTop: "1px solid #f1f5f9",
                        display: "flex", justifyContent: "flex-end", gap: 12
                    }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} style={{ minWidth: 120, borderRadius: 12 }}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: 180, borderRadius: 12, padding: "12px 24px" }} disabled={submitting}>
                            {submitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "🚀 Tạo sự kiện ngay")}
                        </button>
                    </div>
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
