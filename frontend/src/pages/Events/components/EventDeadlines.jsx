import React from "react";

export default function EventDeadlines({ deadlines, canManage, handleToggleDl, handleDeleteDl, setDlModal }) {
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN") : "—";

    return (
        <div className="card" style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(239, 68, 68, 0.1)",
            boxShadow: "var(--shadow-md)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-danger)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>🔥</span> Deadlines nội bộ
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Các mốc quan trọng trước ngày diễn ra sự kiện
                    </p>
                </div>
                {canManage && (
                    <button className="btn btn-primary btn-sm" onClick={() => setDlModal(true)} style={{ borderRadius: 8 }}>
                        + Thêm deadline
                    </button>
                )}
            </div>

            {deadlines.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <span style={{ fontSize: 40 }}>🏜️</span>
                    <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Chưa có deadline nào được thiết lập</p>
                </div>
            ) : (
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hạng mục</th>
                                <th>Hạn chót</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                                {canManage && <th style={{ textAlign: "right" }}>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {deadlines.map(dl => {
                                const overdue = !dl.done && new Date(dl.due_date) < new Date();
                                return (
                                    <tr key={dl.id} style={{ transition: "background 0.2s" }}>
                                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{dl.title}</td>
                                        <td style={{
                                            color: overdue ? "#dc2626" : "var(--text-primary)",
                                            fontWeight: overdue ? 700 : 500
                                        }}>
                                            {fmtDT(dl.due_date)} {overdue && "⚠️"}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{dl.note || "—"}</td>
                                        <td>
                                            {dl.done
                                                ? <span className="badge badge-success" style={{ padding: "4px 10px", fontWeight: 700 }}>✅ Hoàn thành</span>
                                                : overdue
                                                    ? <span className="badge badge-danger" style={{ padding: "4px 10px", fontWeight: 700 }}>🔴 Trễ hạn</span>
                                                    : <span className="badge badge-default" style={{ padding: "4px 10px", fontWeight: 700 }}>⏳ Chờ</span>
                                            }
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className="actions" style={{ justifyContent: "flex-end" }}>
                                                    <button
                                                        className={`btn btn-sm ${dl.done ? "btn-outline" : "btn-success"}`}
                                                        onClick={() => handleToggleDl(dl.id, dl.done)}
                                                        style={{ padding: "4px 10px", borderRadius: 6 }}
                                                    >
                                                        {dl.done ? "↩ Hoàn tác" : "✓ Xong"}
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleDeleteDl(dl.id)}
                                                        style={{ padding: "4px 8px", borderRadius: 6 }}
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </td>
                                        )}
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
