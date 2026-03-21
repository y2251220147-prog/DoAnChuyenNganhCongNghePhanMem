import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function AddGuest() {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/guests", {
                event_id: 1, // Static event ID as per original logic
                ...formData
            });
            setMessage({ text: "Thêm khách mời thành công!", type: "success" });
            setTimeout(() => navigate("/guests"), 1500);
        } catch (err) {
            setMessage({ 
                text: err.response?.data?.message || "Có lỗi xảy ra", 
                type: "error" 
            });
        }
    };

    return (
        <Layout>
            <h2 className="page-title">Thêm khách mời mới</h2>

            <div className="profile-container" style={{ maxWidth: "500px" }}>
                <div className="profile-card">
                    <h3>🎫 Thông tin khách mời</h3>

                    {message.text && (
                        <div className={`alert alert-${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="form-group">
                            <label>Tên khách mời</label>
                            <input
                                className="form-control"
                                placeholder="Nhập tên"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Nhập email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                className="form-control"
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                            <button type="submit" className="btn btn-primary">
                                ➕ Thêm khách mời
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel" 
                                style={{ marginLeft: "10px" }}
                                onClick={() => navigate("/guests")}
                            >
                                Huỷ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}