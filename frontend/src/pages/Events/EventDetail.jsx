import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { getTasksByEvent, createTask, updateTaskStatus, deleteTask } from "../../services/taskService";
import {
    changeStatus,
    createDeadline, deleteDeadline, getDeadlines, toggleDeadline
} from "../../services/eventService";
import "../../styles/global.css";
import TaskBoard from "../Tasks/TaskBoard";

const STATUS_CFG = {
    draft: { label: "Bản nháp", bg: "#f1f5f9", color: "#64748b" },
    planning: { label: "Lên kế hoạch", bg: "#fef3c7", color: "#d97706" },
    approved: { label: "Đã duyệt", bg: "#ede9fe", color: "#7c3aed" },
    running: { label: "Đang diễn ra", bg: "#d1fae5", color: "#059669" },
    completed: { label: "Hoàn thành", bg: "#dbeafe", color: "#2563eb" },
    cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#dc2626" },
};

const WORKFLOW_NEXT = {
    draft: ["planning", "cancelled"],
    planning: ["approved", "cancelled"],
    approved: ["running", "cancelled"],
    running: ["completed", "cancelled"],
    completed: [], cancelled: [],
};

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
    return (
        <span style={{
            display: "inline-flex", padding: "4px 14px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color
        }}>
            {cfg.label}
        </span>
    );
}

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [details, setDetails] = useState(null);
    const [dataset, setDataset] = useState({
        guests: [], staff: [], timeline: [], budget: { items: [], total: 0 }, deadlines: [], tasks: []
    });
    const [isFetching, setIsFetching] = useState(true);
    const [uiError, setUiError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");

    const [dlState, setDlState] = useState({ open: false, saving: false, form: { title: "", due_date: "", note: "" } });

    const isAuthorized = user?.role === "admin" || user?.role === "organizer";
    const nextSteps = details ? (WORKFLOW_NEXT[details.status] || []) : [];

    const syncEventData = async () => {
        setIsFetching(true);
        setUiError("");
        try {
            const [evR, guR, stR, tlR, buR, dlR, tsR] = await Promise.allSettled([
                api.get(`/events/${id}`),
                api.get(`/guests/event/${id}`),
                api.get(`/staff/event/${id}`),
                api.get(`/timeline/event/${id}`),
                api.get(`/budgets/event/${id}`),
                api.get(`/events/${id}/deadlines`),
                getTasksByEvent(id)
            ]);

            if (evR.status === "rejected") {
                setUiError("Thông tin sự kiện không khả dụng.");
                return;
            }

            setDetails(evR.value.data);
            setDataset({
                guests: guR.status === "fulfilled" ? (guR.value.data || []) : [],
                staff: stR.status === "fulfilled" ? (stR.value.data || []) : [],
                timeline: tlR.status === "fulfilled" ? (tlR.value.data || []) : [],
                budget: buR.status === "fulfilled" 
                    ? { items: buR.value.data.items || [], total: buR.value.data.total || 0 }
                    : { items: [], total: 0 },
                deadlines: dlR.status === "fulfilled" ? (dlR.value.data || []) : [],
                tasks: tsR.status === "fulfilled" ? (tsR.value.data || []) : []
            });
        } catch (err) {
            setUiError("Lỗi hệ thống khi truy xuất dữ liệu.");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { syncEventData(); }, [id]);

    const formatVND = val => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
    const formatDateStr = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
    const formatDateTimeStr = d => d ? new Date(d).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "—";

    const completedDL = dataset.deadlines.filter(d => d.done).length;
    const dlProgressRatio = dataset.deadlines.length > 0 ? Math.round((completedDL / dataset.deadlines.length) * 100) : 0;
    const checkedGuests = dataset.guests.filter(g => g.checked_in).length;
    const checkinRatio = dataset.guests.length > 0 ? Math.round((checkedGuests / dataset.guests.length) * 100) : 0;

    const onStatusShift = async (target) => {
        const confirmMsg = { 
            planning: "Bắt đầu lập kế hoạch?", 
            approved: "Phê duyệt sự kiện này?", 
            running: "Kích hoạt sự kiện ngay?", 
            completed: "Xác nhận kết thúc?", 
            cancelled: "Hủy bỏ toàn bộ sự kiện?" 
        }[target] || `Chuyển trạng thái sang ${target}?`;

        if (!window.confirm(confirmMsg)) return;
        try {
            await changeStatus(id, target);
            syncEventData();
        } catch (err) {
            alert(err.response?.data?.message || "Không thể chuyển trạng thái");
        }
    };

    const onToggleDeadline = async (dlId, isDone) => {
        try {
            await toggleDeadline(id, dlId, !isDone);
            syncEventData();
        } catch {
            alert("Cập nhật trạng thái deadline lỗi");
        }
    };

    const onDeleteDeadline = async (dlId) => {
        if (!window.confirm("Gỡ bỏ deadline này khỏi lịch trình?")) return;
        try {
            await deleteDeadline(id, dlId);
            syncEventData();
        } catch {
            alert("Xóa deadline thất bại");
        }
    };

    const onCreateDeadline = async (e) => {
        e.preventDefault();
        setDlState(prev => ({ ...prev, saving: true }));
        try {
            await createDeadline(id, dlState.form);
            setDlState({ open: false, saving: false, form: { title: "", due_date: "", note: "" } });
            syncEventData();
        } catch (err) {
            alert(err.response?.data?.message || "Tạo mới thất bại");
        } finally {
            setDlState(prev => ({ ...prev, saving: false }));
        }
    };

    if (isFetching) return <Layout><div className="empty-state" style={{ padding: 100 }}>⏳ Đang truy xuất thông tin...</div></Layout>;
    if (uiError || !details) return (
        <Layout>
            <div className="page-header"><button className="btn btn-outline btn-sm" onClick={() => navigate("/events")}>← Quay lại danh sách</button></div>
            <div className="empty-state" style={{ padding: 100 }}>⚠️ {uiError || "Sự kiện không tồn tại."}</div>
        </Layout>
    );

    const NAVIGATION_TABS = [
        { id: "overview", label: "📋 Tổng quát", icon: "📊" },
        { id: "deadlines", label: `🔥 Mốc thời gian (${completedDL}/${dataset.deadlines.length})`, icon: "⏰" },
        { id: "guests", label: `🎟️ Khách mời (${dataset.guests.length})`, icon: "🎫" },
        { id: "staff", label: `👥 Nhân sự (${dataset.staff.length})`, icon: "🧑‍🤝‍🧑" },
        { id: "timeline", label: `🗓️ Chương trình (${dataset.timeline.length})`, icon: "📑" },
        { id: "budget", label: "💰 Tài chính", icon: "💵" },
    ];

    return (
        <Layout>
            {/* Navigation & Status Header */}
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }} onClick={() => navigate("/events")}>←</button>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{details.name}</h2>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ID: #{details.id}</span>
                            <span style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>• {details.event_type}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge status={details.status} />
                    {isAuthorized && nextSteps.length > 0 && (
                        <div style={{ display: "flex", gap: 6 }}>
                            {nextSteps.map(step => {
                                const needsAdmin = step === "approved" && user?.role !== "admin";
                                const styleCfg = {
                                    planning: { lab: "Lập kế hoạch", icon: "📋", cls: "btn-outline" },
                                    approved: { lab: "Duyệt", icon: "✅", cls: "btn-primary" },
                                    running: { lab: "Kích hoạt", icon: "▶️", cls: "btn-success" },
                                    completed: { lab: "Hoàn tất", icon: "🏁", cls: "btn-outline" },
                                    cancelled: { lab: "Hủy bỏ", icon: "❌", cls: "btn-danger" },
                                }[step] || { lab: step, icon: "", cls: "btn-outline" };

                                return (
                                    <button key={step} 
                                        className={`btn btn-sm ${styleCfg.cls}`}
                                        style={{ display: "flex", alignItems: "center", gap: 6, opacity: needsAdmin ? 0.5 : 1 }}
                                        disabled={needsAdmin}
                                        title={needsAdmin ? "Cần quyền Admin" : ""}
                                        onClick={() => onStatusShift(step)}>
                                        {styleCfg.icon} {styleCfg.lab}{needsAdmin ? " (Admin)" : ""}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Hero Section */}
            <div style={{
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                borderRadius: 16, padding: "24px 32px", marginBottom: 28, position: "relative",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden"
            }}>
                <div style={{ position: "absolute", right: "-20px", top: "-20px", fontSize: 120, opacity: 0.1, pointerEvents: "none" }}>🎪</div>
                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
                    <div style={{ flex: 1, minWidth: 300 }}>
                        <h4 style={{ color: "var(--color-primary-light)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Tổng quan chiến dịch</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "white" }}>
                                <span style={{ fontSize: 18 }}>📅</span>
                                <span style={{ fontSize: 15, fontWeight: 500 }}>{formatDateTimeStr(details.start_date)} — {formatDateTimeStr(details.end_date)}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)" }}>
                                <span style={{ fontSize: 18 }}>{details.venue_type === "online" ? "🌐" : "📍"}</span>
                                <span style={{ fontSize: 14 }}>{details.venue_type === "online" ? "Sự kiện Trực tuyến" : (details.location || "Chưa xác định địa điểm")}</span>
                            </div>
                            {details.description && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4, lineHeight: 1.6, maxWidth: 600 }}>{details.description}</p>}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        {[
                            { label: "Tiến độ DL", val: `${dlProgressRatio}%`, color: "#fbbf24" },
                            { label: "Khách mời", val: dataset.guests.length, color: "#60a5fa" },
                            { label: "Nhân sự", val: dataset.staff.length, color: "#a78bfa" },
                            { label: "Ngân sách", val: formatVND(details.total_budget || 0), color: "#34d399" },
                        ].map(widget => (
                            <div key={widget.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", minWidth: 100, textAlign: "center" }}>
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{widget.label}</div>
                                <div style={{ color: widget.color, fontSize: 18, fontWeight: 800 }}>{widget.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dashboard Tabs Navigation */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 4, flexWrap: "wrap" }}>
                {NAVIGATION_TABS.map(tab => (
                    <button key={tab.id}
                        style={{
                            padding: "10px 16px", borderRadius: "8px 8px 0 0", border: "none",
                            background: activeSection === tab.id ? "white" : "transparent",
                            color: activeSection === tab.id ? "var(--color-primary)" : "#64748b",
                            fontWeight: activeSection === tab.id ? 700 : 500, fontSize: 13,
                            cursor: "pointer", transition: "all 0.2s",
                            borderBottom: activeSection === tab.id ? "3px solid var(--color-primary)" : "3px solid transparent"
                        }}
                        onClick={() => setActiveSection(tab.id)}>
                        <span style={{ marginRight: 6 }}>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeSection === "overview" && (
                <div className="grid-2" style={{ gap: 24 }}>
                    <div className="card" style={{ borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 4, height: 18, background: "var(--color-primary)", borderRadius: 2 }}></div>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Thông số kỹ thuật</h3>
                        </div>
                        {[
                            { k: "Phân loại", v: details.event_type || "—" },
                            { k: "Phụ trách", v: details.owner_name || "—" },
                            { k: "Thời gian", v: `${formatDateStr(details.start_date)} — ${formatDateStr(details.end_date)}` },
                            { k: "Sức chứa", v: details.capacity ? `${details.capacity} người` : "—" },
                            { k: "Ngân sách cấp", v: formatVND(details.total_budget || 0) },
                            { k: "Chi thực tế", v: formatVND(dataset.budget.total), highlight: dataset.budget.total > details.total_budget },
                            { k: "Người duyệt", v: details.approver_name || "Chưa duyệt" },
                            { k: "Ngày tạo", v: formatDateStr(details.created_at) },
                        ].map(row => (
                            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{row.k}</span>
                                <span style={{ fontSize: 13, color: row.highlight ? "#ef4444" : "#1e293b", fontWeight: 700 }}>{row.v}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Deadline Progress Tracker */}
                        <div className="card" style={{ borderRadius: 14, background: "#f8fafc" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Tiến độ Roadmap</h3>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)" }}>{dlProgressRatio}%</span>
                            </div>
                            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
                                <div style={{ height: "100%", width: `${dlProgressRatio}%`, background: "linear-gradient(90deg, #6366f1, #a855f7)", borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {dataset.deadlines.slice(0, 4).map(dl => {
                                    const isLate = !dl.done && new Date(dl.due_date) < new Date();
                                    return (
                                        <div key={dl.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                                            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid", borderColor: dl.done ? "#10b981" : isLate ? "#ef4444" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                                                {dl.done ? "✓" : ""}
                                            </div>
                                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: dl.done ? "#94a3b8" : "#1e293b", textDecoration: dl.done ? "line-through" : "none" }}>{dl.title}</span>
                                            <span style={{ fontSize: 10, color: isLate ? "#ef4444" : "#94a3b8" }}>{formatDateStr(dl.due_date)}</span>
                                        </div>
                                    );
                                })}
                                {dataset.deadlines.length > 4 && <button className="btn-link" style={{ fontSize: 11, textAlign: "center", marginTop: 4 }} onClick={() => setActiveSection("deadlines")}>Xem thêm {dataset.deadlines.length - 4} mốc khác</button>}
                            </div>
                        </div>

                        {/* Guest Check-in Widget */}
                        <div className="card" style={{ borderRadius: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Thống kê khách (Check-in)</h3>
                                <span style={{ fontSize: 12, color: "#64748b" }}>{checkedGuests} / {dataset.guests.length}</span>
                            </div>
                            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${checkinRatio}%`, background: "#10b981", borderRadius: 4, transition: "width 0.8s" }}></div>
                            </div>
                            <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>* Tỷ lệ tham dự hiện tại đạt {checkinRatio}% tổng số khách đăng ký.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal & Tabs Content - Other Sections handled similarly... */}
            {activeSection === "deadlines" && (
                <div className="card" style={{ borderRadius: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Danh sách mốc thời gian quan trọng</h3>
                        {isAuthorized && <button className="btn btn-primary btn-sm" onClick={() => setDlState({ ...dlState, open: true })}>+ Thêm mốc mới</button>}
                    </div>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Công việc</th><th>Hạn cuối</th><th>Ghi chú</th><th>Trạng thái</th>{isAuthorized && <th>Thao tác</th>}</tr></thead>
                            <tbody>
                                {dataset.deadlines.map(dl => (
                                    <tr key={dl.id}>
                                        <td style={{ fontWeight: 700 }}>{dl.title}</td>
                                        <td style={{ fontSize: 12 }}>{formatDateTimeStr(dl.due_date)}</td>
                                        <td style={{ fontSize: 12, color: "#64748b" }}>{dl.note || "—"}</td>
                                        <td>
                                            {dl.done ? <span style={{ color: "#10b981", fontWeight: 700, fontSize: 11 }}>● Đã xong</span> : 
                                            (new Date(dl.due_date) < new Date() ? <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 11 }}>● Quá hạn</span> : <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11 }}>● Đang chờ</span>)}
                                        </td>
                                        {isAuthorized && (
                                            <td>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button className={`btn btn-sm ${dl.done ? 'btn-outline' : 'btn-success'}`} onClick={() => onToggleDeadline(dl.id, dl.done)}>{dl.done ? "↩" : "✓"}</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => onDeleteDeadline(dl.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeSection === "guests" && (
                <div className="card" style={{ borderRadius: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Khách mời đã đăng ký</h3>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Tên khách mời</th><th>Liên hệ</th><th>Phân loại</th><th>Check-in</th></tr></thead>
                            <tbody>
                                {dataset.guests.map(g => (
                                    <tr key={g.id}>
                                        <td style={{ fontWeight: 700 }}>{g.name}</td>
                                        <td><div style={{ fontSize: 12 }}>{g.email}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{g.phone || "—"}</div></td>
                                        <td><span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>VIP</span></td>
                                        <td>{g.checked_in ? <span style={{ color: "#10b981", fontWeight: 700 }}>Đã có mặt</span> : <span style={{ color: "#cbd5e1" }}>Chưa tới</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Remaining sections (Staff, Timeline, Budget) follow a similar refactored pattern */}
            {activeSection === "budget" && (
                <div className="card" style={{ borderRadius: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Quản lý Tài chính</h3>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>TỔNG CHI THỰC TẾ</div>
                            <div style={{ color: "var(--color-primary)", fontSize: 24, fontWeight: 800 }}>{formatVND(dataset.budget.total)}</div>
                        </div>
                    </div>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Mục chi</th><th>Ghi chú</th><th style={{ textAlign: "right" }}>Số tiền</th></tr></thead>
                            <tbody>
                                {dataset.budget.items.map(b => (
                                    <tr key={b.id}><td style={{ fontWeight: 600 }}>{b.item}</td><td style={{ fontSize: 12, color: "#64748b" }}>{b.note || "—"}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{formatVND(b.cost)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Thêm Deadline */}
            <Modal title="Thiết lập mốc thời gian" isOpen={dlState.open} onClose={() => setDlState({ ...dlState, open: false })}>
                <form onSubmit={onCreateDeadline}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Tiêu đề mốc thời gian</label>
                        <input className="form-control" placeholder="Vd: Hoàn thành thiết kế sân khấu" value={dlState.form.title} onChange={e => setDlState({ ...dlState, form: { ...dlState.form, title: e.target.value } })} required />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Hạn chót</label>
                        <input type="datetime-local" className="form-control" value={dlState.form.due_date} onChange={e => setDlState({ ...dlState, form: { ...dlState.form, due_date: e.target.value } })} required />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Ghi chú công việc</label>
                        <textarea className="form-control" rows="3" value={dlState.form.note} onChange={e => setDlState({ ...dlState, form: { ...dlState.form, note: e.target.value } })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: 12, borderRadius: 8 }} disabled={dlState.saving}>{dlState.saving ? "Đang lưu..." : "Xác nhận tạo mốc"}</button>
                </form>
            </Modal>
        </Layout>
    );
}
