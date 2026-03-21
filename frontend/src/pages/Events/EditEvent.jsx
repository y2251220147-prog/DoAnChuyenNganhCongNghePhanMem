import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        start_time: "",
        location: "",
        capacity: "",
        description: "",
        status: "",
        goal: "",
        event_type: "",
        theme: "",
        message: "",
        design_notes: "",
        contingency_plans: ""
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        api.get(`/events/${id}`)
            .then(res => {
                const data = res.data;
                if (data.date) data.date = data.date.substring(0, 10);
                // Ensure all fields have at least an empty string value for the inputs
                const cleanedData = { ...data };
                Object.keys(formData).forEach(key => {
                    if (cleanedData[key] === null) cleanedData[key] = "";
                });
                setFormData(cleanedData);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [id]);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/events/${id}`, formData);
            setMessage({ text: "Cập nhật thành công!", type: "success" });
            setTimeout(() => navigate(`/events/${id}`), 1500);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || "Lỗi", type: "error" });
        }
    };

    if (loading) return <Layout><div className="empty-state">Đang tải...</div></Layout>;

    return (
        <Layout>
            <h2 className="page-title">Chỉnh sửa thông tin sự kiện</h2>
            <div className="profile-container" style={{ maxWidth: "800px" }}>
                <div className="profile-card">
                    {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                    <form onSubmit={submit}>
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label>Tên sự kiện</label>
                                <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label>Ngày tổ chức</label>
                                    <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                                </div>
                                <div>
                                    <label>Giờ bắt đầu</label>
                                    <input type="time" className="form-control" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Địa điểm</label>
                                <input className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Trạng thái</label>
                                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="planned">Sắp diễn ra</option>
                                    <option value="ongoing">Đang diễn ra</option>
                                    <option value="completed">Đã kết thúc</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "20px" }}>
                            <label>Mô tả tổng quan</label>
                            <textarea className="form-control" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <hr style={{ margin: "25px 0", borderColor: "#334155" }} />
                        <h4 style={{ marginBottom: "15px", color: "#818cf8" }}>🎯 Thông tin chiến lược</h4>
                        
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label>Mục tiêu & Loại hình</label>
                                <input className="form-control" placeholder="Mục tiêu" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
                                <input className="form-control" style={{ marginTop: "10px" }} placeholder="Loại hình" value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chủ đề & Thông điệp</label>
                                <input className="form-control" placeholder="Chủ đề" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
                                <input className="form-control" style={{ marginTop: "10px" }} placeholder="Thông điệp" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "10px" }}>
                            <label>Dự phòng & Vận hành</label>
                            <textarea className="form-control" rows="2" placeholder="Thiết kế..." value={formData.design_notes} onChange={e => setFormData({...formData, design_notes: e.target.value})} />
                            <textarea className="form-control" style={{ marginTop: "10px" }} rows="2" placeholder="Dự phòng..." value={formData.contingency_plans} onChange={e => setFormData({...formData, contingency_plans: e.target.value})} />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">💾 Lưu thay đổi</button>
                            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Quay lại</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
