import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { AuthContext } from "../../context/AuthContext";
import { deleteEvent, getEvents, joinEvent } from "../../services/eventService";

export default function EventList() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const navigate = useNavigate();

    const loadEvents = async () => {
        try {
            const res = await getEvents();
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xoá sự kiện này?")) {
            await deleteEvent(id);
            loadEvents();
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            const res = await joinEvent({ event_code: joinCode.trim() });
            setMessage({ text: res.data.message, type: "success" });
            setTimeout(() => {
                setShowJoinModal(false);
                setJoinCode("");
                setMessage({ text: "", type: "" });
                navigate(`/events/${res.data.event_id}`);
            }, 1500);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || "Mã không hợp lệ", type: "error" });
        }
    };

    const filteredEvents = events.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.location?.toLowerCase().includes(search.toLowerCase())
    );

    const canManage = user?.role === "admin" || user?.role === "organizer";

    return (
        <Layout>
            <h2 className="page-title">Quản lý sự kiện chuyên nghiệp</h2>

            <div className="table-container">
                <div className="table-header">
                    <h3>Danh sách sự kiện ({filteredEvents.length})</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                            className="search-input"
                            placeholder="🔍 Tìm kiếm sự kiện..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-warning" onClick={() => setShowJoinModal(true)}>📲 Tham gia bằng mã</button>
                        {canManage && (
                            <button className="btn btn-primary" onClick={() => navigate("/events/create")}>➕ Tạo sự kiện</button>
                        )}
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tên sự kiện</th>
                            <th>Ngày</th>
                            <th>Địa điểm</th>
                            <th>Mã tham gia</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr><td colSpan="5"><div className="empty-state">Không có sự kiện nào</div></td></tr>
                        ) : (
                            filteredEvents.map((event) => (
                                <tr key={event.id} onClick={() => navigate(`/events/${event.id}`)} style={{ cursor: "pointer" }}>
                                    <td style={{ fontWeight: 600, color: "#818cf8" }}>{event.name}</td>
                                    <td>
                                        {event.date ? new Date(event.date).toLocaleDateString("vi-VN") : "Chưa xác định"}
                                        <br />
                                        <small style={{ color: "#64748b" }}>⏰ {event.start_time?.substring(0, 5) || "00:00"}</small>
                                    </td>
                                    <td>{event.location}</td>
                                    <td>
                                        {event.event_code ? (
                                            <code style={{ background: "rgba(129, 140, 248, 0.1)", padding: "4px 8px", borderRadius: "4px", color: "#818cf8", border: "1px solid rgba(129, 140, 248, 0.2)" }}>
                                                {event.event_code}
                                            </code>
                                        ) : (
                                            <span style={{ color: "#64748b", fontSize: "12px", fontStyle: "italic" }}>Chưa tạo mã</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-btns" style={{ display: "flex", gap: "5px" }}>
                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    navigate(`/events/${event.id}`); 
                                                }}
                                            >
                                                👀 Xem
                                            </button>
                                            {canManage && (
                                                <>
                                                    <button 
                                                        className="btn btn-warning btn-sm" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            navigate(`/events/edit/${event.id}`); 
                                                        }}
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger btn-sm" 
                                                        onClick={(e) => handleDelete(e, event.id)}
                                                    >
                                                        🗑️ Xoá
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* JOIN MODAL */}
            {showJoinModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: "400px" }}>
                        <h3>📲 Tham gia sự kiện</h3>
                        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Nhập mã sự kiện (8 ký tự) để đăng ký tham gia ngay.</p>
                        
                        {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                        <form onSubmit={handleJoin}>
                            <div className="form-group">
                                <label>Mã sự kiện</label>
                                <input 
                                    className="form-control" 
                                    style={{ textAlign: "center", fontSize: "20px", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase" }}
                                    placeholder="VÍ DỤ: XA7B9K2L"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    maxLength={8}
                                    required
                                />
                            </div>
                            <div className="form-actions" style={{ flexDirection: "column", gap: "10px" }}>
                                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>🚀 Tham gia ngay</button>
                                <button type="button" className="btn-cancel" style={{ width: "100%" }} onClick={() => { setShowJoinModal(false); setMessage({text:"", type:""}); }}>Huỷ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}