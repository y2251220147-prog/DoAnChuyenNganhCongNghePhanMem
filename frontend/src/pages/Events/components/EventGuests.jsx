import React, { useState } from "react";

export default function EventGuests({ guests }) {
    const [search, setSearch] = useState("");

    const checkedIn = guests.filter(g => g.checked_in).length;
    const filteredGuests = guests.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        (g.phone && g.phone.includes(search))
    );

    return (
        <div className="card" style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(6, 182, 212, 0.1)",
            boxShadow: "var(--shadow-md)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>🎟️</span> Danh sách khách mời
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Tổng số: {guests.length} | Đã check-in: <strong style={{ color: "var(--color-success)" }}>{checkedIn}</strong>
                    </p>
                </div>
                <input
                    className="form-control"
                    placeholder="🔍 Tìm khách mời..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 260, borderRadius: 8, height: 38 }}
                />
            </div>

            {filteredGuests.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <span style={{ fontSize: 40 }}>🎟️</span>
                    <p style={{ marginTop: 10, color: "var(--text-muted)" }}>
                        {guests.length === 0 ? "Chưa có khách mời nào" : "Không tìm thấy khách mời phù hợp"}
                    </p>
                </div>
            ) : (
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.map((g, i) => (
                                <tr key={g.id} style={{ transition: "background 0.2s" }}>
                                    <td style={{ color: "var(--text-muted)", width: 50 }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                        <span style={{ marginRight: 8 }}>{g.checked_in ? "✅" : "⏳"}</span>
                                        {g.name}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>{g.email}</td>
                                    <td style={{ color: "var(--text-secondary)" }}>{g.phone || "—"}</td>
                                    <td>
                                        {g.checked_in
                                            ? <span className="badge badge-success" style={{ padding: "4px 12px", borderRadius: 6, fontWeight: 700 }}>Đã check-in</span>
                                            : <span className="badge badge-default" style={{ padding: "4px 12px", borderRadius: 6, fontWeight: 700 }}>Chờ</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
