import React from "react";

const STATUS_CFG = {
    draft: { label: "Bản nháp", bg: "#f1f5f9", color: "#64748b" },
    planning: { label: "Lên kế hoạch", bg: "#fef3c7", color: "#d97706" },
    approved: { label: "Đã duyệt", bg: "#ede9fe", color: "#7c3aed" },
    running: { label: "Đang diễn ra", bg: "#d1fae5", color: "#059669" },
    completed: { label: "Hoàn thành", bg: "#dbeafe", color: "#2563eb" },
    cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#dc2626" },
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

export default function EventOverview({ event, deadlines, guests }) {
    const fmtVND = n => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    const doneCount = deadlines.filter(d => d.done).length;
    const dlProgress = deadlines.length > 0 ? Math.round((doneCount / deadlines.length) * 100) : 0;
    const checkedIn = guests.filter(g => g.checked_in).length;
    const checkinPct = guests.length > 0 ? Math.round((checkedIn / guests.length) * 100) : 0;

    return (
        <div className="grid-2" style={{ alignItems: "start" }}>
            <div className="card" style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                boxShadow: "var(--shadow-md)"
            }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📋</span> Thông tin chung
                </h3>
                {[
                    { label: "Tên sự kiện", value: event.name },
                    { label: "Loại", value: event.event_type || "—" },
                    { label: "Người phụ trách", value: event.owner_name || "—" },
                    { label: "Bắt đầu", value: fmtDT(event.start_date) },
                    { label: "Kết thúc", value: fmtDT(event.end_date) },
                    { label: "Hình thức", value: event.venue_type === "online" ? "🌐 Online" : "🏢 Offline" },
                    { label: "Địa điểm", value: event.location || "—" },
                    { label: "Sức chứa", value: event.capacity ? `${event.capacity} người` : "—" },
                    { label: "Ngân sách dự kiến", value: fmtVND(event.total_budget || 0) },
                    { label: "Trạng thái", value: <StatusBadge status={event.status} /> },
                    { label: "Người duyệt", value: event.approver_name || "—" },
                    { label: "Ngày duyệt", value: fmtDate(event.approved_at) },
                    { label: "Ngày tạo", value: fmtDate(event.created_at) },
                ].map((row, idx) => (
                    <div key={row.label} style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", padding: "12px 0",
                        borderBottom: idx === 12 ? "none" : "1px solid var(--border-color)", gap: 12
                    }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "right", fontWeight: 500 }}>{row.value}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Tiến độ deadline */}
                <div className="card" style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(245, 158, 11, 0.1)",
                    boxShadow: "var(--shadow-md)"
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-warning)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>🔥</span> Tiến độ Deadline nội bộ
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                            {doneCount}/{deadlines.length} hoàn thành
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--color-warning)" }}>
                            {dlProgress}%
                        </span>
                    </div>
                    <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", marginBottom: 20 }}>
                        <div style={{
                            height: "100%", width: `${dlProgress}%`,
                            background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                            borderRadius: 999, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                        }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {deadlines.map(dl => {
                            const overdue = !dl.done && new Date(dl.due_date) < new Date();
                            return (
                                <div key={dl.id} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 14px", borderRadius: 10,
                                    background: dl.done ? "rgba(16,185,129,0.08)" : overdue ? "rgba(239,68,68,0.08)" : "#f8fafc",
                                    border: dl.done ? "1px solid rgba(16,185,129,0.2)" : overdue ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
                                    transition: "transform 0.2s ease"
                                }} className="hover-lift">
                                    <span style={{ fontSize: 16 }}>{dl.done ? "✅" : overdue ? "🔴" : "⏳"}</span>
                                    <span style={{
                                        flex: 1, fontSize: 13, fontWeight: dl.done ? 500 : 600,
                                        textDecoration: dl.done ? "line-through" : "none",
                                        color: dl.done ? "var(--text-muted)" : "var(--text-primary)"
                                    }}>
                                        {dl.title}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? "#dc2626" : "var(--text-muted)" }}>
                                        {fmtDate(dl.due_date)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Check-in */}
                <div className="card" style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(16, 185, 129, 0.1)",
                    boxShadow: "var(--shadow-md)"
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-success)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>✅</span> Tỷ lệ Check-in
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                            {checkedIn}/{guests.length} khách
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--color-success)" }}>
                            {checkinPct}%
                        </span>
                    </div>
                    <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", width: `${checkinPct}%`,
                            background: "linear-gradient(90deg, #10b981, #059669)",
                            borderRadius: 999, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
