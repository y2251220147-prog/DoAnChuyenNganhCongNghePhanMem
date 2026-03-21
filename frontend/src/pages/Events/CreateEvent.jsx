import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function CreateEvent() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        start_time: "",
        location: "",
        capacity: "",
        description: "",
        goal: "",
        event_type: "",
        theme: "",
        message: "",
        design_notes: "",
        contingency_plans: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });

    const submit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/events", formData);
            setMessage({ text: "Tạo sự kiện thành công! Đang chuyển hướng...", type: "success" });
            setTimeout(() => navigate(`/events/${res.data.id}`), 1500);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || "Có lỗi xảy ra", type: "error" });
        }
    };

    return (
        <Layout>
            <h2 className="page-title">Khởi tạo sự kiện mới</h2>
            <div className="profile-container" style={{ maxWidth: "800px" }}>
                <div className="profile-card">
                    {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                    <form onSubmit={submit}>
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label>Tên sự kiện</label>
                                <input className="form-control" placeholder="Ví dụ: Hội nghị khách hàng 2024" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
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
                                <input className="form-control" placeholder="Khách sạn, văn phòng..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Quy mô (Số người)</label>
                                <input type="number" className="form-control" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "20px" }}>
                            <label>Mô tả tổng quan</label>
                            <textarea className="form-control" rows="2" placeholder="Giới thiệu ngắn gọn về sự kiện..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <hr style={{ margin: "25px 0", borderColor: "#334155" }} />
                        <h4 style={{ marginBottom: "15px", color: "#818cf8" }}>🎯 Thông tin chiến lược</h4>
                        
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label>Mục tiêu & Loại hình</label>
                                <input className="form-control" placeholder="Mục tiêu" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
                                <input className="form-control" style={{ marginTop: "10px" }} placeholder="Loại hình (Hội thảo, Gala...)" value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Chủ đề & Thông điệp</label>
                                <input className="form-control" placeholder="Chủ đề chính" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
                                <input className="form-control" style={{ marginTop: "10px" }} placeholder="Thông điệp truyền tải" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "20px" }}>
                            <label>Chi tiết Vận hành & Dự phòng</label>
                            <textarea className="form-control" rows="2" placeholder="Ghi chú thiết kế (Poster, Backdrop...)" value={formData.design_notes} onChange={e => setFormData({...formData, design_notes: e.target.value})} />
                            <textarea className="form-control" style={{ marginTop: "10px" }} rows="2" placeholder="Phương án dự phòng rủi ro..." value={formData.contingency_plans} onChange={e => setFormData({...formData, contingency_plans: e.target.value})} />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" style={{ padding: "10px 40px" }}>🚀 Tạo sự kiện</button>
                            <button type="button" className="btn-cancel" onClick={() => navigate("/events")}>Huỷ</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}