// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { createBudget } from "../../services/budgetService";
// import api from "../../services/api";

// export default function AddBudget() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({ event_id: "", item: "", cost: "", note: "" });
//     const [events, setEvents] = useState([]);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     useEffect(() => { api.get("/events").then((r) => setEvents(r.data)); }, []);
//     const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//     const handleSubmit = async (e) => {
//         e.preventDefault(); setError(""); setLoading(true);
//         try { await createBudget(form); navigate("/budget"); }
//         catch (err) { setError(err.response?.data?.message || "Failed"); }
//         finally { setLoading(false); }
//     };

//     return (
//         <div className="form-container">
//             <div className="form-page-header"><h2>Add Budget Item</h2><p>Add a new expense to an event budget</p></div>
//             {error && <div className="alert alert-error">⚠️ {error}</div>}
//             <div className="form-card">
//                 <form onSubmit={handleSubmit}>
//                     <div className="form-group">
//                         <label>Event *</label>
//                         <select name="event_id" onChange={handleChange} required>
//                             <option value="">— Select Event —</option>
//                             {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
//                         </select>
//                     </div>
//                     <div className="form-row">
//                         <div className="form-group"><label>Item Name *</label><input name="item" placeholder="e.g. Venue, Catering, AV…" onChange={handleChange} required /></div>
//                         <div className="form-group"><label>Cost (₫) *</label><input type="number" name="cost" placeholder="0" min="0" onChange={handleChange} required /></div>
//                     </div>
//                     <div className="form-group"><label>Note</label><textarea name="note" rows={2} placeholder="Additional notes…" onChange={handleChange} /></div>
//                     <div className="form-actions">
//                         <button type="button" className="btn-secondary" onClick={() => navigate("/budget")}>Cancel</button>
//                         <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Adding…" : "✅ Add Item"}</button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
