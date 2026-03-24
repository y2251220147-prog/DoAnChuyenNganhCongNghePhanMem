// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { updateEvent } from "../../services/eventService";
// import api from "../../services/api";

// export default function EditEvent() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [form, setForm] = useState({ name: "", date: "", location: "", description: "", status: "planned" });
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         api.get(`/events/${id}`).then((res) => {
//             const e = res.data;
//             setForm({
//                 name: e.name || "",
//                 date: e.date?.slice(0, 10) || "",
//                 location: e.location || "",
//                 description: e.description || "",
//                 status: e.status || "planned",
//             });
//             setLoading(false);
//         });
//     }, [id]);

//     const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             await updateEvent(id, form);
//             alert("Event updated!");
//             navigate("/events");
//         } catch (err) {
//             alert(err.response?.data?.message || "Update failed");
//         }
//     };

//     if (loading) return <div className="loading">Loading...</div>;

//     return (
//         <div className="form-container">
//             <h2>Edit Event</h2>
//             <form onSubmit={handleSubmit} className="form-card">
//                 <div className="form-group">
//                     <label>Event Name</label>
//                     <input name="name" value={form.name} onChange={handleChange} required />
//                 </div>
//                 <div className="form-group">
//                     <label>Date</label>
//                     <input type="date" name="date" value={form.date} onChange={handleChange} required />
//                 </div>
//                 <div className="form-group">
//                     <label>Location</label>
//                     <input name="location" value={form.location} onChange={handleChange} />
//                 </div>
//                 <div className="form-group">
//                     <label>Description</label>
//                     <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
//                 </div>
//                 <div className="form-group">
//                     <label>Status</label>
//                     <select name="status" value={form.status} onChange={handleChange}>
//                         <option value="planned">Planned</option>
//                         <option value="active">Active</option>
//                         <option value="completed">Completed</option>
//                         <option value="cancelled">Cancelled</option>
//                     </select>
//                 </div>
//                 <div className="form-actions">
//                     <button type="button" className="btn-secondary" onClick={() => navigate("/events")}>Cancel</button>
//                     <button type="submit" className="btn-primary">Save Changes</button>
//                 </div>
//             </form>
//         </div>
//     );
// }
