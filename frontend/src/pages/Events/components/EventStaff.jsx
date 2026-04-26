import React from "react";

export default function EventStaff({ staff }) {
    return (
        <div className="card" style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            boxShadow: "var(--shadow-md)"
        }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>👥</span> Nhân sự phụ trách
            </h3>

            {staff.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <span style={{ fontSize: 40 }}>👥</span>
                    <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Chưa phân công nhân sự cho sự kiện này</p>
                </div>
            ) : (
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên nhân sự</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s, i) => {
                                const roleCfg = {
                                    manager: { label: "Quản lý", cls: "badge-admin" },
                                    marketing: { label: "Marketing", cls: "badge-warning" },
                                    technical: { label: "Kỹ thuật", cls: "badge-organizer" },
                                    support: { label: "Hỗ trợ", cls: "badge-info" },
                                    volunteer: { label: "Tình nguyện viên", cls: "badge-default" },
                                }[s.role] || { label: s.role || "—", cls: "badge-default" };

                                return (
                                    <tr key={s.id} style={{ transition: "background 0.2s" }}>
                                        <td style={{ color: "var(--text-muted)", width: 50 }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                            <span style={{ marginRight: 8 }}>👤</span>
                                            {s.user_name || "—"}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{s.user_email || "—"}</td>
                                        <td>
                                            <span className={`badge ${roleCfg.cls}`} style={{ padding: "5px 12px", borderRadius: 6, fontWeight: 700 }}>
                                                {roleCfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
