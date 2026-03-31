import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { deleteFeedback, getFeedback, submitFeedback } from "../../services/feedbackService";
import "../../styles/global.css";
import "../../styles/employee-theme.css";

const RATINGS = [
    { emoji: "😞", label: "Rất tệ",   score: 1 },
    { emoji: "😐", label: "Tạm",      score: 2 },
    { emoji: "🙂", label: "Ổn",       score: 3 },
    { emoji: "😊", label: "Tốt",      score: 4 },
    { emoji: "🤩", label: "Tuyệt vời",score: 5 },
];

// ── Employee Feedback Form (dark theme) ──────────────────────────────────────
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
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Cảm ơn bạn!</div>
            <p style={{ color: "var(--emp-text2)", marginBottom: 24 }}>Phản hồi của bạn đã được ghi nhận thành công.</p>
            <button className="emp-btn emp-btn-primary"
                onClick={() => { setSubmitted(false); setForm({ event_id: "", name: user?.name || "", email: user?.email || "", rating: 5, message: "" }); }}>
                Gửi phản hồi khác
            </button>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div style={{ background: "var(--emp-red-bg)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--emp-red)", borderRadius: "var(--emp-radius-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Event picker */}
            <div className="emp-form-group">
                <label className="emp-form-label">Sự kiện (tuỳ chọn)</label>
                <select className="emp-form-input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                    <option value="">— Phản hồi chung —</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>

            {/* Name + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div className="emp-form-group" style={{ marginBottom: 0 }}>
                    <label className="emp-form-label">Họ tên của bạn</label>
                    <input className="emp-form-input" placeholder="Nguyễn Văn A"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="emp-form-group" style={{ marginBottom: 0 }}>
                    <label className="emp-form-label">Email</label>
                    <input type="email" className="emp-form-input" placeholder="ban@congty.vn"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
            </div>

            {/* Rating */}
            <div className="emp-form-group">
                <label className="emp-form-label">Đánh giá tổng thể</label>
                <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                    {RATINGS.map(r => (
                        <button key={r.score} type="button"
                            onClick={() => setForm({ ...form, rating: r.score })}
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                fontSize: 26, padding: "10px 14px", borderRadius: "var(--emp-radius-sm)", cursor: "pointer", transition: "all 0.15s",
                                background: form.rating === r.score ? "var(--emp-accent-light)" : "var(--emp-surface2)",
                                border: form.rating === r.score ? "2px solid var(--emp-accent)" : "2px solid transparent",
                                boxShadow: form.rating === r.score ? "0 0 12px var(--emp-accent-glow)" : "none",
                            }}>
                            {r.emoji}
                            <span style={{ fontSize: 10, color: form.rating === r.score ? "var(--emp-accent)" : "var(--emp-text3)", fontWeight: 600 }}>{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Message */}
            <div className="emp-form-group">
                <label className="emp-form-label">Nội dung phản hồi *</label>
                <textarea
                    className="emp-form-input"
                    rows={5}
                    placeholder="Chia sẻ trải nghiệm của bạn về sự kiện này..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                    style={{ resize: "vertical" }}
                />
            </div>

            <button type="submit" className="emp-btn emp-btn-primary"
                style={{ width: "100%", justifyContent: "center", borderRadius: "var(--emp-radius-sm)", padding: "12px" }}
                disabled={submitting}>
                {submitting ? "Đang gửi..." : "💬 Gửi phản hồi"}
            </button>
        </form>
    );
}

// ── Admin/Organizer Feedback View ────────────────────────────────────────────
function AdminFeedbackView({ events }) {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("view");
    const [form, setForm] = useState({ event_id: "", name: "", email: "", rating: 5, message: "" });

    useEffect(() => {
        setLoading(true);
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
            <div className="page-header">
                <div><h2>Phản hồi &amp; Đánh giá</h2><p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Xem tất cả phản hồi từ nhân viên</p></div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className={`btn ${tab === "view" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("view")}>Danh sách</button>
                    <button className={`btn ${tab === "submit" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("submit")}>Gửi phản hồi</button>
                </div>
            </div>

            {tab === "view" ? (
                <>
                    <div className="grid-2" style={{ marginBottom: 24 }}>
                        <div className="card-stat"><div className="card-stat-icon indigo">💬</div><div className="card-stat-info"><h3>{feedbackList.length}</h3><p>Tổng phản hồi</p></div></div>
                        <div className="card-stat"><div className="card-stat-icon amber">⭐</div><div className="card-stat-info"><h3>{avg}</h3><p>Điểm TB</p></div></div>
                    </div>
                    <div className="data-table-wrapper">
                        {loading ? <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                            : feedbackList.length === 0 ? <div className="empty-state"><span>💬</span><p>Chưa có phản hồi nào.</p></div>
                            : (
                                <table className="data-table">
                                    <thead><tr><th>#</th><th>Tên</th><th>Sự kiện</th><th>ĐG</th><th>Nội dung</th><th>Ngày</th><th></th></tr></thead>
                                    <tbody>
                                        {feedbackList.map((f, i) => (
                                            <tr key={f.id}>
                                                <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{f.name || "Ẩn danh"}</td>
                                                <td><span className="badge badge-default">{f.event_name || "Chung"}</span></td>
                                                <td>{RATINGS[(f.rating || 5) - 1]?.emoji} {f.rating}/5</td>
                                                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{f.message}</td>
                                                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(f.created_at).toLocaleDateString("vi-VN")}</td>
                                                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                    </div>
                </>
            ) : (
                <div style={{ maxWidth: 600 }}>
                    <div className="card">
                        <EmployeeFeedbackFormInline form={form} setForm={setForm} events={events} />
                    </div>
                </div>
            )}
        </>
    );
}

function EmployeeFeedbackFormInline({ form, setForm, events }) {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.message.trim()) return setError("Vui lòng nhập nội dung.");
        setSubmitting(true);
        try { await submitFeedback(form); setSubmitted(true); }
        catch (err) { setError(err.response?.data?.message || "Gửi thất bại"); }
        finally { setSubmitting(false); }
    };

    if (submitted) return <div style={{ textAlign: "center", padding: 24 }}><div style={{ fontSize: 48 }}>🎉</div><p>Đã gửi phản hồi!</p></div>;

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
                <label>Sự kiện</label>
                <select className="form-control" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                    <option value="">— Chung —</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Nội dung *</label>
                <textarea className="form-control" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Đang gửi..." : "💬 Gửi phản hồi"}
            </button>
        </form>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Feedback() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === "admin" || user?.role === "organizer";
    const [events, setEvents] = useState([]);

    useEffect(() => {
        getEvents().then(r => setEvents(r.data || [])).catch(() => {});
    }, []);

    if (isAdmin) {
        return (
            <Layout>
                <AdminFeedbackView events={events} />
            </Layout>
        );
    }

    // User role — wrap nằm trong EmployeeLayout (via smart Layout)
    return (
        <Layout title="Gửi phản hồi" subtitle="Chia sẻ trải nghiệm của bạn về các sự kiện">
            {/* Hero header */}
            <div style={{
                background: "linear-gradient(135deg, var(--emp-surface2) 0%, rgba(108,114,255,0.08) 100%)",
                border: "1px solid var(--emp-border)",
                borderRadius: "var(--emp-radius)",
                padding: "24px 28px",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 16,
            }}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--emp-radius)", background: "var(--emp-accent-light)", border: "1px solid rgba(108,114,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💬</div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Phản hồi sự kiện</div>
                    <div style={{ fontSize: 13, color: "var(--emp-text2)" }}>Đánh giá của bạn giúp chúng tôi cải thiện chất lượng sự kiện nội bộ.</div>
                </div>
            </div>

            {/* Form card */}
            <div className="emp-panel">
                <EmployeeFeedbackForm events={events} />
            </div>
        </Layout>
    );
}
