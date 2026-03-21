import { useState } from "react";

const RATINGS = ["😞", "😐", "🙂", "😊", "🤩"];

export default function Feedback() {
    const [form, setForm] = useState({ name: "", email: "", rating: 5, message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) return (
        <div style={{ maxWidth: 500, textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Thank you!</h2>
            <p style={{ color: "var(--text-secondary)" }}>Your feedback has been submitted successfully.</p>
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => setSubmitted(false)}>Submit Another</button>
        </div>
    );

    return (
        <div className="form-container">
            <div className="form-page-header">
                <h2>Event Feedback</h2>
                <p>We'd love to hear your thoughts about the event</p>
            </div>
            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Your Name</label>
                            <input placeholder="Nguyen Van A" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="you@email.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Overall Rating</label>
                        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                            {RATINGS.map((emoji, idx) => (
                                <button key={idx} type="button"
                                    onClick={() => setForm({ ...form, rating: idx + 1 })}
                                    style={{
                                        fontSize: "1.8rem",
                                        background: form.rating === idx + 1 ? "var(--primary-light)" : "var(--surface-2)",
                                        border: form.rating === idx + 1 ? "2px solid var(--primary)" : "2px solid transparent",
                                        borderRadius: 12, padding: "8px 12px", cursor: "pointer",
                                        transition: "var(--transition)",
                                    }}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Your Feedback *</label>
                        <textarea
                            rows={5}
                            placeholder="Tell us what you think about the event…"
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">💬 Submit Feedback</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
