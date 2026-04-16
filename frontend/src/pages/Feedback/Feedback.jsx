import { useContext, useEffect, useState } from "react";

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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {error && (
                <div style={{ background: "var(--emp-red-bg)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--emp-red)", borderRadius: "var(--emp-radius-sm)", padding: "12px 16px", marginBottom: 0, fontSize: 13 }}>
                    ⚠️ {error}
                </div>
            )}

            <div className="grid-2" style={{ gap: 20 }}>
                <div className="emp-form-group" style={{ marginBottom: 0 }}>
                    <label className="emp-form-label">Tên sự kiện</label>
                    <select className="emp-form-input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                        <option value="">— Đánh giá hệ thống / Phản hồi chung —</option>
                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                </div>
                <div className="emp-form-group" style={{ marginBottom: 0 }}>
                    <label className="emp-form-label">Email liên hệ (tuỳ chọn)</label>
                    <input type="email" className="emp-form-input" placeholder="nguyenvan@congty.vn"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
            </div>

            <div className="emp-form-group">
                <label className="emp-form-label">Bạn cảm thấy thế nào về trải nghiệm này?</label>
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
                    {RATINGS.map(r => (
                        <button key={r.score} type="button"
                            onClick={() => setForm({ ...form, rating: r.score })}
                            style={{
                                flex: 1, minWidth: 100,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                fontSize: 32, padding: "20px 14px", borderRadius: 16, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: form.rating === r.score ? "var(--emp-accent-light)" : "var(--emp-surface2)",
                                border: form.rating === r.score ? "2px solid var(--emp-accent)" : "2px solid transparent",
                                transform: form.rating === r.score ? "translateY(-4px)" : "none",
                                boxShadow: form.rating === r.score ? "0 10px 20px -5px rgba(108,114,255,0.3)" : "none",
                            }}>
                            {r.emoji}
                            <span style={{ fontSize: 11, color: form.rating === r.score ? "var(--emp-accent)" : "var(--emp-text3)", fontWeight: 800, textTransform: "uppercase" }}>{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="emp-form-group">
                <label className="emp-form-label">Chia sẻ chi tiết cảm nghĩ của bạn</label>
                <textarea
                    className="emp-form-input"
                    rows={6}
                    placeholder="Những điều bạn hài lòng hoặc cần chúng tôi cải thiện..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                    style={{ resize: "vertical", padding: 16, fontSize: 15 }}
                />
            </div>

            <button type="submit" className="emp-btn emp-btn-primary"
                style={{ width: "100%", justifyContent: "center", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, boxShadow: "0 4px 12px rgba(108,114,255,0.2)" }}
                disabled={submitting}>
                {submitting ? "Đang xử lý..." : "💬 GỬI PHẢN HỒI NGAY"}
            </button>
        </form>
    );
}

// ── Admin/Organizer Feedback View ────────────────────────────────────────────
function AdminFeedbackView({ events }) {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("view");
    const [form, setForm] = useState({ event_id: "", name: "", email: "", rating: 5, message: "" });

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
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">💬 Quản lý Phản hồi</h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                        Lắng nghe ý kiến từ nhân viên để cải thiện chất lượng tổ chức.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12, padding: 6, background: "#f1f5f9", borderRadius: 14 }}>
                    <button className={`btn ${tab === "view" ? "btn-primary" : "btn-outline"}`} style={{ border: "none", boxShadow: tab === "view" ? "var(--shadow-sm)" : "none", borderRadius: 10 }} onClick={() => setTab("view")}>Danh sách</button>
                    <button className={`btn ${tab === "submit" ? "btn-primary" : "btn-outline"}`} style={{ border: "none", boxShadow: tab === "submit" ? "var(--shadow-sm)" : "none", borderRadius: 10 }} onClick={() => setTab("submit")}>Gửi thử</button>
                </div>
            </div>

            {tab === "view" ? (
                <>
                    <div className="grid-2" style={{ marginBottom: 28, gap: 20 }}>
                        <div className="card-stat" style={{ background: "linear-gradient(135deg, #fff 0%, #f5f3ff 100%)", border: "1px solid #e2e8f0" }}>
                            <div className="card-stat-icon indigo" style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}>💬</div>
                            <div className="card-stat-info">
                                <h3 style={{ fontSize: 26, fontWeight: 900 }}>{feedbackList.length}</h3>
                                <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Tổng phản hồi</p>
                            </div>
                        </div>
                        <div className="card-stat" style={{ background: "linear-gradient(135deg, #fff 0%, #fffbeb 100%)", border: "1px solid #e2e8f0" }}>
                            <div className="card-stat-icon amber" style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}>⭐</div>
                            <div className="card-stat-info">
                                <h3 style={{ fontSize: 26, fontWeight: 900 }}>{avg}</h3>
                                <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Điểm trung bình</p>
                            </div>
                        </div>
                    </div>
                    <div className="data-table-wrapper" style={{ boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                        {loading ? <div className="empty-state"><span>⏳</span><p>Đang tải dữ liệu...</p></div>
                            : feedbackList.length === 0 ? <div className="empty-state"><span>💬</span><p>Chưa có phản hồi nào được ghi nhận.</p></div>
                            : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 24 }}>Người gửi</th>
                                            <th>Sự kiện liên quan</th>
                                            <th>Đánh giá</th>
                                            <th>Nội dung chi tiết</th>
                                            <th>Ngày gửi</th>
                                            <th style={{ textAlign: "right", paddingRight: 24 }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbackList.map((f) => (
                                            <tr key={f.id}>
                                                <td style={{ paddingLeft: 24 }}>
                                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{f.name || "Người dùng ẩn danh"}</div>
                                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.email || "Không để lại email"}</div>
                                                </td>
                                                <td><span className="badge badge-default" style={{ borderRadius: 8, padding: "4px 10px", fontWeight: 700 }}>{f.event_name?.toUpperCase() || "HỆ THỐNG"}</span></td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}>
                                                        <span style={{ fontSize: 18 }}>{RATINGS[(f.rating || 5) - 1]?.emoji}</span>
                                                        <span>{f.rating}/5</span>
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: 300, color: "var(--text-secondary)", fontSize: 14 }}>
                                                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>
                                                        {f.message}
                                                    </div>
                                                </td>
                                                <td style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{new Date(f.created_at).toLocaleDateString("vi-VN")}</td>
                                                <td style={{ textAlign: "right", paddingRight: 24 }}>
                                                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(f.id)} style={{ color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 8 }}>🗑 Xóa</button>
                                                </td>
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
