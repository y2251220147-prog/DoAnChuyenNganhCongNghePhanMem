import React from "react";

export default function EventTimeline({ timeline }) {
    const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit"
    }) : "—";

    return (
        <div className="card" style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            boxShadow: "var(--shadow-md)"
        }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🗓️</span> Lịch trình sự kiện
            </h3>

            {timeline.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <span style={{ fontSize: 40 }}>🗓️</span>
                    <p style={{ marginTop: 10, color: "var(--text-muted)" }}>Chưa có lịch trình nào được tạo</p>
                </div>
            ) : (
                <div style={{ position: "relative", paddingLeft: 36, paddingTop: 8 }}>
                    {/* Đường kẻ dọc của timeline */}
                    <div style={{
                        position: "absolute", left: 15, top: 12, bottom: 12,
                        width: 3, background: "linear-gradient(to bottom, var(--color-primary-light), var(--color-primary))",
                        borderRadius: 999
                    }} />

                    {timeline.map((item, i) => (
                        <div key={item.id} style={{ position: "relative", marginBottom: i < timeline.length - 1 ? 30 : 0 }}>
                            {/* Nốt tròn trên timeline */}
                            <div style={{
                                position: "absolute", left: -30, top: 4, width: 15, height: 15,
                                borderRadius: "50%", background: "white",
                                border: "4px solid var(--color-primary)",
                                boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.2)",
                                zIndex: 2,
                                transition: "transform 0.2s ease"
                            }} className="timeline-dot" />

                            <div style={{
                                background: "#f8fafc",
                                border: "1px solid var(--border-color)",
                                borderRadius: 12,
                                padding: "16px 20px",
                                boxShadow: "var(--shadow-sm)",
                                transition: "transform 0.2s ease, box-shadow 0.2s ease"
                            }} className="hover-lift">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{item.title}</span>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: "var(--color-primary)",
                                        background: "rgba(99, 102, 241, 0.1)", padding: "4px 10px", borderRadius: 6,
                                        whiteSpace: "nowrap"
                                    }}>
                                        {fmtDT(item.start_time)} {item.end_time && ` → ${fmtDT(item.end_time)}`}
                                    </span>
                                </div>
                                {item.description && (
                                    <p style={{
                                        fontSize: 13, color: "var(--text-secondary)",
                                        marginTop: 10, lineHeight: 1.6,
                                        borderTop: "1px solid #edf2f7", paddingTop: 8
                                    }}>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
