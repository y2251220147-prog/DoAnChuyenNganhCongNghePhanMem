// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { createTimeline } from "../../services/timelineService";
// import api from "../../services/api";

// export default function CreateTimeline() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({ event_id: "", title: "", start_time: "", end_time: "", description: "" });
//     const [events, setEvents] = useState([]);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     useEffect(() => { api.get("/events").then((r) => setEvents(r.data)); }, []);
//     const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//     const handleSubmit = async (e) => {
//         e.preventDefault(); setError(""); setLoading(true);
//         if (form.start_time >= form.end_time) { setError("Start time must be before end time"); setLoading(false); return; }
//         try { const res = await createTimeline(form); if (res.data.warning) alert("⚠️ " + res.data.warning); navigate("/timeline"); }
//         catch (err) { setError(err.response?.data?.message || "Failed"); }
//         finally { setLoading(false); }
//     };

//     return (
//         <div className="form-container">
//             <div className="form-page-header"><h2>Add Timeline Item</h2><p>Schedule a new activity for an event</p></div>
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
//                     <div className="form-group"><label>Activity Title *</label><input name="title" placeholder="e.g. Opening Ceremony" onChange={handleChange} required /></div>
//                     <div className="form-row">
//                         <div className="form-group"><label>Start Time *</label><input type="time" name="start_time" onChange={handleChange} required /></div>
//                         <div className="form-group"><label>End Time *</label><input type="time" name="end_time" onChange={handleChange} required /></div>
//                     </div>
//                     <div className="form-group"><label>Description</label><textarea name="description" rows={3} placeholder="What happens during this activity?" onChange={handleChange} /></div>
//                     <div className="form-actions">
//                         <button type="button" className="btn-secondary" onClick={() => navigate("/timeline")}>Cancel</button>
//                         <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Adding…" : "✅ Add Item"}</button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
