// import { useState } from "react";
// import { checkin } from "../../services/checkinService";

// export default function Checkin() {
//     const [qr, setQr] = useState("");
//     const [result, setResult] = useState(null);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [history, setHistory] = useState([]);

//     const handleCheckin = async (e) => {
//         e.preventDefault();
//         if (!qr.trim()) return;
//         setLoading(true);
//         setResult(null);
//         setError("");
//         try {
//             const res = await checkin(qr.trim());
//             setResult(res.data);
//             setHistory((prev) => [{ ...res.data.guest, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
//             setQr("");
//         } catch (err) {
//             setError(err.response?.data?.message || "Check-in failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
//             {/* Scanner */}
//             <div>
//                 <div style={{ marginBottom: 20 }}>
//                     <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Check-In</h2>
//                     <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Scan or enter a guest QR code</p>
//                 </div>
//                 <div className="form-card">
//                     <form onSubmit={handleCheckin}>
//                         <div className="form-group">
//                             <label>QR Code</label>
//                             <input
//                                 value={qr}
//                                 onChange={(e) => setQr(e.target.value)}
//                                 placeholder="Scan or type QR code…"
//                                 autoFocus
//                                 style={{ fontSize: "1rem", padding: "14px" }}
//                             />
//                         </div>
//                         <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} disabled={loading || !qr.trim()}>
//                             {loading ? "Processing…" : "✅ Check In Guest"}
//                         </button>
//                     </form>

//                     {result && (
//                         <div className="alert alert-success" style={{ marginTop: 16, fontSize: "0.9rem" }}>
//                             ✅ <strong>{result.guest?.name}</strong> checked in successfully!
//                         </div>
//                     )}
//                     {error && (
//                         <div className="alert alert-error" style={{ marginTop: 16 }}>
//                             ❌ {error}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* History */}
//             <div>
//                 <div style={{ marginBottom: 20 }}>
//                     <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Recent Check-Ins</h2>
//                     <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Last {history.length} check-ins this session</p>
//                 </div>
//                 <div className="section-card">
//                     {history.length === 0 ? (
//                         <div className="empty-state" style={{ padding: 40 }}>
//                             <div className="empty-state-icon">📋</div>
//                             <p>No check-ins yet this session</p>
//                         </div>
//                     ) : (
//                         history.map((h, i) => (
//                             <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
//                                 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                                     <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--success-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--success)" }}>
//                                         {h.name?.[0]?.toUpperCase()}
//                                     </div>
//                                     <div>
//                                         <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 2 }}>{h.name}</p>
//                                         <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{h.email || "—"}</p>
//                                     </div>
//                                 </div>
//                                 <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{h.time}</span>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
