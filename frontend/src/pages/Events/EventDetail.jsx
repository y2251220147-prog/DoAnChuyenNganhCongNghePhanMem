import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

export default function EventDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    
    // Data states
    const [timeline, setTimeline] = useState([]);
    const [guests, setGuests] = useState([]);
    const [staff, setStaff] = useState([]);
    const [budget, setBudget] = useState([]);
    const [partners, setPartners] = useState([]);
    const [communication, setCommunication] = useState([]);
    const [evaluation, setEvaluation] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadEventData = async () => {
        try {
            setLoading(true);
            const fetchData = async (url, setter) => {
                try {
                    const res = await api.get(url);
                    setter(res.data);
                } catch (err) {
                    console.warn(`Could not load ${url}`, err);
                    // Silently fail or set empty state to keep the page working
                }
            };

            await Promise.all([
                fetchData(`/events/${id}`, setEvent),
                fetchData(`/timeline/event/${id}`, setTimeline),
                fetchData(`/guests/event/${id}`, setGuests),
                fetchData(`/staff/event/${id}`, setStaff),
                fetchData(`/budget/event/${id}`, setBudget),
                fetchData(`/partners/event/${id}`, setPartners),
                fetchData(`/communication/event/${id}`, setCommunication),
                fetchData(`/evaluation/event/${id}`, setEvaluation),
                fetchData(`/events/${id}/participants`, setParticipants),
                fetchData(`/tasks/event/${id}`, setTasks)
            ]);
        } catch (err) {
            console.error("Critical error loading event", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = "";
            let data = { ...formData, event_id: id };

            if (modalType === 'timeline') endpoint = `/timeline/event/${id}`;
            else if (modalType === 'guest') endpoint = `/guests/event/${id}`;
            else if (modalType === 'staff') endpoint = `/staff/event/${id}`;
            else if (modalType === 'budget') endpoint = `/budget/event/${id}`;
            else if (modalType === 'partner') endpoint = `/partners/event/${id}`;
            else if (modalType === 'comm') endpoint = `/communication/event/${id}`;
            else if (modalType === 'eval') endpoint = `/evaluation/event/${id}`;
            else if (modalType === 'task') endpoint = "/tasks";

            await api.post(endpoint, data);
            setShowModal(false);
            setFormData({});
            loadEventData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi");
        }
    };

    const handleDelete = async (type, itemId) => {
        if (!window.confirm("Xoá mục này?")) return;
        try {
            let endpoint = `/${type === 'comm' ? 'communication' : type === 'eval' ? 'evaluation' : type}/${itemId}`;
            await api.delete(endpoint);
            loadEventData();
        } catch (err) {
            alert("Lỗi khi xoá");
        }
    };

    if (loading) return <Layout><div className="empty-state">Đang tải dữ liệu sự kiện...</div></Layout>;
    if (!event) return <Layout><div className="empty-state">Sự kiện không tồn tại</div></Layout>;

    const canManage = user?.role === "admin" || user?.role === "organizer";
    const totalBudget = budget.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);
    const isParticipant = participants.some(p => p.id === user?.id);

    return (
        <Layout>
            <div className="event-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
                <div>
                    <h2 className="page-title" style={{ marginBottom: "5px" }}>{event.name}</h2>
                    <p style={{ color: "#94a3b8" }}>
                        📅 {new Date(event.date).toLocaleDateString("vi-VN")} | ⏰ {event.start_time?.substring(0, 5) || "00:00"} | 📍 {event.location}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {!isParticipant && !canManage && (
                        <button className="btn btn-primary" onClick={async () => {
                            try {
                                await api.post("/events/join", { event_code: event.event_code });
                                alert("Tham gia thành công!");
                                loadEventData();
                            } catch (err) {
                                alert(err.response?.data?.message || "Lỗi khi tham gia");
                            }
                        }}>🚀 Tham gia ngay</button>
                    )}
                    {canManage && (
                        <button className="btn btn-warning" onClick={() => navigate(`/events/edit/${id}`)}>✏️ Chỉnh sửa sự kiện</button>
                    )}
                </div>
            </div>

            <div className="tabs-container">
                <div className="tabs-list" style={{ flexWrap: "wrap", borderBottom: "1px solid #334155" }}>
                    {[
                        { id: 'overview', label: '📊 Tổng quan' },
                        { id: 'timeline', label: '⏰ Lịch trình' },
                        { id: 'action', label: '🛠️ Triển khai' },
                        { id: 'participants', label: '👥 Tham gia' },
                        { id: 'resources', label: '🏢 Nguồn lực' },
                        { id: 'budget', label: '💰 Ngân sách' },
                        { id: 'strategy', label: '🎯 Chiến lược' }
                    ].map(tab => (
                        <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content" style={{ marginTop: "25px" }}>
                    {activeTab === 'timeline' && (
                        <div className="table-container">
                            <div className="table-header">
                                <h3>Lịch trình chi tiết</h3>
                                {canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("timeline"); setShowModal(true); }}>➕ Thêm phiên</button>}
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Thời gian</th><th>Hoạt động</th><th>Mô tả</th>{canManage && <th>Thao tác</th>}</tr>
                                </thead>
                                <tbody>
                                    {timeline.sort((a,b) => (a.start_time || "").localeCompare(b.start_time || "")).map(item => (
                                        <tr key={item.id}>
                                            <td style={{ color: "#818cf8", fontWeight: "600" }}>{item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}</td>
                                            <td><strong>{item.title}</strong></td>
                                            <td>{item.description || "N/A"}</td>
                                            {canManage && <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete("timeline", item.id)}>🗑️</button></td>}
                                        </tr>
                                    ))}
                                    {timeline.length === 0 && <tr><td colSpan={canManage ? 4 : 3} className="empty-state">Chưa có lịch trình</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "25px" }}>
                            <div className="profile-card">
                                <h3 style={{ marginBottom: "15px", color: "#818cf8" }}>Giới thiệu sự kiện</h3>
                                <p style={{ lineHeight: "1.6" }}>{event.description || "Chưa có mô tả chi tiết cho sự kiện này."}</p>
                                
                                <div className="stats-grid" style={{ marginTop: "25px", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                    <div className="stat-card" style={{ padding: "15px" }}>
                                        <label style={{ fontSize: "12px", color: "#94a3b8" }}>Quy mô</label>
                                        <p style={{ fontSize: "20px", fontWeight: "700" }}>{event.capacity || 0} khách</p>
                                    </div>
                                    <div className="stat-card" style={{ padding: "15px" }}>
                                        <label style={{ fontSize: "12px", color: "#94a3b8" }}>Trạng thái</label>
                                        <p><span className={`role-badge ${event.status === 'completed' ? 'user' : 'organizer'}`}>{event.status === 'completed' ? 'Đã kết thúc' : 'Đang triển khai'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-card" style={{ textAlign: "center", border: "1px dashed #475569" }}>
                                <h4 style={{ marginBottom: "15px" }}>Chia sẻ & Tham gia</h4>
                                <div style={{ background: "white", padding: "10px", borderRadius: "10px", margin: "0 auto 15px", width: "180px" }}>
                                    <img 
                                        src={event.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EVENT-${event.event_code || 'MISSING'}`} 
                                        alt="QR Code" 
                                        style={{ display: "block", width: "100%" }} 
                                    />
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#818cf8", letterSpacing: "3px" }}>
                                    {event.event_code || "N/A"}
                                </div>
                                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>Quét QR hoặc nhập mã để tham gia</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'action' && (
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                            {['Before', 'During', 'After'].map(phase => (
                                <div key={phase} className="profile-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                        <h3 style={{ color: phase === 'Before' ? '#818cf8' : phase === 'During' ? '#f59e0b' : '#10b981' }}>
                                            {phase === 'Before' ? 'Trước sự kiện' : phase === 'During' ? 'Trong sự kiện' : 'Sau sự kiện'}
                                        </h3>
                                        {canManage && (
                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                onClick={() => { 
                                                    setModalType("task"); 
                                                    setFormData({
                                                        task_name: "",
                                                        phase: phase,
                                                        due_date: "",
                                                        assigned_to: null
                                                    }); 
                                                    setShowModal(true); 
                                                }}
                                            >
                                                ➕
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {tasks.filter(t => t.phase === phase).map(task => (
                                            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={task.is_completed} 
                                                    onChange={async (e) => {
                                                        await api.put(`/tasks/${task.id}`, { is_completed: e.target.checked });
                                                        loadEventData();
                                                    }}
                                                    disabled={!canManage}
                                                />
                                                <span style={{ textDecoration: task.is_completed ? "line-through" : "none", color: task.is_completed ? "#64748b" : "#e2e8f0", fontSize: "14px" }}>{task.task_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'participants' && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                            <div className="table-container">
                                <div className="table-header"><h3>Danh sách khách mời</h3>{canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("guest"); setShowModal(true); }}>➕</button>}</div>
                                <table className="data-table">
                                    <thead><tr><th>Tên</th><th>Liên hệ</th></tr></thead>
                                    <tbody>{guests.map(g => (<tr key={g.id}><td>{g.name}</td><td>{g.email}</td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="table-container">
                                <div className="table-header"><h3>Check-in tự do (QR/Code)</h3></div>
                                <table className="data-table">
                                    <thead><tr><th>Người tham gia</th><th>Thời gian</th></tr></thead>
                                    <tbody>{participants.map(p => (<tr key={p.id}><td>{p.name}</td><td>{new Date(p.joined_at).toLocaleTimeString()}</td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                            <div className="table-container">
                                <div className="table-header"><h3>Đội ngũ tổ chức</h3>{canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("staff"); setShowModal(true); }}>➕</button>}</div>
                                <table className="data-table">
                                    <thead><tr><th>Thành viên</th><th>Vai trò</th></tr></thead>
                                    <tbody>{staff.map(s => (<tr key={s.id}><td>{s.staff_name}</td><td><span className="role-badge user">{s.role}</span></td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="table-container">
                                <div className="table-header"><h3>Đối tác & tài trợ</h3>{canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("partner"); setShowModal(true); }}>➕</button>}</div>
                                <table className="data-table">
                                    <thead><tr><th>Đối tác</th><th>Loại</th></tr></thead>
                                    <tbody>{partners.map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.type}</td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'budget' && (
                        <div className="table-container">
                            <div className="table-header">
                                <h3>Quản lý ngân sách (Mục tiêu 15% dự phòng)</h3>
                                {canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("budget"); setShowModal(true); }}>➕ Thêm hạng mục</button>}
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Hạng mục</th><th>Chi phí (VNĐ)</th>{canManage && <th>Thao tác</th>}</tr>
                                </thead>
                                <tbody>
                                    {budget.map(b => (
                                        <tr key={b.id}>
                                            <td>{b.item} {b.category && <small style={{ color: "#64748b" }}>({b.category})</small>}</td>
                                            <td style={{ color: "#10b981", fontWeight: "700" }}>{parseFloat(b.cost).toLocaleString()}</td>
                                            {canManage && <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete("budget", b.id)}>🗑️</button></td>}
                                        </tr>
                                    ))}
                                    <tr style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                                        <td style={{ textAlign: "right", fontWeight: "600", color: "#f59e0b" }}>CHI PHÍ DỰ PHÒNG RỦI RO (15%):</td>
                                        <td style={{ color: "#f59e0b", fontWeight: "700" }}>{(totalBudget * 0.15).toLocaleString()} VNĐ</td>
                                    </tr>
                                    <tr style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                                        <td style={{ textAlign: "right", fontWeight: "700" }}>TỔNG DỰ TOÁN CHIẾN LƯỢC:</td>
                                        <td style={{ color: "#10b981", fontWeight: "800", fontSize: "1.1rem" }}>{(totalBudget * 1.15).toLocaleString()} VNĐ</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'strategy' && (
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="profile-card">
                                <h3>🎯 Tầm nhìn chiến lược</h3>
                                <p><strong>Mục tiêu:</strong> {event.goal || "Chưa xác định"}</p>
                                <p><strong>Loại hình:</strong> {event.event_type || "Chưa xác định"}</p>
                                <p><strong>Chủ đề:</strong> {event.theme || "Chưa xác định"}</p>
                                <p><strong>Thông điệp:</strong> {event.message || "Chưa xác định"}</p>
                            </div>
                            <div className="profile-card">
                                <h3>📊 Đánh giá tổng kết & KPIs</h3>
                                {evaluation.length === 0 ? (
                                    <div className="empty-state" style={{ minHeight: "100px" }}>
                                        <p>Chưa có báo cáo tổng kết</p>
                                        {canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("eval"); setShowModal(true); }}>Tạo báo cáo</button>}
                                    </div>
                                ) : (
                                    evaluation.map(ev => (
                                        <div key={ev.id}>
                                            <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                <div className="stat-card" style={{ padding: "10px" }}>
                                                    <label style={{ fontSize: "11px" }}>Tỷ lệ tham dự</label>
                                                    <p style={{ fontSize: "16px", fontWeight: "700", color: "#818cf8" }}>
                                                        {ev.invited_count > 0 ? Math.round((ev.attended_count/ev.invited_count)*100) : 0}% 
                                                        ({ev.attended_count}/{ev.invited_count})
                                                    </p>
                                                </div>
                                                <div className="stat-card" style={{ padding: "10px" }}>
                                                    <label style={{ fontSize: "11px" }}>Chuyển đổi (Conversion)</label>
                                                    <p style={{ fontSize: "16px", fontWeight: "700", color: "#10b981" }}>{ev.conversion_count} khách</p>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: "15px" }}>
                                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#818cf8" }}>Bài học kinh nghiệm:</label>
                                                <p style={{ fontSize: "13px", color: "#94a3b8" }}>{ev.lesson_learned || "N/A"}</p>
                                            </div>
                                            <div style={{ marginTop: "10px" }}>
                                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#f59e0b" }}>Brand Recall Score:</label>
                                                <div style={{ width: "100%", height: "8px", background: "#1e293b", borderRadius: "10px", marginTop: "5px" }}>
                                                    <div style={{ width: `${ev.brand_recall_score}%`, height: "100%", background: "#f59e0b", borderRadius: "10px" }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="table-container" style={{ gridColumn: "span 2" }}>
                                <div className="table-header"><h3>Kế hoạch truyền thông</h3>{canManage && <button className="btn btn-primary btn-sm" onClick={() => { setModalType("comm"); setShowModal(true); }}>➕</button>}</div>
                                <table className="data-table">
                                    <thead><tr><th>Kênh</th><th>Hoạt động</th><th>Trạng thái</th></tr></thead>
                                    <tbody>{communication.map(c => (<tr key={c.id}><td>{c.channel}</td><td>{c.activity}</td><td>{c.status}</td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SHARED MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Thêm {modalType} mới</h3>
                        <form onSubmit={handleFormSubmit}>
                            {modalType === 'task' && (
                                <>
                                    <div className="form-group"><label>Nhiệm vụ</label><input className="form-control" onChange={e => setFormData({...formData, task_name: e.target.value})} required /></div>
                                    <div className="form-group"><label>Hạn hoàn thành</label><input type="date" className="form-control" onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
                                </>
                            )}
                            {modalType === 'eval' && (
                                <>
                                    <div className="form-group"><label>Số lượng thư mời</label><input type="number" className="form-control" onChange={e => setFormData({...formData, invited_count: e.target.value})} required /></div>
                                    <div className="form-group"><label>Số lượng tham dự thực tế</label><input type="number" className="form-control" onChange={e => setFormData({...formData, attended_count: e.target.value})} required /></div>
                                    <div className="form-group"><label>Số lượng khách ký HĐ/mua hàng</label><input type="number" className="form-control" onChange={e => setFormData({...formData, conversion_count: e.target.value})} /></div>
                                    <div className="form-group"><label>Điểm nhận biết thương hiệu (%)</label><input type="number" className="form-control" onChange={e => setFormData({...formData, brand_recall_score: e.target.value})} /></div>
                                    <div className="form-group"><label>Bài học kinh nghiệm</label><textarea className="form-control" onChange={e => setFormData({...formData, lesson_learned: e.target.value})} /></div>
                                </>
                            )}
                            {modalType === 'partner' && (
                                <>
                                    <div className="form-group"><label>Tên đối tác</label><input className="form-control" onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                                    <div className="form-group"><label>Phân loại</label><input className="form-control" onChange={e => setFormData({...formData, type: e.target.value})} /></div>
                                </>
                            )}
                            {modalType === 'comm' && (
                                <>
                                    <div className="form-group"><label>Kênh truyền thông</label><input className="form-control" onChange={e => setFormData({...formData, channel: e.target.value})} required /></div>
                                    <div className="form-group"><label>Hoạt động cụ thể</label><textarea className="form-control" onChange={e => setFormData({...formData, activity: e.target.value})} required /></div>
                                    <div className="form-group"><label>Trạng thái</label><input className="form-control" onChange={e => setFormData({...formData, status: e.target.value})} /></div>
                                </>
                            )}
                            {modalType === 'staff' && (
                                <>
                                    <div className="form-group"><label>User ID</label><input type="number" className="form-control" onChange={e => setFormData({...formData, user_id: e.target.value})} required /></div>
                                    <div className="form-group"><label>Vai trò</label><input className="form-control" onChange={e => setFormData({...formData, role: e.target.value})} required /></div>
                                </>
                            )}
                             {modalType === 'budget' && (
                                <>
                                    <div className="form-group"><label>Hạng mục</label><input className="form-control" onChange={e => setFormData({...formData, item: e.target.value})} required /></div>
                                    <div className="form-group"><label>Giá (VNĐ)</label><input type="number" className="form-control" onChange={e => setFormData({...formData, cost: e.target.value})} required /></div>
                                </>
                            )}
                            {modalType === 'timeline' && (
                                <>
                                    <div className="form-group"><label>Tiêu đề</label><input className="form-control" onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                                    <div className="form-group"><label>Bắt đầu</label><input type="time" className="form-control" onChange={e => setFormData({...formData, start_time: e.target.value})} required /></div>
                                    <div className="form-group"><label>Kết thúc</label><input type="time" className="form-control" onChange={e => setFormData({...formData, end_time: e.target.value})} required /></div>
                                </>
                            )}
                             {modalType === 'guest' && (
                                <>
                                    <div className="form-group"><label>Họ tên</label><input className="form-control" onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                                    <div className="form-group"><label>Email</label><input type="email" className="form-control" onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                </>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Lưu</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Huỷ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}