import React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"];

export default function EventBudget({ budget, event }) {
    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

    // Chuẩn bị dữ liệu cho biểu đồ tròn
    const chartData = budget.items.map((item, index) => ({
        name: item.item,
        value: parseFloat(item.cost || 0)
    })).filter(item => item.value > 0);

    const totalBudget = event.total_budget || 0;
    const actualTotal = budget.total || 0;
    const isOver = actualTotal > totalBudget;

    return (
        <div className="card" style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            boxShadow: "var(--shadow-md)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>💰</span> Ngân sách sự kiện
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Quản lý thu chi và phân bổ ngân sách
                    </p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Tổng ngân sách dự kiến</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-secondary)" }}>{fmtVND(totalBudget)}</p>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: "center", gap: 24, marginBottom: 24 }}>
                {/* Biểu đồ */}
                <div style={{ height: 220, width: "100%" }}>
                    {chartData.length === 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#f8fafc", borderRadius: 12, color: "var(--text-muted)", fontSize: 13 }}>
                            Không có dữ liệu chi phí
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => fmtVND(value)} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Tổng kết chi phí */}
                <div style={{
                    background: isOver ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.05)",
                    border: isOver ? "1px solid rgba(239, 68, 68, 0.1)" : "1px solid rgba(16, 185, 129, 0.1)",
                    borderRadius: 16, padding: "20px 24px", textAlign: "center"
                }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Chi phí thực tế</span>
                    <p style={{ fontSize: 28, fontWeight: 800, color: isOver ? "#dc2626" : "#059669", marginTop: 4 }}>{fmtVND(actualTotal)}</p>
                    
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        {totalBudget > 0 && (
                            <span style={{
                                fontSize: 13, fontWeight: 700,
                                color: isOver ? "#dc2626" : "#059669"
                            }}>
                                {isOver
                                    ? `⚠️ Vượt ngân sách ${fmtVND(actualTotal - totalBudget)}`
                                    : `✅ Còn lại ${fmtVND(totalBudget - actualTotal)}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {budget.items.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <span style={{ fontSize: 40 }}>💰</span>
                    <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Chưa ghi nhận khoản chi nào</p>
                </div>
            ) : (
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Khoản mục</th>
                                <th>Ghi chú</th>
                                <th style={{ textAlign: "right" }}>Chi phí</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budget.items.map((b, i) => (
                                <tr key={b.id} style={{ transition: "background 0.2s" }}>
                                    <td style={{ color: "var(--text-muted)", width: 50 }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.item}</td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{b.note || "—"}</td>
                                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>{fmtVND(b.cost)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: "2px solid var(--border-color)" }}>
                                <td colSpan={3} style={{ fontWeight: 700, fontSize: 14, padding: "16px", background: "#f8fafc" }}>Tổng cộng</td>
                                <td style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: "var(--color-primary)", padding: "16px", background: "#f8fafc" }}>
                                    {fmtVND(actualTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
