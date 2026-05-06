import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getEvents, updateEvent } from "../../services/eventService";
import {
  getBudget,
  getBudgetByEvent,
  createBudget,
  deleteBudget,
  updateBudget,
} from "../../services/budgetService";
import "../../styles/global.css";

const CATEGORIES = {
  f_b: "🍽️ Ẩm thực & Đồ uống",
  venue: "🏛️ Địa điểm & Mặt bằng",
  marketing: "📣 Truyền thông & QC",
  technical: "⚙️ Kỹ thuật & Thiết bị",
  staff: "👥 Nhân sự & Thù lao",
  other: "📦 Khác",
};

const CATEGORY_KEYS = Object.keys(CATEGORIES);

const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

const DEFAULT_FORM = { event_id: "", item: "", cost: "", status: "pending", category: "other", note: "", task_id: "" };

export default function BudgetList() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialEventId = queryParams.get("eventId") || "all";

  const [filterEventId, setFilterEventId] = useState(initialEventId);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [allEventsStats, setAllEventsStats] = useState({});
  const [eventTasks, setEventTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'expenses'
  
  // Modals
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disbursingTask, setDisbursingTask] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudgetEvent, setEditingBudgetEvent] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");

  const { user } = useContext(AuthContext);
  const canManage = user?.role === "admin" || user?.role === "organizer";

  // ── Load dữ liệu ──────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [eRes] = await Promise.all([getEvents()]);
      const fetchedEvents = eRes.data || [];
      setEvents(fetchedEvents);

      if (selectedEventDetail) {
        const bRes = await getBudgetByEvent(selectedEventDetail);
        const payload = bRes.data;
        setBudgetItems(payload.items || []);
        setStats(payload.stats || null);
      } else {
        // Fetch stats for all events to show in overview
        const statsMap = {};
        await Promise.all(
          fetchedEvents.map(async (ev) => {
            try {
              const res = await getBudgetByEvent(ev.id);
              statsMap[ev.id] = res.data?.stats || null;
            } catch (err) {
              statsMap[ev.id] = null;
            }
          })
        );
        setAllEventsStats(statsMap);

        const bRes = await getBudget();
        setBudgetItems(bRes.data || []);
        setStats(null);
      }
    } catch (err) {
      console.error("Load failed:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedEventDetail]);

  // ── Tải task theo event ────────────────────────────────────
  const fetchTasks = async (eventId) => {
    if (!eventId) return setEventTasks([]);
    try {
      const { getTasksByEvent } = await import("../../services/taskService");
      const res = await getTasksByEvent(eventId);
      setEventTasks(res.data || []);
    } catch { setEventTasks([]); }
  };

  useEffect(() => {
    if (isModalOpen && formData.event_id) fetchTasks(formData.event_id);
  }, [isModalOpen, formData.event_id]);

  // ── CRUD Ngân sách sự kiện ──────────────────────────────────────────
  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!editingBudgetEvent) return;
    setSubmitting(true);
    try {
      await updateEvent(editingBudgetEvent.id, { total_budget: budgetInput });
      setBudgetModalOpen(false);
      loadData();
    } catch (err) {
      alert("Cập nhật ngân sách thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditBudget = (ev) => {
    setEditingBudgetEvent(ev);
    setBudgetInput(ev.total_budget || 0);
    setBudgetModalOpen(true);
  };

  // ── CRUD Khoản chi ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa khoản chi này?")) return;
    try {
      await deleteBudget(id);
      loadData();
    } catch { alert("Xóa thất bại."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!editingId && !formData.event_id) return setError("Vui lòng chọn sự kiện.");
    if (!formData.item.trim()) return setError("Tên khoản chi không được để trống.");
    if (!formData.cost || isNaN(Number(formData.cost)) || Number(formData.cost) < 0)
      return setError("Số tiền không hợp lệ.");
    setSubmitting(true);
    try {
      const payload = { ...formData, cost: Number(formData.cost), task_id: formData.task_id || null };
      if (editingId) await updateBudget(editingId, payload);
      else await createBudget(payload);
      setModalOpen(false);
      setFormData(DEFAULT_FORM);
      setEditingId(null);
      setIsDisbursing(false);
      setDisbursingTask(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (b) => {
    setFormData({
      event_id: b.event_id,
      item: b.item,
      cost: b.cost,
      status: b.status || "pending",
      category: b.category || "other",
      note: b.note || "",
      task_id: b.task_id || "",
    });
    setEditingId(b.id);
    setIsDisbursing(false);
    setError("");
    setModalOpen(true);
  };

  const openAdd = () => {
    setFormData({
      ...DEFAULT_FORM,
      event_id: filterEventId !== "all" ? filterEventId : (events[0]?.id || ""),
    });
    setEditingId(null);
    setIsDisbursing(false);
    setError("");
    setModalOpen(true);
  };

  const openDisburseTask = (b) => {
    setFormData({
      event_id: b.event_id,
      item: b.item,
      cost: b.cost,
      status: "paid", // Pre-select paid
      category: "other",
      note: "Thanh toán giải ngân cho công việc",
      task_id: String(b.id).replace("task-", ""),
    });
    setEditingId(null);
    setIsDisbursing(true);
    setDisbursingTask(b);
    setError("");
    fetchTasks(b.event_id).then(() => setModalOpen(true));
  };

  const openPayBudget = (b) => {
    setFormData({
      event_id: b.event_id,
      item: b.item,
      cost: b.cost,
      status: "paid", // Change to paid
      category: b.category || "other",
      note: b.note || "",
      task_id: b.task_id || "",
    });
    setEditingId(b.id);
    setIsDisbursing(false);
    setError("");
    fetchTasks(b.event_id).then(() => setModalOpen(true));
  };

  const getEventName = (id) => events.find((e) => String(e.id) === String(id))?.name || `Sự kiện #${id}`;

  const filteredItems = selectedEventDetail 
    ? budgetItems 
    : (filterEventId === "all"
      ? budgetItems
      : budgetItems.filter((b) => String(b.event_id) === String(filterEventId)));

  const totalCost = filteredItems.reduce((s, b) => s + Number(b.cost || 0), 0);

  // ── Thanh tiến độ ngân sách (Chi tiết 1 sự kiện) ────────────────────────────────
  const BudgetProgress = () => {
    if (!stats) return null;
    const { planned, total_paid, total_estimated, total_pending, remaining, usage_ratio, over_budget } = stats;
    const barColor = over_budget ? "#ef4444" : usage_ratio >= 90 ? "#f59e0b" : "#10b981";

    return (
      <div style={{ background: "var(--bg-card)", border: `1px solid ${over_budget ? "#fca5a5" : "var(--border-color)"}`, borderRadius: 20, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
              Tình trạng ngân sách
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: over_budget ? "#ef4444" : "var(--text-primary)" }}>
              {formatVND(total_paid)} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>/ {formatVND(planned)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: barColor }}>{usage_ratio}%</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>đã sử dụng</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 10, background: "var(--bg-main)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", width: `${Math.min(usage_ratio, 100)}%`, background: barColor, borderRadius: 10, transition: "width 0.5s ease" }} />
        </div>

        {over_budget && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ⚠️ Vượt ngân sách {formatVND(total_paid - planned)}! Cần xem xét lại chi tiêu.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Ngân sách kế hoạch", value: formatVND(planned), color: "#6366f1" },
            { label: "Tổng dự kiến", value: formatVND(total_estimated), color: "#8b5cf6" },
            { label: "Đã thanh toán", value: formatVND(total_paid), color: "#10b981" },
            { label: "Chờ thanh toán", value: formatVND(total_pending), color: "#f59e0b" },
            { label: "Còn lại", value: formatVND(Math.abs(remaining)), color: remaining < 0 ? "#ef4444" : "#0ea5e9", prefix: remaining < 0 ? "-" : "" },
          ].map(({ label, value, color, prefix }) => (
            <div key={label} style={{ background: "var(--bg-main)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color }}>{prefix}{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {/* Header */}
      <div className="page-header" style={{ alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h2 className="gradient-text">💰 Quản lý Ngân sách & Chi phí</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            Hoạch định ngân sách tổng thể và kiểm soát chi tiết dòng tiền từng sự kiện.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!selectedEventDetail && activeTab === "expenses" && (
            <select
              className="form-control"
              style={{ borderRadius: 12, minWidth: 220 }}
              value={filterEventId}
              onChange={(e) => setFilterEventId(e.target.value)}
            >
              <option value="all">📂 Tất cả sự kiện (Bộ lọc)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>🎯 {ev.name}</option>
              ))}
            </select>
          )}
          {canManage && (
            <button className="btn btn-primary" onClick={openAdd} style={{ borderRadius: 12, padding: "10px 24px" }}>
              + Thêm khoản chi
            </button>
          )}
        </div>
      </div>

      {/* Tabs khi ở chế độ xem tổng thể */}
      {!selectedEventDetail && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "2px solid var(--border-color)", paddingBottom: 10 }}>
          <button 
            onClick={() => setActiveTab("overview")}
            style={{ 
              background: "none", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
              color: activeTab === "overview" ? "var(--color-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "overview" ? "3px solid var(--color-primary)" : "3px solid transparent",
              padding: "0 8px 10px", marginBottom: "-13px"
            }}
          >
            📊 Tổng quan ngân sách sự kiện
          </button>
          <button 
            onClick={() => setActiveTab("expenses")}
            style={{ 
              background: "none", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
              color: activeTab === "expenses" ? "var(--color-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "expenses" ? "3px solid var(--color-primary)" : "3px solid transparent",
              padding: "0 8px 10px", marginBottom: "-13px"
            }}
          >
            💸 Tất cả khoản chi
          </button>
        </div>
      )}

      {/* Thống kê tổng quan cho sự kiện đang chọn */}
      {selectedEventDetail && !loading && (
        <div style={{ marginBottom: 16 }}>
          <button 
            className="btn btn-sm" 
            onClick={() => setSelectedEventDetail(null)}
            style={{ 
              borderRadius: 8, fontWeight: 700, padding: "8px 16px",
              background: "rgba(99, 102, 241, 0.1)", color: "var(--color-primary)",
              border: "1px solid rgba(99, 102, 241, 0.2)"
            }}
          >
            ← Quay lại Tổng quan Ngân sách
          </button>
        </div>
      )}
      {selectedEventDetail && !loading && <BudgetProgress />}

      {/* VIEW: TỔNG QUAN NGÂN SÁCH CÁC SỰ KIỆN */}
      {!selectedEventDetail && activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {events.map(ev => {
            const st = allEventsStats[ev.id];
            const planned = Number(ev.total_budget || 0);
            const total_paid = st ? st.total_paid : 0;
            const usage_ratio = st ? st.usage_ratio : (planned > 0 ? Math.round((total_paid / planned) * 100) : 0);
            const over_budget = st ? st.over_budget : (total_paid > planned);
            const barColor = over_budget ? "#ef4444" : usage_ratio >= 90 ? "#f59e0b" : "#10b981";

            return (
              <div key={ev.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700, color: "var(--text-primary)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ev.name}>
                    {ev.name}
                  </h3>
                  {canManage && (
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditBudget(ev)} style={{ padding: "4px 8px" }} title="Sửa ngân sách dự kiến">
                      ✏️
                    </button>
                  )}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Ngân sách kế hoạch:</span>
                  <span style={{ fontWeight: 700 }}>{formatVND(planned)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Đã chi thực tế:</span>
                  <span style={{ fontWeight: 700, color: over_budget ? "#ef4444" : "var(--text-primary)" }}>{formatVND(total_paid)}</span>
                </div>

                <div style={{ height: 6, background: "var(--bg-main)", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${Math.min(usage_ratio, 100)}%`, background: barColor, borderRadius: 6 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{usage_ratio}% đã dùng</span>
                  {over_budget ? (
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>Vượt {formatVND(total_paid - planned)}</span>
                  ) : (
                    <span style={{ color: "#10b981", fontWeight: 600 }}>Còn {formatVND(planned - total_paid)}</span>
                  )}
                </div>
                <div style={{ marginTop: 16, textAlign: "center" }}>
                   <button className="btn btn-outline btn-sm" style={{ width: "100%" }} onClick={() => setSelectedEventDetail(ev.id)}>
                     Xem chi tiết chi phí
                   </button>
                </div>
              </div>
            );
          })}
          {events.length === 0 && !loading && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              Chưa có sự kiện nào.
            </div>
          )}
        </div>
      )}

      {/* VIEW: DANH SÁCH KHOẢN CHI */}
      {(selectedEventDetail || activeTab === "expenses") && (
        <>
          {/* Thẻ tóm tắt khoản chi (hiện khi xem toàn hệ thống) */}
          {!selectedEventDetail && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 28 }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 20, padding: "22px 26px", display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📋</div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "var(--color-primary)" }}>{filteredItems.length}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Hạng mục chi</div>
                </div>
              </div>
              <div style={{ background: "linear-gradient(135deg,var(--bg-card) 0%,#fffbeb 100%)", border: "1px solid #fde68a", borderRadius: 20, padding: "22px 26px", display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💰</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#b45309" }}>{formatVND(totalCost)}</div>
                  <div style={{ fontSize: 12, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Tổng các khoản chi</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
            {loading ? (
              <div className="empty-state" style={{ padding: "80px 0" }}>
                <span>⏳</span><p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="empty-state" style={{ padding: "60px 0" }}>
                <span style={{ fontSize: 40 }}>⚠️</span><p style={{ color: "#dc2626" }}>{error}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "80px 0" }}>
                <span style={{ fontSize: 48 }}>💸</span>
                <p style={{ fontWeight: 600 }}>Chưa có khoản chi nào.</p>
                {canManage && <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openAdd}>+ Thêm ngay</button>}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24, width: 50 }}>#</th>
                    <th>Hạng mục</th>
                    <th>Danh mục</th>
                    {!selectedEventDetail && filterEventId === "all" && <th>Sự kiện</th>}
                    <th style={{ textAlign: "right" }}>Dự kiến</th>
                    <th style={{ textAlign: "right" }}>Thực chi</th>
                    <th>Trạng thái</th>
                    {canManage && <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((b, i) => {
                    const isTask = String(b.id).startsWith("task-");
                    const isPaid = b.status === "paid";
                    return (
                      <tr key={b.id} className="table-row-hover">
                        <td style={{ color: "var(--text-muted)", paddingLeft: 24, fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{isTask ? "📋" : "💼"}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.item}</div>
                              {isTask ? (
                                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>📋 Dự trù từ nhiệm vụ</div>
                              ) : b.task_title ? (
                                <div style={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 600 }}>🔗 {b.task_title}</div>
                              ) : null}
                              {b.note && !isTask && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{b.note}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {CATEGORIES[b.category] || "📦 Khác"}
                          </span>
                        </td>
                        {!selectedEventDetail && filterEventId === "all" && (
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", background: "rgba(99,102,241,0.08)", padding: "4px 10px", borderRadius: 8 }}>
                              {b.event_name || getEventName(b.event_id)}
                            </span>
                          </td>
                        )}
                        <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 13 }}>
                          {(b.estimated_cost !== null && b.estimated_cost !== undefined) ? formatVND(b.estimated_cost) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 900, fontSize: 15, color: isPaid ? "#10b981" : "#f59e0b" }}>
                          {isPaid ? formatVND(b.cost) : "—"}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                            padding: "4px 10px", borderRadius: 8,
                            background: isPaid ? "#ecfdf5" : "#fff7ed",
                            color: isPaid ? "#10b981" : "#f59e0b",
                            border: `1px solid ${isPaid ? "#10b98140" : "#f59e0b40"}`,
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            {isPaid ? "✅ Đã chi" : "⏳ Dự kiến"}
                          </span>
                        </td>
                        {canManage && (
                          <td style={{ textAlign: "right", paddingRight: 20 }}>
                            {!isTask ? (
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
                                {!isPaid && (
                                  <button className="btn btn-sm" onClick={() => openPayBudget(b)} title="Xác nhận đã thanh toán" style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: 11, fontWeight: 700, marginRight: 8 }}>
                                    💳 Thanh toán
                                  </button>
                                )}
                                <button className="btn btn-sm btn-ghost" onClick={() => openEdit(b)} title="Chỉnh sửa" style={{ padding: 8, borderRadius: 10, color: "var(--color-primary)" }}>✏️</button>
                                <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(b.id)} title="Xóa" style={{ padding: 8, borderRadius: 10, color: "#dc2626" }}>🗑️</button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button className="btn btn-sm" onClick={() => openDisburseTask(b)} title="Thanh toán khoản này" style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: 11, fontWeight: 700 }}>
                                  💳 Giải ngân
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ background: "var(--bg-main)", borderTop: "2px solid var(--border-color)" }}>
                  <tr>
                    <th colSpan={(!selectedEventDetail && filterEventId === "all") ? 5 : 4} style={{ textAlign: "right", padding: "18px 24px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                      Tổng cộng thực tế:
                    </th>
                    <th style={{ textAlign: "right", color: "#b45309", fontSize: 20, fontWeight: 900, paddingRight: 8 }}>
                      {formatVND(filteredItems.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.cost || 0), 0))}
                    </th>
                    <th colSpan={canManage ? 2 : 1} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal Thêm/Sửa Khoản Chi */}
      <Modal
        title={isDisbursing ? "Giải ngân công việc" : editingId ? "Chỉnh sửa khoản chi" : "Thêm khoản chi mới"}
        isOpen={isModalOpen}
        onClose={() => { setModalOpen(false); setError(""); setIsDisbursing(false); }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {isDisbursing && disbursingTask && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 12, padding: "12px 16px", color: "#065f46" }}>
              <div style={{ fontWeight: 700 }}>🎯 Đang giải ngân cho: {formData.item}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                💰 Ngân sách dự trù: <span style={{ fontWeight: 700 }}>{formatVND(disbursingTask.cost)}</span>
              </div>
            </div>
          )}

          {!editingId && !isDisbursing && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Sự kiện áp dụng *</label>
              <select className="form-control" value={formData.event_id} onChange={(e) => setFormData({ ...formData, event_id: e.target.value })} required>
                <option value="">-- Chọn sự kiện --</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          )}

          {/* Phần này đã bị loại bỏ hoàn toàn theo yêu cầu của người dùng để đơn giản hóa giao diện */}
          {/* Việc liên kết sẽ được thực hiện tự động thông qua nút 'Giải ngân' ở danh sách */}

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tên khoản chi *</label>
              <input className="form-control" placeholder="VD: Thuê âm thanh, In banner..." value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Danh mục</label>
              <select className="form-control" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Số tiền (VND) *</label>
              <input type="number" className="form-control" placeholder="0" min="0" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Trạng thái</label>
              <select className="form-control" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="pending">⏳ Dự kiến / Chờ thanh toán</option>
                <option value="paid">✅ Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ghi chú <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(tùy chọn)</span></label>
            <input className="form-control" placeholder="Thông tin thêm về khoản chi..." value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
          </div>

          <div style={{ padding: "14px 0 0", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={() => { setModalOpen(false); setIsDisbursing(false); }} style={{ borderRadius: 12 }}>Hủy</button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 32px" }} disabled={submitting}>
              {submitting ? "Đang xử lý..." : isDisbursing ? "✅ Xác nhận giải ngân" : editingId ? "💾 Lưu thay đổi" : "✅ Xác nhận thêm"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Sửa Ngân Sách Sự Kiện */}
      <Modal
        title="Cập nhật ngân sách sự kiện"
        isOpen={isBudgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
      >
        <form onSubmit={handleUpdateBudget} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {editingBudgetEvent && (
            <div style={{ background: "rgba(99,102,241,0.1)", padding: 12, borderRadius: 10, color: "var(--color-primary)", fontWeight: 600 }}>
              🎯 {editingBudgetEvent.name}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ngân sách kế hoạch (VND) *</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="0" 
              min="0" 
              value={budgetInput} 
              onChange={(e) => setBudgetInput(e.target.value)} 
              required 
            />
          </div>

          <div style={{ padding: "14px 0 0", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={() => setBudgetModalOpen(false)} style={{ borderRadius: 12 }}>Hủy</button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 32px" }} disabled={submitting}>
              {submitting ? "Đang xử lý..." : "💾 Lưu ngân sách"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
