import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Layout from "../../components/Layout/Layout";
import {
    getAttendeeReport,
    getAttendeeDetail,
    getBudgetReport,
    getEventsByMonth,
    getEventsByType,
    getFeedbackStats,
    getFeedbackDetail,
    getOverview,
    getTaskStats,
    getTaskDetail
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
    const [attendeeDetails, setAttendeeDetails] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [taskStats, setTaskStats] = useState([]);
    const [taskDetails, setTaskDetails] = useState([]);
    const [byType, setByType] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [feedbackDetails, setFeedbackDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const year = new Date().getFullYear();

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [ovR, mnR, atR, buR, tkR, tyR, fbR, tkDR, atDR, fbDR] = await Promise.allSettled([
                getOverview(), getEventsByMonth(year), getAttendeeReport(),
                getBudgetReport(), getTaskStats(), getEventsByType(),
                getFeedbackStats(), getTaskDetail(), getAttendeeDetail(),
                getFeedbackDetail()
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
            if (tkDR.status === "fulfilled") setTaskDetails(tkDR.value.data || []);
            if (atDR.status === "fulfilled") setAttendeeDetails(atDR.value.data || []);
            if (fbDR.status === "fulfilled") setFeedbackDetails(fbDR.value.data || []);
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

        // Sheet 1: Ngân sách & Sự kiện (Chi tiết)
        const budgetData = budgets.map(b => ({
            "Sự kiện": b.event_name,
            "Hạng mục": b.item_name,
            "Dự kiến (VND)": b.planned,
            "Thực chi (VND)": b.actual,
            "Trạng thái": b.status === "paid" ? "Đã chi" : "Dự kiến",
            "Tỉ lệ (%)": `${b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0}%`
        }));
        const totalPlanned = budgets.reduce((a, b) => a + (b.planned || 0), 0);
        const totalActual = budgets.reduce((a, b) => a + (b.actual || 0), 0);
        
        budgetData.push({
            "Sự kiện": "TỔNG CỘNG",
            "Hạng mục": "",
            "Dự kiến (VND)": totalPlanned,
            "Thực chi (VND)": totalActual,
            "Trạng thái": "",
            "Tỉ lệ (%)": `${totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}%`
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetData), "Ngân sách chi tiết");

        // Sheet 2: Khách mời (Chi tiết)
        const guestData = attendeeDetails.map(a => ({
            "Sự kiện": a.event_name,
            "Họ tên": a.attendee_name,
            "Phân loại": a.attendee_type === "internal" ? "Nhân viên" : "Khách mời",
            "Trạng thái": a.checked_in ? "Đã Check-in" : "Chưa Check-in"
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guestData), "Chi tiết khách mời");

        // Sheet 3: Công việc (Chi tiết)
        const taskData = taskDetails.map(t => ({
            "Sự kiện": t.event_name,
            "Nhiệm vụ": t.task_name,
            "Người phụ trách": t.assignee || "Chưa phân công",
            "Trạng thái": t.status === "done" ? "Hoàn Thành" : t.status === "in_progress" ? "Đang Làm" : "Chuẩn Bị"
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskData), "Chi tiết công việc");

        // Sheet 4: Phản hồi (Chi tiết)
        const fbData = feedbackDetails.map(f => ({
            "Sự kiện": f.event_name,
            "Người đánh giá": f.reviewer_name || "Ẩn danh",
            "Điểm": f.rating,
            "Nội dung": f.content,
            "Ngày gửi": new Date(f.created_at).toLocaleDateString("vi-VN")
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fbData), "Chi tiết phản hồi");

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
                        {/* ── Công việc chi tiết ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>📋 TIẾN ĐỘ NHIỆM VỤ CHI TIẾT</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} 
                                    onClick={() => exportExcel(taskDetails.map(t => ({
                                        "Sự kiện": t.event_name,
                                        "Nhiệm vụ": t.task_name,
                                        "Người phụ trách": t.assignee || "Chưa phân công",
                                        "Trạng thái": t.status === "done" ? "Hoàn Thành" : t.status === "in_progress" ? "Đang Làm" : "Chuẩn Bị"
                                    })), "Tien-do-nhiem-vu-chi-tiet")}>⬇️ Excel</button>
                            </div>
                            {taskDetails.length === 0
                                ? <div className="empty-state"><span>📋</span><p>Chưa có nhiệm vụ nào</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 8, maxHeight: 380, overflowY: "auto" }}>
                                    <table className="data-table" style={{ fontSize: 11, tableLayout: "fixed", width: "100%" }}>
                                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 1px 0 var(--border-color)" }}>
                                            <tr style={{ height: 32 }}>
                                                <th style={{ width: "35%", paddingLeft: 12 }}>Nhiệm vụ</th>
                                                <th style={{ width: "35%" }}>Phụ trách</th>
                                                <th style={{ width: "30%", textAlign: "center", paddingRight: 12 }}>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taskDetails.map((t, i) => {
                                                const isFirstOfEvent = i === 0 || taskDetails[i - 1].event_name !== t.event_name;
                                                const statusLabel = t.status === 'done' ? 'HOÀN THÀNH' : t.status === 'in_progress' ? 'ĐANG LÀM' : 'CHUẨN BỊ';
                                                const statusColor = t.status === 'done' ? '#10b981' : t.status === 'in_progress' ? '#f59e0b' : '#6366f1';
                                                const statusBg = t.status === 'done' ? '#ecfdf5' : t.status === 'in_progress' ? '#fff7ed' : '#f5f3ff';
                                                
                                                return (
                                                    <React.Fragment key={t.id}>
                                                        {isFirstOfEvent && (
                                                            <tr style={{ background: "#f8fafc", height: 26 }}>
                                                                <td colSpan={3} style={{ padding: "0 12px", fontWeight: 800, color: "var(--color-primary)", fontSize: 10, textTransform: "uppercase" }}>
                                                                    📁 {t.event_name}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ height: 28 }}>
                                                            <td style={{ paddingLeft: 16, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.task_name}>
                                                                {t.task_name}
                                                            </td>
                                                            <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.assignee || "Chưa phân công"}>
                                                                👤 {t.assignee || "—"}
                                                            </td>
                                                            <td style={{ textAlign: "center", paddingRight: 12 }}>
                                                                <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: statusBg, color: statusColor }}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "2px solid var(--border-color)", fontWeight: 900 }}>
                                            <tr style={{ height: 32 }}>
                                                <td colSpan={3} style={{ textAlign: "right", color: "var(--text-secondary)", paddingRight: 12, fontSize: 10 }}>
                                                    TỔNG CỘNG: {taskDetails.length} NHIỆM VỤ
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            }
                        </div>

                        {/* ── Ngân sách ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>💰 THỐNG KÊ CHI PHÍ KẾ HOẠCH & THỰC TẾ</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} 
                                    onClick={() => {
                                        const totalP = budgets.reduce((a, b) => a + (b.planned || 0), 0);
                                        const totalA = budgets.reduce((a, b) => a + (b.actual || 0), 0);
                                        const dataWithTotal = [
                                            ...budgets.map(b => ({
                                                "Sự kiện": b.event_name,
                                                "Hạng mục / Công việc": b.item_name,
                                                "Dự kiến (VND)": b.planned,
                                                "Thực chi (VND)": b.actual,
                                                "Trạng thái": b.status === "paid" ? "Đã chi" : "Dự kiến",
                                                "Tỉ lệ (%)": `${b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0}%`
                                            })),
                                            {
                                                "Sự kiện": "TỔNG CỘNG",
                                                "Hạng mục / Công việc": "",
                                                "Dự kiến (VND)": totalP,
                                                "Thực chi (VND)": totalA,
                                                "Trạng thái": "",
                                                "Tỉ lệ (%)": `${totalP > 0 ? Math.round((totalA / totalP) * 100) : 0}%`
                                            }
                                        ];
                                        exportExcel(dataWithTotal, "Ngan-sach-chi-tiet");
                                    }}>⬇️ Excel</button>
                            </div>
                            {budgets.length === 0
                                ? <div className="empty-state"><span>💰</span><p>Chưa có dữ liệu ngân sách</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 8, maxHeight: 380, overflowY: "auto" }}>
                                    <table className="data-table" style={{ fontSize: 11, tableLayout: "fixed", width: "100%" }}>
                                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 1px 0 var(--border-color)" }}>
                                            <tr style={{ height: 32 }}>
                                                <th style={{ width: "35%", paddingLeft: 12 }}>Hạng mục</th>
                                                <th style={{ width: "20%", textAlign: "right" }}>Dự kiến</th>
                                                <th style={{ width: "20%", textAlign: "right" }}>Thực chi</th>
                                                <th style={{ width: "15%", textAlign: "center" }}>Trạng thái</th>
                                                <th style={{ width: "10%", textAlign: "right", paddingRight: 12 }}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {budgets.map((b, i) => {
                                                const isFirstOfEvent = i === 0 || budgets[i - 1].event_name !== b.event_name;
                                                const pct = b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0;
                                                const isPaid = b.status === 'paid';
                                                return (
                                                    <React.Fragment key={i}>
                                                        {isFirstOfEvent && (
                                                            <tr style={{ background: "#f8fafc", height: 26 }}>
                                                                <td colSpan={5} style={{ padding: "0 12px", fontWeight: 800, color: "var(--color-primary)", fontSize: 10, textTransform: "uppercase" }}>
                                                                    📁 {b.event_name}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ height: 28 }}>
                                                            <td style={{ paddingLeft: 16, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.item_name}>
                                                                {b.item_name}
                                                            </td>
                                                            <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{fmtVND(b.planned)}</td>
                                                            <td style={{ textAlign: "right", color: isPaid ? "#10b981" : "var(--text-muted)", fontWeight: isPaid ? 700 : 400 }}>
                                                                {isPaid ? fmtVND(b.actual) : "—"}
                                                            </td>
                                                            <td style={{ textAlign: "center" }}>
                                                                <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: isPaid ? "#ecfdf5" : "#fff7ed", color: isPaid ? "#059669" : "#d97706" }}>
                                                                    {isPaid ? "ĐÃ CHI" : "DỰ KIẾN"}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: "right", paddingRight: 12 }}>
                                                                <span style={{ fontSize: 9, fontWeight: 700, color: pct > 100 ? "#ef4444" : "#94a3b8" }}>{pct}%</span>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "2px solid var(--border-color)", fontWeight: 900 }}>
                                            <tr style={{ height: 32 }}>
                                                <td style={{ textAlign: "right", color: "var(--text-secondary)", paddingRight: 8, fontSize: 10 }}>TỔNG:</td>
                                                <td style={{ textAlign: "right", color: "var(--text-primary)" }}>{fmtVND(budgets.reduce((a, b) => a + (b.planned || 0), 0))}</td>
                                                <td style={{ textAlign: "right", color: "#10b981" }}>{fmtVND(budgets.reduce((a, b) => a + (b.actual || 0), 0))}</td>
                                                <td colSpan={2}></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            }
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 32, gap: 28 }}>
                        {/* ── Khách mời chi tiết ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>🎟️ CHI TIẾT KHÁCH MỜI & CHECK-IN</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} 
                                    onClick={() => exportExcel(attendeeDetails.map(a => ({
                                        "Sự kiện": a.event_name,
                                        "Họ tên": a.attendee_name,
                                        "Phân loại": a.attendee_type === "internal" ? "Nhân viên" : "Khách mời",
                                        "Trạng thái": a.checked_in ? "Đã Check-in" : "Chưa Check-in"
                                    })), "Tham-du-chi-tiet")}>⬇️ Excel</button>
                            </div>
                            {attendeeDetails.length === 0
                                ? <div className="empty-state"><span>🎟️</span><p>Chưa có dữ liệu người tham dự</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 8, maxHeight: 380, overflowY: "auto" }}>
                                    <table className="data-table" style={{ fontSize: 11, tableLayout: "fixed", width: "100%" }}>
                                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 1px 0 var(--border-color)" }}>
                                            <tr style={{ height: 32 }}>
                                                <th style={{ width: "35%", paddingLeft: 12 }}>Họ tên</th>
                                                <th style={{ width: "30%" }}>Phân loại</th>
                                                <th style={{ width: "35%", textAlign: "center", paddingRight: 12 }}>Check-in</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendeeDetails.map((a, i) => {
                                                const isFirstOfEvent = i === 0 || attendeeDetails[i - 1].event_name !== a.event_name;
                                                const isInternal = a.attendee_type === 'internal';
                                                const isCheckedIn = a.checked_in === 1;

                                                return (
                                                    <React.Fragment key={i}>
                                                        {isFirstOfEvent && (
                                                            <tr style={{ background: "#f8fafc", height: 26 }}>
                                                                <td colSpan={3} style={{ padding: "0 12px", fontWeight: 800, color: "var(--color-primary)", fontSize: 10, textTransform: "uppercase" }}>
                                                                    📁 {a.event_name}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ height: 28 }}>
                                                            <td style={{ paddingLeft: 16, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={a.attendee_name}>
                                                                {a.attendee_name}
                                                            </td>
                                                            <td style={{ color: "var(--text-muted)" }}>
                                                                <span style={{ fontSize: 9, fontWeight: 700, color: isInternal ? "#6366f1" : "#f59e0b" }}>
                                                                    {isInternal ? "💼 NHÂN VIÊN" : "👤 KHÁCH MỜI"}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: "center", paddingRight: 12 }}>
                                                                <span style={{ 
                                                                    fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 3, 
                                                                    background: isCheckedIn ? "#ecfdf5" : "#fef2f2", 
                                                                    color: isCheckedIn ? "#10b981" : "#ef4444" 
                                                                }}>
                                                                    {isCheckedIn ? "ĐÃ CÓ MẶT" : "CHƯA ĐẾN"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "2px solid var(--border-color)", fontWeight: 900 }}>
                                            <tr style={{ height: 32 }}>
                                                <td colSpan={3} style={{ textAlign: "right", color: "var(--text-secondary)", paddingRight: 12, fontSize: 10 }}>
                                                    TỔNG CỘNG: {attendeeDetails.length} NGƯỜI
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            }
                        </div>

                        {/* ── Feedback chi tiết ── */}
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800 }}>🌟 CHI TIẾT ĐÁNH GIÁ & PHẢN HỒI</h3>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} 
                                    onClick={() => exportExcel(feedbackDetails.map(f => ({
                                        "Sự kiện": f.event_name,
                                        "Người đánh giá": f.reviewer_name || "Ẩn danh",
                                        "Điểm": f.rating,
                                        "Nội dung": f.content,
                                        "Ngày gửi": new Date(f.created_at).toLocaleDateString("vi-VN")
                                    })), "Phan-hoi-chi-tiet")}>⬇️ Excel</button>
                            </div>
                            {feedbackDetails.length === 0
                                ? <div className="empty-state"><span>⭐</span><p>Chưa có phản hồi từ khách mời</p></div>
                                : <div className="data-table-wrapper" style={{ border: "1px solid #f1f5f9", borderRadius: 8, maxHeight: 380, overflowY: "auto" }}>
                                    <table className="data-table" style={{ fontSize: 11, tableLayout: "fixed", width: "100%" }}>
                                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 1px 0 var(--border-color)" }}>
                                            <tr style={{ height: 32 }}>
                                                <th style={{ width: "25%", paddingLeft: 12 }}>Người đánh giá</th>
                                                <th style={{ width: "60%" }}>Nội dung phản hồi</th>
                                                <th style={{ width: "15%", textAlign: "right", paddingRight: 12 }}>Đánh giá</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feedbackDetails.map((f, i) => {
                                                const isFirstOfEvent = i === 0 || feedbackDetails[i - 1].event_name !== f.event_name;
                                                return (
                                                    <React.Fragment key={i}>
                                                        {isFirstOfEvent && (
                                                            <tr style={{ background: "#f8fafc", height: 26 }}>
                                                                <td colSpan={3} style={{ padding: "0 12px", fontWeight: 800, color: "var(--color-primary)", fontSize: 10, textTransform: "uppercase" }}>
                                                                    📁 {f.event_name}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ minHeight: 40 }}>
                                                            <td style={{ paddingLeft: 16, fontWeight: 600, color: "var(--text-primary)", verticalAlign: "top", paddingTop: 8 }}>
                                                                {f.reviewer_name || "Ẩn danh"}
                                                            </td>
                                                            <td style={{ color: "var(--text-secondary)", fontSize: 10.5, lineHeight: 1.4, padding: "8px 0", wordBreak: "break-word" }}>
                                                                {f.content}
                                                            </td>
                                                            <td style={{ textAlign: "right", paddingRight: 12, verticalAlign: "top", paddingTop: 8 }}>
                                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                                                    <span style={{ fontWeight: 800, color: "#f59e0b" }}>{f.rating}</span>
                                                                    <span style={{ color: "#f59e0b", fontSize: 12 }}>⭐</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "2px solid var(--border-color)", fontWeight: 900 }}>
                                            <tr style={{ height: 32 }}>
                                                <td colSpan={3} style={{ textAlign: "right", color: "var(--text-secondary)", paddingRight: 12, fontSize: 10 }}>
                                                    TỔNG CỘNG: {feedbackDetails.length} LƯỢT ĐÁNH GIÁ
                                                </td>
                                            </tr>
                                        </tfoot>
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
