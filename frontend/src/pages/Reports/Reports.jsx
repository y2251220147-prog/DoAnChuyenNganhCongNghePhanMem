import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Layout from "../../components/Layout/Layout";
import {
    getAttendeeReport,
    getBudgetReport,
    getEventsByMonth,
    getEventsByType,
    getFeedbackStats,
    getOverview,
    getTaskStats
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
    const reportRef = useRef(null);
    const [overview, setOverview] = useState(null);
    const [byMonth, setByMonth] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [taskStats, setTaskStats] = useState([]);
    const [byType, setByType] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const year = new Date().getFullYear();

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [ovR, mnR, atR, buR, tkR, tyR, fbR] = await Promise.allSettled([
                getOverview(), getEventsByMonth(year), getAttendeeReport(),
                getBudgetReport(), getTaskStats(), getEventsByType(),
                getFeedbackStats()
            ]);
            if (ovR.status === "fulfilled") setOverview(ovR.value.data);
            if (mnR.status === "fulfilled") {
                const map = {};
                (mnR.value.data || []).forEach(r => { map[r.month] = r.count; });
                setByMonth(Array.from({ length: 12 }, (_, i) => ({ label: MONTHS[i], value: map[i + 1] || 0 })));
            }
            if (atR.status === "fulfilled") setAttendees(atR.value.data || []);
            if (buR.status === "fulfilled") setBudgets(buR.value.data || []);
            if (tkR.status === "fulfilled") setTaskStats(tkR.value.data || []);
            if (tyR.status === "fulfilled") setByType(tyR.value.data || []);
            if (fbR.status === "fulfilled") setFeedback(fbR.value.data || []);
        } catch {/**/ }
        finally { setLoading(false); }
    };

    const taskMap = {};
    taskStats.forEach(t => { taskMap[t.status] = Number(t.count); });
    const totalTasks = Object.values(taskMap).reduce((a, b) => a + b, 0);

    // ── XUẤT EXCEL ──
    const exportExcel = (data, filename) => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
        XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString("vi-VN")}.xlsx`);
    };

    const handleExportAll = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Ngân sách & Sự kiện
        const budgetData = budgets.map(b => ({
            "Sự kiện": b.name,
            "Ngân sách Dự kiến (VND)": b.planned,
            "Chi phí Thực tế (VND)": b.actual,
            "Tỉ lệ (%)": `${b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0}%`
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetData), "Ngân sách");

        // Sheet 2: Khách mời
        const guestData = attendees.map(a => ({
            "Sự kiện": a.name,
            "Sức chứa": a.capacity,
            "Đã đăng ký": a.registered,
            "Đã có mặt": a.checked_in,
            "Tỉ lệ đi họp (%)": `${a.registered > 0 ? Math.round((a.checked_in / a.registered) * 100) : 0}%`
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guestData), "Khách mời");

        // Sheet 3: Công việc
        const taskData = [
            { "Trạng thái": "Cần làm", "Số lượng": taskMap.todo || 0 },
            { "Trạng thái": "Đang làm", "Số lượng": taskMap.in_progress || 0 },
            { "Trạng thái": "Đã xong", "Số lượng": taskMap.done || 0 },
            { "Trạng thái": "Đã hủy", "Số lượng": taskMap.cancelled || 0 },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskData), "Công việc");

        // Sheet 4: Phản hồi
        const fbData = feedback.map(f => ({
            "Sự kiện": f.name,
            "Tổng số phản hồi": f.total_feedback,
            "Đánh giá trung bình": (Number(f.avg_rating) || 0).toFixed(1) + " / 5.0"
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fbData), "Phản hồi");

        XLSX.writeFile(wb, `Bao-cao-tong-hop-${year}.xlsx`);
    };

    // ── XUẤT PDF ──
    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
            pdf.save(`Báo cáo Analytics ${year}.pdf`);
        } catch (err) { alert("Lỗi xuất PDF: " + err.message); }
        finally { setExporting(false); }
    };

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">📊 Báo cáo & Thống kê Analytics</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                        Phân tích chuyên sâu về tiến độ dự án và hiệu quả sự kiện trong năm {year}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline"
                        disabled={exporting}
                        style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 700 }}
                        onClick={handleExportPDF}>
                        {exporting ? "⌛ Đang xử lý..." : "📕 Xuất PDF toàn trang"}
                    </button>
                    <button className="btn btn-primary"
                        style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 800, background: "#10b981", border: "none" }}
                        onClick={handleExportAll}>
                        📗 Tải Báo cáo Excel (.xlsx)
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state" style={{ padding: 100 }}><span>⌛</span><p>Đang chuẩn bị dữ liệu thống kê...</p></div>
            ) : (
                <div ref={reportRef} style={{ background: "var(--bg-main)", paddingBottom: 40 }}>
                    {/* ── Tổng quan ── */}
                    {overview && (
                        <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                            {[
                                { icon: "🎪", label: "Tổng sự kiện", value: overview.events?.total || 0, color: "#6366f1", bg: "#f5f3ff" },
                                { icon: "🔥", label: "Đang diễn ra", value: overview.events?.running || 0, color: "#10b981", bg: "#f0fdf4" },
                                { icon: "🎟️", label: "Tổng người tham gia", value: overview.attendees?.total || 0, color: "#f59e0b", bg: "#fffbeb" },
                                { icon: "💰", label: "Tổng chi phí thực tế", value: fmtVND(overview.budget?.actual), color: "#ef4444", bg: "#fef2f2" },
                            ].map(s => (
                                <div key={s.label} className="card-stat" style={{ background: s.bg, border: "1px solid rgba(0,0,0,0.02)", padding: 24, borderRadius: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center" }}>{s.icon}</div>
                                    <div className="card-stat-info" style={{ marginLeft: 16 }}>
                                        <h3 style={{ color: s.color, fontSize: typeof s.value === "string" && s.value.length > 10 ? "20px" : "28px", fontWeight: 900, marginBottom: 4 }}>{s.value}</h3>
                                        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid-2" style={{ marginBottom: 32, gap: 28 }}>
                        {/* ── Sự kiện theo tháng ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>📅 SỐ LƯỢNG SỰ KIỆN THEO THÁNG</h3>
                            </div>
                            <BarChart data={byMonth} labelKey="label" valueKey="value" color="linear-gradient(180deg, #6366f1, #818cf8)" maxH={200} />
                        </div>

                        {/* ── Loại sự kiện ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>🏷️ PHÂN LOẠI HÌNH THỨC SỰ KIỆN</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => exportExcel(byType, "Loai-su-kien")}>⬇️ Excel</button>
                            </div>
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

                    <div className="grid-2" style={{ marginBottom: 32, gap: 28 }}>
                        {/* ── Tasks ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>📋 TIẾN ĐỘ NHIỆM VỤ TỔNG THỂ</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => exportExcel(Object.entries(taskMap).map(([k, v]) => ({ Trạng_thái: k, Số_lượng: v })), "Tien-do-cong-viec")}>⬇️ Excel</button>
                            </div>
                            {totalTasks === 0
                                ? <div className="empty-state"><span>📋</span><p>Chưa có nhiệm vụ nào</p></div>
                                : <>
                                    {[
                                        { key: "todo", label: "Chưa bắt đầu", color: "#94a3b8" },
                                        { key: "in_progress", label: "Đang triển khai", color: "#f59e0b" },
                                        { key: "review", label: "Đang chờ duyệt", color: "#6366f1" },
                                        { key: "done", label: "Đã hoàn thành", color: "#10b981" },
                                        { key: "cancelled", label: "Đã hủy bỏ", color: "#ef4444" },
                                    ].map(s => (
                                        <ProgressRow key={s.key} label={s.label}
                                            value={taskMap[s.key] || 0} max={totalTasks} color={s.color} />
                                    ))}
                                    <div style={{ textAlign: "right", fontSize: 13, color: "var(--text-muted)", marginTop: 12, fontWeight: 600 }}>
                                        Tổng cộng: {totalTasks} nhiệm vụ đang quản lý
                                    </div>
                                </>
                            }
                        </div>

                        {/* ── Ngân sách ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>💰 THỐNG KÊ CHI PHÍ KẾ HOẠCH & THỰC TẾ</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => exportExcel(budgets, "Ngan-sach")}>⬇️ Excel</button>
                            </div>
                            {budgets.length === 0
                                ? <div className="empty-state"><span>💰</span><p>Chưa có dữ liệu ngân sách</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 16 }}>
                                    <table className="data-table" style={{ fontSize: 13 }}>
                                        <thead><tr><th>Sự kiện</th><th style={{ textAlign: "right" }}>Kế hoạch</th><th style={{ textAlign: "right" }}>Thực tế</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
                                        <tbody>
                                            {budgets.map(b => {
                                                const pct = b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0;
                                                return (
                                                    <tr key={b.id}>
                                                        <td style={{ fontWeight: 800, color: "var(--text-primary)" }}>{b.name}</td>
                                                        <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{fmtVND(b.planned)}</td>
                                                        <td style={{ textAlign: "right", color: pct > 100 ? "#ef4444" : "#10b981", fontWeight: 800 }}>{fmtVND(b.actual)}</td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <span style={{
                                                                fontSize: 11, fontWeight: 900, padding: "4px 8px", borderRadius: 8,
                                                                background: pct > 100 ? "#fee2e2" : "#f0fdf4", color: pct > 100 ? "#ef4444" : "#10b981"
                                                            }}>{pct}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            }
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 32, gap: 28 }}>
                        {/* ── Tỷ lệ tham dự ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>🎟️ TỔNG HỢP CHI TIẾT KHÁCH MỜI & CHECK-IN</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => exportExcel(attendees, "Tham-du")}>⬇️ Excel</button>
                            </div>
                            {attendees.length === 0
                                ? <div className="empty-state"><span>🎟️</span><p>Chưa có dữ liệu người tham dự</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: 24 }}>Tên Sự kiện</th>
                                                <th>Sức chứa</th>
                                                <th>Đăng ký</th>
                                                <th>Có mặt</th>
                                                <th>Tỉ lệ lấp đầy</th>
                                                <th style={{ textAlign: "right", paddingRight: 24 }}>Tiến độ Check-in</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendees.map(a => {
                                                const regPct = a.capacity ? Math.round((a.registered / a.capacity) * 100) : null;
                                                const ciPct = a.registered > 0 ? Math.round((a.checked_in / a.registered) * 100) : 0;
                                                return (
                                                    <tr key={a.id}>
                                                        <td style={{ fontWeight: 800, paddingLeft: 24, fontSize: 15 }}>{a.name}</td>
                                                        <td style={{ color: "var(--text-muted)", fontWeight: 700 }}>{a.capacity || "—"}</td>
                                                        <td style={{ fontWeight: 800, color: "var(--color-primary)" }}>{a.registered}</td>
                                                        <td style={{ fontWeight: 800, color: "#10b981" }}>{a.checked_in || 0}</td>
                                                        <td>
                                                            {regPct !== null
                                                                ? <span style={{ fontWeight: 900, color: regPct >= 100 ? "#ef4444" : "#10b981" }}>{regPct}%</span>
                                                                : <span style={{ color: "#94a3b8" }}>—</span>
                                                            }
                                                        </td>
                                                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                                                                <div style={{ width: 120, height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                                                                    <div style={{ height: "100%", width: `${ciPct}%`, background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 5 }} />
                                                                </div>
                                                                <span style={{ fontSize: 14, fontWeight: 900, color: "#059669", minWidth: 45 }}>{ciPct}%</span>
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

                        {/* ── Feedback ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>🌟 ĐÁNH GIÁ & MỨC ĐỘ HÀI LÒNG</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => exportExcel(feedback, "Phan-hoi")}>⬇️ Excel</button>
                            </div>
                            {feedback.length === 0
                                ? <div className="empty-state"><span>⭐</span><p>Chưa có phản hồi từ khách mời</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 16 }}>
                                    <table className="data-table">
                                        <thead><tr><th>Sự kiện</th><th style={{ textAlign: "center" }}>Phản hồi</th><th style={{ textAlign: "right" }}>Đánh giá</th></tr></thead>
                                        <tbody>
                                            {feedback.map((f, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 800 }}>{f.name}</td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--color-primary)" }}>{f.total_feedback} lượt</td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                                                            <span style={{ fontWeight: 900, fontSize: 15, color: "#f59e0b" }}>{(Number(f.avg_rating) || 0).toFixed(1)}</span>
                                                            <span style={{ color: "#f59e0b" }}>⭐</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
