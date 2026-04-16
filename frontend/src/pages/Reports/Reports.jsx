import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import {
    getOverview, getEventsByMonth, getAttendeeReport,
    getBudgetReport, getTaskStats, getEventsByType
} from "../../services/reportService";
import "../../styles/global.css";

const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

// Mini bar chart dùng CSS
function BarChart({ data, labelKey, valueKey, color = "#6366f1", maxH = 120 }) {
    if (!data?.length) return <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chưa có dữ liệu</div>;
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: maxH, paddingBottom: 20, position: "relative" }}>
            {data.map((d, i) => {
                const h = Math.round(((d[valueKey] || 0) / max) * (maxH - 20));
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div title={d[valueKey]} style={{
                            width: "100%", height: h, background: color,
                            borderRadius: "3px 3px 0 0", minHeight: 2,
                            opacity: 0.85, transition: "height 0.4s ease",
                        }} />
                        <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", position: "absolute", bottom: 0 }}>
                            {d[labelKey]}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Progress row
function ProgressRow({ label, value, max, color, suffix = "" }) {
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}{suffix} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
            </div>
            <div style={{ height: 7, background: "var(--border-color)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 5, transition: "width 0.6s" }} />
            </div>
        </div>
    );
}

export default function Reports() {
    const [overview, setOverview] = useState(null);
    const [byMonth, setByMonth] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [taskStats, setTaskStats] = useState([]);
    const [byType, setByType] = useState([]);
    const [loading, setLoading] = useState(true);
    const year = new Date().getFullYear();

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                const [ovR, mnR, atR, buR, tkR, tyR] = await Promise.allSettled([
                    getOverview(), getEventsByMonth(year), getAttendeeReport(),
                    getBudgetReport(), getTaskStats(), getEventsByType()
                ]);
                if (ovR.status === "fulfilled") setOverview(ovR.value.data);
                if (mnR.status === "fulfilled") {
                    // Fill 12 tháng
                    const map = {};
                    (mnR.value.data || []).forEach(r => { map[r.month] = r.count; });
                    setByMonth(Array.from({ length: 12 }, (_, i) => ({ label: MONTHS[i], value: map[i + 1] || 0 })));
                }
                if (atR.status === "fulfilled") setAttendees(atR.value.data || []);
                if (buR.status === "fulfilled") setBudgets(buR.value.data || []);
                if (tkR.status === "fulfilled") setTaskStats(tkR.value.data || []);
                if (tyR.status === "fulfilled") setByType(tyR.value.data || []);
            } catch {/**/ }
            finally { setLoading(false); }
        };
        loadAll();
    }, []);

    const taskMap = {};
    taskStats.forEach(t => { taskMap[t.status] = Number(t.count); });
    const totalTasks = Object.values(taskMap).reduce((a, b) => a + b, 0);

    const STATUS_CFG_EV = {
        draft: "#94a3b8", planning: "#f59e0b", approved: "#7c3aed",
        running: "#10b981", completed: "#2563eb", cancelled: "#dc2626"
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">📊 Báo cáo & Thống kê Analytics</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        Phân tích chuyên sâu về tiến độ dự án và hiệu quả sự kiện trong năm {year}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" style={{ borderRadius: 12, padding: "10px 20px" }} onClick={() => window.print()}>
                        🖨️ Xuất PDF / In báo cáo
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 24px" }} onClick={() => window.location.reload()}>
                        ↻ Làm mới dữ liệu
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải dữ liệu...</p></div>
            ) : (
                <>
                    {/* ── Tổng quan ── */}
                    {overview && (
                        <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                            {[
                                { icon: "🎪", label: "Tổng sự kiện", value: overview.events?.total || 0, color: "#6366f1", bg: "linear-gradient(135deg, #fff 0%, #f5f3ff 100%)" },
                                { icon: "🔥", label: "Đang diễn ra", value: overview.events?.running || 0, color: "#10b981", bg: "linear-gradient(135deg, #fff 0%, #f0fdf4 100%)" },
                                { icon: "🎟️", label: "Tổng người tham gia", value: overview.attendees?.total || 0, color: "#f59e0b", bg: "linear-gradient(135deg, #fff 0%, #fffbeb 100%)" },
                                { icon: "💰", label: "Tổng chi phí thực tế", value: fmtVND(overview.budget?.actual), color: "#ef4444", bg: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)" },
                            ].map(s => (
                                <div key={s.label} className="card-stat" style={{ background: s.bg, border: "1px solid #e2e8f0" }}>
                                    <div className="card-stat-icon" style={{ background: "#fff", color: s.color, fontSize: 22, boxShadow: "var(--shadow-sm)" }}>{s.icon}</div>
                                    <div className="card-stat-info">
                                        <h3 style={{ color: s.color, fontSize: typeof s.value === "string" ? "18px" : "28px", fontWeight: 900 }}>{s.value}</h3>
                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid-2" style={{ marginBottom: 32, alignItems: "start", gap: 28 }}>
                        {/* ── Sự kiện theo tháng ── */}
                        <div className="card" style={{ padding: 24, borderRadius: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                                <span>📅</span> SỐ LƯỢNG SỰ KIỆN THEO THÁNG
                            </h3>
                            <BarChart data={byMonth} labelKey="label" valueKey="value" color="linear-gradient(180deg, #6366f1, #818cf8)" maxH={180} />
                        </div>

                        {/* ── Loại sự kiện ── */}
                        <div className="card" style={{ padding: 24, borderRadius: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                                <span>🏷️</span> PHÂN LOẠI HÌNH THỨC SỰ KIỆN
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {byType.length === 0
                                    ? <div className="empty-state"><span>🏷️</span><p>Chưa có dữ liệu</p></div>
                                    : byType.map((t, i) => {
                                        const total = byType.reduce((a, x) => a + Number(x.count), 0);
                                        const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
                                        return <ProgressRow key={i} label={t.type?.toUpperCase()} value={Number(t.count)} max={total} color={colors[i % colors.length]} />;
                                    })
                                }
                            </div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 24, alignItems: "start" }}>
                        {/* ── Tasks ── */}
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📋 Tiến độ Nhiệm vụ</h3>
                            {totalTasks === 0
                                ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chưa có nhiệm vụ nào</div>
                                : <>
                                    {[
                                        { key: "todo", label: "Cần làm", color: "#94a3b8" },
                                        { key: "in_progress", label: "Đang làm", color: "#f59e0b" },
                                        { key: "done", label: "Đã xong", color: "#10b981" },
                                        { key: "cancelled", label: "Đã hủy", color: "#ef4444" },
                                    ].map(s => (
                                        <ProgressRow key={s.key} label={s.label}
                                            value={taskMap[s.key] || 0} max={totalTasks} color={s.color} />
                                    ))}
                                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                                        Tổng: {totalTasks} nhiệm vụ
                                    </div>
                                </>
                            }
                        </div>

                        {/* ── Ngân sách ── */}
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>💰 Ngân sách theo sự kiện (Top 5)</h3>
                            {budgets.length === 0
                                ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chưa có dữ liệu ngân sách</div>
                                : <table className="data-table">
                                    <thead><tr><th>Sự kiện</th><th style={{ textAlign: "right" }}>Kế hoạch</th><th style={{ textAlign: "right" }}>Thực tế</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
                                    <tbody>
                                        {budgets.slice(0, 5).map(b => {
                                            const pct = b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0;
                                            return (
                                                <tr key={b.id}>
                                                    <td style={{ fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</td>
                                                    <td style={{ textAlign: "right", fontSize: 12 }}>{fmtVND(b.planned)}</td>
                                                    <td style={{ textAlign: "right", fontSize: 12, color: pct > 100 ? "#dc2626" : "var(--text-primary)", fontWeight: 700 }}>{fmtVND(b.actual)}</td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <span className={`badge ${pct > 100 ? "badge-danger" : pct > 80 ? "badge-warning" : "badge-success"}`}>
                                                            {pct}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            }
                        </div>
                    </div>

                    {/* ── Tỷ lệ đăng ký & check-in ── */}
                    <div className="card" style={{ padding: 24, borderRadius: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                            <span>🎟️</span> TỶ LỆ ĐĂNG KÝ & CÓ MẶT THEO SỰ KIỆN
                        </h3>
                        {attendees.length === 0
                            ? <div className="empty-state"><span>🎟️</span><p>Chưa có dữ liệu thống kê người tham dự</p></div>
                            : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 20 }}>Tên Sự kiện</th>
                                            <th>Sức chứa</th>
                                            <th>Đăng ký</th>
                                            <th>Có mặt</th>
                                            <th>Tỉ lệ lấp đầy</th>
                                            <th style={{ textAlign: "right", paddingRight: 20 }}>Tiến độ Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendees.map(a => {
                                            const regPct = a.capacity ? Math.round((a.registered / a.capacity) * 100) : null;
                                            const ciPct = a.registered > 0 ? Math.round((a.checked_in / a.registered) * 100) : 0;
                                            return (
                                                <tr key={a.id}>
                                                    <td style={{ fontWeight: 700, paddingLeft: 20, color: "var(--text-primary)" }}>{a.name}</td>
                                                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{a.capacity || "—"}</td>
                                                    <td style={{ fontWeight: 800, color: "var(--color-primary)" }}>{a.registered}</td>
                                                    <td style={{ fontWeight: 800, color: "#10b981" }}>{a.checked_in || 0}</td>
                                                    <td>
                                                        {regPct !== null
                                                            ? <span className={`badge ${regPct >= 100 ? "badge-danger" : regPct >= 80 ? "badge-warning" : "badge-success"}`} style={{ borderRadius: 8, padding: "4px 10px", border: "none" }}>{regPct}%</span>
                                                            : <span className="badge badge-default">—</span>
                                                        }
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                                                            <div style={{ width: 80, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${ciPct}%`, background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 4 }} />
                                                            </div>
                                                            <span style={{ fontSize: 12, fontWeight: 900, color: "#059669", minWidth: 35 }}>{ciPct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        }
                    </div>
                </>
            )}
        </Layout>
    );
}
