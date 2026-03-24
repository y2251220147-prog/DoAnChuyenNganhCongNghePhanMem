import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { getEvents } from "../../services/eventService";
import { deleteFeedback, getFeedback, submitFeedback } from "../../services/feedbackService";
import "../../styles/global.css";

const RATINGS = ["😞", "😐", "🙂", "😊", "🤩"];

export default function Feedback() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === "admin" || user?.role === "organizer";

    const [tab, setTab] = useState(isAdmin ? "view" : "submit");
    const [events, setEvents] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [form, setForm] = useState({ event_id: "", name: "", email: "", rating: 5, message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getEvents().then(r => setEvents(r.data || [])).catch(() => { });
        if (isAdmin) loadFeedback();
    }, []);

    const loadFeedback = async () => {
        setLoadingList(true);
        try { const r = await getFeedback(); setFeedbackList(r.data || []); }
        catch {/***/ }
        finally { setLoadingList(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError("");
        if (!form.message.trim()) return setError("Please enter your feedback.");
        setSubmitting(true);
        try {
            await submitFeedback(form);
            setSubmitted(true);
        } catch (err) { setError(err.response?.data?.message || "Submit failed"); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this feedback?")) return;
        try { await deleteFeedback(id); setFeedbackList(prev => prev.filter(f => f.id !== id)); }
        catch { alert("Delete failed"); }
    };

    const avgRating = feedbackList.length > 0
        ? (feedbackList.reduce((s, f) => s + Number(f.rating), 0) / feedbackList.length).toFixed(1)
        : "—";

    if (submitted) return (
        <Layout>
            <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Thank you!</h2>
                <p style={{ color: "var(--text-secondary)" }}>Your feedback has been submitted successfully.</p>
                <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => { setSubmitted(false); setForm({ event_id: "", name: "", email: "", rating: 5, message: "" }); }}>
                    Submit Another
                </button>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2>Feedback</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Event feedback and ratings
                    </p>
                </div>
                {isAdmin && (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button className={`btn ${tab === "view" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("view")}>
                            View All
                        </button>
                        <button className={`btn ${tab === "submit" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("submit")}>
                            Submit Feedback
                        </button>
                    </div>
                )}
            </div>

            {/* Admin view */}
            {tab === "view" && isAdmin && (
                <>
                    <div className="grid-2" style={{ marginBottom: "24px" }}>
                        <div className="card-stat">
                            <div className="card-stat-icon indigo">💬</div>
                            <div className="card-stat-info"><h3>{feedbackList.length}</h3><p>Total Responses</p></div>
                        </div>
                        <div className="card-stat">
                            <div className="card-stat-icon amber">⭐</div>
                            <div className="card-stat-info"><h3>{avgRating}</h3><p>Average Rating</p></div>
                        </div>
                    </div>
                    <div className="data-table-wrapper">
                        {loadingList ? (
                            <div className="empty-state"><span>⏳</span><p>Loading...</p></div>
                        ) : feedbackList.length === 0 ? (
                            <div className="empty-state"><span>💬</span><p>No feedback yet.</p></div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>#</th><th>Name</th><th>Event</th><th>Rating</th><th>Message</th><th>Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {feedbackList.map((f, i) => (
                                        <tr key={f.id}>
                                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{f.name || "Anonymous"}</td>
                                            <td><span className="badge badge-default">{f.event_name || "General"}</span></td>
                                            <td>{RATINGS[(f.rating || 5) - 1]} {f.rating}/5</td>
                                            <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{f.message}</td>
                                            <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{new Date(f.created_at).toLocaleDateString("vi-VN")}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Submit form */}
            {tab === "submit" && (
                <div style={{ maxWidth: 600 }}>
                    <div className="card">
                        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Event (Optional)</label>
                                <select className="form-control" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}>
                                    <option value="">-- General Feedback --</option>
                                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                                </select>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Your Name (Optional)</label>
                                    <input className="form-control" placeholder="Nguyen Van A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email (Optional)</label>
                                    <input type="email" className="form-control" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Overall Rating</label>
                                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                    {RATINGS.map((emoji, idx) => (
                                        <button key={idx} type="button"
                                            onClick={() => setForm({ ...form, rating: idx + 1 })}
                                            style={{ fontSize: "1.8rem", background: form.rating === idx + 1 ? "rgba(99,102,241,0.12)" : "var(--bg-main)", border: form.rating === idx + 1 ? "2px solid var(--color-primary)" : "2px solid transparent", borderRadius: 12, padding: "8px 12px", cursor: "pointer", transition: "all 0.15s" }}>
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Your Feedback *</label>
                                <textarea className="form-control" rows={5} placeholder="Tell us what you think..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                                {submitting ? "Submitting..." : "💬 Submit Feedback"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
