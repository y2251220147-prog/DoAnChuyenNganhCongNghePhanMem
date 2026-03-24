// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { assignStaff } from "../../services/staffService";
// import api from "../../services/api";

// export default function AssignStaff() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({ event_id: "", user_id: "", role: "" });
//     const [events, setEvents] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         Promise.all([api.get("/events"), api.get("/users")]).then(([ev, us]) => { setEvents(ev.data); setUsers(us.data); });
//     }, []);
//     const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//     const handleSubmit = async (e) => {
//         e.preventDefault(); setError(""); setLoading(true);
//         try { await assignStaff(form); navigate("/staff"); }
//         catch (err) { setError(err.response?.data?.message || "Failed"); }
//         finally { setLoading(false); }
//     };

//     return (
//         <div className="form-container">
//             <div className="form-page-header"><h2>Assign Staff</h2><p>Assign a user to an event with a specific role</p></div>
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
//                     <div className="form-group">
//                         <label>User *</label>
//                         <select name="user_id" onChange={handleChange} required>
//                             <option value="">— Select User —</option>
//                             {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
//                         </select>
//                     </div>
//                     <div className="form-group"><label>Role *</label><input name="role" placeholder="e.g. Registration, Security, AV, Catering…" onChange={handleChange} required /></div>
//                     <div className="form-actions">
//                         <button type="button" className="btn-secondary" onClick={() => navigate("/staff")}>Cancel</button>
//                         <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Assigning…" : "✅ Assign Staff"}</button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
