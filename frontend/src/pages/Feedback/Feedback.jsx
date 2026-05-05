import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { deleteFeedback, getFeedback, submitFeedback } from "../../services/feedbackService";
import "../../styles/global.css";

const RATINGS = [
    { emoji: "😞", label: "Rất tệ",   score: 1, color: "#ef4444", bg: "#fef2f2" },
    { emoji: "😐", label: "Tạm",      score: 2, color: "#f97316", bg: "#fff7ed" },
    { emoji: "🙂", label: "Ổn",       score: 3, color: "#eab308", bg: "#fefce8" },
    { emoji: "😊", label: "Tốt",      score: 4, color: "#84cc16", bg: "#f7fee7" },
    { emoji: "🤩", label: "Tuyệt vời",score: 5, color: "#10b981", bg: "#ecfdf5" },
];

function EmployeeFeedbackForm({ events }) {
    const { user } = useContext(AuthContext);
    const [form, setForm] = useState({
        event_id: "", name: user?.name || "", email: user?.email || "", rating: 5, message: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault(); setError("");
        if (!form.message.trim()) return setError("Vui lòng nhập nội dung phản hồi.");
        setSubmitting(true);
        try {
            await submitFeedback(form);
            setSubmitted(true);
        } catch (err) { setError(err.response?.data?.message || "Gửi thất bại, vui lòng thử lại."); }
        finally { setSubmitting(false); }
    };

    if (submitted) return (
        <div className="card" style={{ textAlign: "center", padding: "64px 32px", borderRadius: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>✨</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Cảm ơn bạn đã phản hồi!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>Ý kiến đóng góp của bạn là nguồn động lực vô cùng quý giá để chúng tôi cải thiện hệ thống.</p>
            <button className="btn btn-primary" style={{ height: 52, padding: "0 32px", borderRadius: 14, fontWeight: 800 }}
                onClick={() => { setSubmitted(false); setForm({ event_id: "", name: user?.name || "", email: user?.email || "", rating: 5, message: "" }); }}>
                Gửi phản hồi khác
            </button>
        </div>
    );

    return (
        <div className="card" style={{ padding: 40, borderRadius: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 16, padding: "16px 20px", fontSize: 14, fontWeight: 700 }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className="grid-2" style={{ gap: 24 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 700, marginBottom: 10, display: "block" }}>Bạn muốn phản hồi cho?</label>
                        <select className="form-control" style={{ height: 52, borderRadius: 14 }} value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                            <option value="">🌐 Hệ thống / Phản hồi chung</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>📅 {ev.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 700, marginBottom: 10, display: "block" }}>Email (Nếu cần phản hồi lại)</label>
                        <input type="email" className="form-control" style={{ height: 52, borderRadius: 14 }} placeholder="your@email.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ fontWeight: 700, marginBottom: 20, display: "block", textAlign: "center", fontSize: 16 }}>Trải nghiệm của bạn như thế nào?</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
                        {RATINGS.map(r => (
                            <button key={r.score} type="button"
                                onClick={() => setForm({ ...form, rating: r.score })}
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                                    padding: "24px 16px", borderRadius: 20, cursor: "pointer", transition: "all 0.2s",
                                    background: form.rating === r.score ? r.bg : "var(--bg-main)",
                                    border: `2px solid ${form.rating === r.score ? r.color : "transparent"}`,
                                    boxShadow: form.rating === r.score ? `0 8px 16px ${r.color}20` : "none",
                                }}>
                                <span style={{ fontSize: 40 }}>{r.emoji}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: form.rating === r.score ? r.color : "var(--text-muted)", textTransform: "uppercase" }}>{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ fontWeight: 700, marginBottom: 10, display: "block" }}>Chi tiết ý kiến của bạn</label>
                    <textarea
                        className="form-control"
                        rows={6}
                        placeholder="Hãy chia sẻ những điều bạn thích hoặc những điểm chúng tôi cần cải thiện..."
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        required
                        style={{ borderRadius: 16, padding: 20, fontSize: 15, lineHeight: 1.6 }}
                    />
                </div>

                <button type="submit" className="btn btn-primary"
                    style={{ height: 60, borderRadius: 16, fontSize: 16, fontWeight: 800, boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)" }}
                    disabled={submitting}>
                    {submitting ? "Đang gửi..." : "GỬI PHẢN HỒI NGAY"}
                </button>
            </form>
        </div>
    );
}

function AdminFeedbackView({ events }) {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFeedback().then(r => setFeedbackList(r.data || [])).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Xoá phản hồi này?")) return;
        try { await deleteFeedback(id); setFeedbackList(prev => prev.filter(f => f.id !== id)); }
        catch { alert("Xoá thất bại"); }
    };

    const avg = feedbackList.length > 0
        ? (feedbackList.reduce((s, f) => s + Number(f.rating), 0) / feedbackList.length).toFixed(1)
        : "—";

    return (
        <>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>💬 Quản lý Phản hồi</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Theo dõi ý kiến đóng góp để nâng cao chất lượng tổ chức</p>
                </div>
            </div>

            <div className="grid-3" style={{ gap: 24, marginBottom: 40 }}>
                <div className="card" style={{ padding: 28, borderRadius: 24, border: "none", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff" }}>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>{feedbackList.length}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, textTransform: "uppercase" }}>Tổng số phản hồi</div>
                </div>
                <div className="card" style={{ padding: 28, borderRadius: 24, border: "none", background: "#fefce8" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#eab308" }}>{avg} / 5</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#854f0b", textTransform: "uppercase" }}>Điểm trung bình</div>
                </div>
                <div className="card" style={{ padding: 28, borderRadius: 24, border: "none", background: "#ecfdf5" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#10b981" }}>100%</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>Tỷ lệ phản hồi tốt</div>
                </div>
            </div>

            <div className="card" style={{ borderRadius: 24, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>Danh sách ý kiến đóng góp</h3>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                    {loading ? (
                        <div style={{ padding: 80, textAlign: "center" }}>⏳ Đang tải...</div>
                    ) : feedbackList.length === 0 ? (
                        <div style={{ padding: 80, textAlign: "center", color: "var(--text-secondary)" }}>Chưa có phản hồi nào.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 32 }}>Người gửi</th>
                                    <th>Sự kiện</th>
                                    <th>Đánh giá</th>
                                    <th style={{ width: "35%" }}>Nội dung</th>
                                    <th>Ngày gửi</th>
                                    <th style={{ textAlign: "right", paddingRight: 32 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedbackList.map((f) => (
                                    <tr key={f.id}>
                                        <td style={{ paddingLeft: 32 }}>
                                            <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{f.name || "Ẩn danh"}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{f.email || "—"}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-admin" style={{ fontSize: 10 }}>{f.event_name || "Hệ thống"}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                                                <span>{RATINGS[(f.rating || 5) - 1]?.emoji}</span>
                                                <span>{f.rating}/5</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                            {f.message}
                                        </td>
                                        <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{new Date(f.created_at).toLocaleDateString("vi-VN")}</td>
                                        <td style={{ textAlign: "right", paddingRight: 32 }}>
                                            <button className="btn btn-outline" style={{ height: 36, color: "#ef4444", borderColor: "#fee2e2", fontSize: 12 }} onClick={() => handleDelete(f.id)}>Xoá</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Feedback() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === "admin" || user?.role === "organizer";
    const [events, setEvents] = useState([]);

    useEffect(() => {
        getEvents().then(r => setEvents(r.data || [])).catch(() => {});
    }, []);

    return (
        <Layout>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {isAdmin ? (
                    <AdminFeedbackView events={events} />
                ) : (
                    <>
                        <div className="page-header" style={{ marginBottom: 32 }}>
                            <div>
                                <h2 style={{ fontSize: 28, fontWeight: 800 }}>💌 Gửi phản hồi</h2>
                                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Chia sẻ trải nghiệm của bạn để chúng tôi phục vụ tốt hơn</p>
                            </div>
                        </div>
                        <div style={{ maxWidth: 800, margin: "0 auto" }}>
                            <EmployeeFeedbackForm events={events} />
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
