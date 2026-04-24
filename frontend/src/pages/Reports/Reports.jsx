import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import {
    getOverview, getEventsByMonth, getAttendeeReport,
    getBudgetReport, getTaskStats, getEventsByType
} from "../../services/reportService";
import "../../styles/global.css";

const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

export default function Reports() {
    const [dataset, setDataset] = useState({
        metrics: null, cadence: [], participation: [], fiscal: [], tasks: [], categories: []
    });
    const [isSyncing, setIsSyncing] = useState(true);
    const currentYear = new Date().getFullYear();

    const syncReportData = async () => {
        setIsSyncing(true);
        try {
            const [ovR, cdR, ptR, fsR, tkR, ctR] = await Promise.allSettled([
                getOverview(), getEventsByMonth(currentYear), getAttendeeReport(),
                getBudgetReport(), getTaskStats(), getEventsByType()
            ]);

            const monthlyMap = {};
            if (cdR.status === "fulfilled") {
                (cdR.value.data || []).forEach(r => { monthlyMap[r.month] = r.count; });
            }

            setDataset({
                metrics: ovR.status === "fulfilled" ? ovR.value.data : null,
                cadence: Array.from({ length: 12 }, (_, i) => ({ 
                    label: MONTH_SHORT[i], 
                    value: monthlyMap[i + 1] || 0 
                })),
                participation: ptR.status === "fulfilled" ? (ptR.value.data || []) : [],
                fiscal: fsR.status === "fulfilled" ? (fsR.value.data || []) : [],
                tasks: tkR.status === "fulfilled" ? (tkR.value.data || []) : [],
                categories: ctR.status === "fulfilled" ? (ctR.value.data || []) : []
            });
        } catch (err) {
            console.error("Report sync failed", err);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => { syncReportData(); }, []);

    const taskDistribution = {};
    dataset.tasks.forEach(t => { taskDistribution[t.status] = Number(t.count); });
    const totalAssignedTasks = Object.values(taskDistribution).reduce((a, b) => a + b, 0);

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em" }}>Trung tâm Báo cáo</h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
                        Dữ liệu phân tích hiệu suất hệ thống — Năm {currentYear}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline btn-sm" style={{ borderRadius: 10 }} onClick={syncReportData}>🔄 Làm mới</button>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }} onClick={() => window.print()}>
                        📄 Xuất PDF / In
                    </button>
                </div>
            </div>

            {isSyncing ? (
                <div className="empty-state" style={{ padding: 100 }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: "3px solid #f3f3f3", borderTop: "3px solid var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}></div>
                    <p style={{ fontWeight: 600 }}>Đang tổng hợp dữ liệu chiến dịch...</p>
                </div>
            ) : (
                <div className="report-container">
                    {/* Primary Metrics Grid */}
                    {dataset.metrics && (
                        <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                            {[
                                { lab: "Chiến dịch", val: dataset.metrics.events?.total || 0, icon: "🎪", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
                                { lab: "Tỷ lệ tham gia", val: dataset.metrics.attendees?.total || 0, icon: "🎟️", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
                                { lab: "Nhiệm vụ xong", val: taskDistribution.done || 0, icon: "📋", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                                { lab: "Tổng chi phí", val: formatVND(dataset.metrics.budget?.actual), icon: "💰", color: "#ef4444", bg: "rgba(239,110,110,0.08)" },
                            ].map(item => (
                                <div key={item.lab} className="card" style={{ padding: "20px", border: "1px solid #f1f5f9", borderRadius: 16, position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: item.bg, borderRadius: "0 0 0 40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{item.icon}</div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{item.lab}</p>
                                    <h3 style={{ fontSize: typeof item.val === "string" ? "15px" : "28px", fontWeight: 900, color: item.color }}>{item.val}</h3>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid-2" style={{ marginBottom: 32, gap: 24, alignItems: "stretch" }}>
                        {/* Event Cadence Chart */}
                        <div className="card" style={{ padding: 24, borderRadius: 18, border: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Tần suất Sự kiện</h3>
                                <span style={{ fontSize: 11, background: "#f1f5f9", padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>HÀNG THÁNG</span>
                            </div>
                            <VisualBarChart data={dataset.cadence} lKey="label" vKey="value" primaryColor="#6366f1" />
                        </div>

                        {/* Event Categories Distribution */}
                        <div className="card" style={{ padding: 24, borderRadius: 18, border: "1px solid #f1f5f9" }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Phân bổ theo Thể loại</h3>
                            {dataset.categories.length === 0 ? (
                                <div className="empty-state" style={{ minHeight: 120 }}>Chưa có dữ liệu</div>
                            ) : (
                                dataset.categories.map((cat, idx) => {
                                    const total = dataset.categories.reduce((acc, curr) => acc + Number(curr.count), 0);
                                    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
                                    return <DataProgressRow key={idx} label={cat.type} value={Number(cat.count)} max={total} color={colors[idx % colors.length]} />;
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 32, gap: 24 }}>
                        {/* Task Progress Tracker */}
                        <div className="card" style={{ padding: 24, borderRadius: 18 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Tiến độ Thực hiện Nhiệm vụ</h3>
                            {totalAssignedTasks === 0 ? (
                                <div className="empty-state" style={{ minHeight: 150 }}>Trống</div>
                            ) : (
                                <>
                                    {[
                                        { k: "todo", l: "Cần xử lý", c: "#94a3b8" },
                                        { k: "in_progress", l: "Đang triển khai", c: "#f59e0b" },
                                        { k: "done", l: "Đã hoàn tất", c: "#10b981" },
                                        { k: "cancelled", l: "Hủy bỏ", c: "#ef4444" },
                                    ].map(st => (
                                        <DataProgressRow key={st.k} label={st.l} value={taskDistribution[st.k] || 0} max={totalAssignedTasks} color={st.c} />
                                    ))}
                                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, marginTop: 16, textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                                        Tổng cộng: {totalAssignedTasks} đầu việc đã phân bổ
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Fiscal Performance (Budgets) */}
                        <div className="card" style={{ padding: 24, borderRadius: 18 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Hiệu suất Tài chính (Top 5)</h3>
                            {dataset.fiscal.length === 0 ? (
                                <div className="empty-state">Không có dữ liệu chi phí</div>
                            ) : (
                                <div className="data-table-wrapper" style={{ boxShadow: "none" }}>
                                    <table className="data-table">
                                        <thead><tr style={{ background: "#f8fafc" }}><th>Dự án</th><th style={{ textAlign: "right" }}>Thực chi</th><th style={{ textAlign: "right" }}>Tỷ lệ</th></tr></thead>
                                        <tbody>
                                            {dataset.fiscal.slice(0, 5).map(fisc => {
                                                const pct = fisc.planned > 0 ? Math.round((fisc.actual / fisc.planned) * 100) : 0;
                                                return (
                                                    <tr key={fisc.id}>
                                                        <td style={{ fontWeight: 700, fontSize: 13 }}>{fisc.name}</td>
                                                        <td style={{ textAlign: "right", fontWeight: 800, color: pct > 100 ? "#ef4444" : "#1e293b" }}>{formatVND(fisc.actual)}</td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: pct > 100 ? "#fee2e2" : "#f1f5f9", color: pct > 100 ? "#ef4444" : "#64748b" }}>{pct}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendee Participation Deep-dive */}
                    <div className="card" style={{ padding: 24, borderRadius: 20, border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Tỷ lệ Chuyển đổi Khách mời & Check-in</h3>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }}></span> Đăng ký</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }}></span> Check-in</div>
                            </div>
                        </div>
                        {dataset.participation.length === 0 ? (
                            <div className="empty-state" style={{ padding: 60 }}>Chưa có dữ liệu người tham gia</div>
                        ) : (
                            <div className="data-table-wrapper" style={{ boxShadow: "none" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr style={{ background: "#f8fafc" }}>
                                            <th>Sự kiện</th><th>Sức chứa</th><th>Lượt Đăng ký</th><th>Đã tham gia</th><th>Độ phủ sóng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataset.participation.map(part => {
                                            const regPct = part.capacity ? Math.round((part.registered / part.capacity) * 100) : 0;
                                            const ciPct = part.registered > 0 ? Math.round((part.checked_in / part.registered) * 100) : 0;
                                            return (
                                                <tr key={part.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 800, color: "#1e293b" }}>{part.name}</div>
                                                        <div style={{ fontSize: 10, color: "#94a3b8" }}>ID: EV-{part.id}</div>
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: "#64748b" }}>{part.capacity || "—"}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 800, color: "var(--color-primary)" }}>{part.registered}</div>
                                                        <div style={{ width: 60, height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 4 }}><div style={{ width: `${regPct}%`, height: "100%", background: "var(--color-primary)", borderRadius: 2 }}></div></div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 800, color: "#10b981" }}>{part.checked_in || 0}</div>
                                                        <div style={{ width: 60, height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 4 }}><div style={{ width: `${ciPct}%`, height: "100%", background: "#10b981", borderRadius: 2 }}></div></div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700 }}>
                                                                <span style={{ color: "var(--color-primary)" }}>{regPct}% Reg.</span>
                                                                <span style={{ color: "#10b981" }}>{ciPct}% In.</span>
                                                            </div>
                                                            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, position: "relative" }}>
                                                                <div style={{ position: "absolute", left: 0, height: "100%", width: `${regPct}%`, background: "var(--color-primary)", borderRadius: 3, opacity: 0.3 }}></div>
                                                                <div style={{ position: "absolute", left: 0, height: "100%", width: `${ciPct}%`, background: "#10b981", borderRadius: 3 }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}

function VisualBarChart({ data, lKey, vKey, primaryColor, maxH = 140 }) {
    if (!data?.length) return <div className="empty-state">Trống</div>;
    const maxVal = Math.max(...data.map(d => d[vKey] || 0), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: maxH, paddingTop: 10, paddingBottom: 25, position: "relative" }}>
            {data.map((item, idx) => {
                const height = Math.round(((item[vKey] || 0) / maxVal) * (maxH - 35));
                return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                        <div title={`${item[lKey]}: ${item[vKey]}`} style={{
                            width: "100%", height, background: `linear-gradient(to top, ${primaryColor}, ${primaryColor}dd)`,
                            borderRadius: "6px 6px 2px 2px", minHeight: 4, transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                        }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", position: "absolute", bottom: -22, textTransform: "uppercase" }}>{item[lKey]}</div>
                        {item[vKey] > 0 && <div style={{ position: "absolute", top: -20, fontSize: 10, fontWeight: 800, color: primaryColor }}>{item[vKey]}</div>}
                    </div>
                );
            })}
        </div>
    );
}

function DataProgressRow({ label, value, max, color }) {
    const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{label}</span>
                <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>({percentage}%)</span>
                </div>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${percentage}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 10, transition: "width 1s ease" }} />
            </div>
        </div>
    );
}

const formatVND = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
const MONTH_SHORT = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
