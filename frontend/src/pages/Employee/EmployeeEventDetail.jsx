import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { selfRegister, removeAttendee, getMyRegistrations } from "../../services/attendeeService";
import "../../styles/employee-theme.css";

const STATUS_MAP = {
    draft:     { label: "Chưa mở",         cls: "emp-badge-gray" },
    planning:  { label: "Lên kế hoạch",     cls: "emp-badge-amber" },
    approved:  { label: "Đã duyệt",         cls: "emp-badge-purple" },
    running:   { label: "Đang diễn ra",     cls: "emp-badge-green" },
    completed: { label: "Đã kết thúc",      cls: "emp-badge-gray" },
    cancelled: { label: "Đã huỷ",           cls: "emp-badge-red" },
};

const fmtDT = d => d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtTime = d => {
    if (!d) return "";
    if (typeof d === "string" && d.match(/^\d{2}:\d{2}:\d{2}$/)) return d.substring(0, 5);
    try {
        const dt = new Date(d);
        if (!isNaN(dt)) return dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { }
    return d;
};

// QR ảnh thật dùng free API
function QRImage({ value, size = 200 }) {
    if (!value) return null;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
    return <img src={url} alt="QR Code" width={size} height={size} style={{ display: "block", borderRadius: 10 }} />;
}

export default function EmployeeEventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [myReg, setMyReg] = useState(null); // Thông tin đăng ký của user hiện tại
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [evR, tlR, regR] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/timeline/event/${id}`),
                getMyRegistrations()
            ]);
            setEvent(evR.data);
            setTimeline(tlR.data || []);
            
            // Tìm xem user đã đăng ký event này chưa
            const regs = regR.data || [];
            const existingReg = regs.find(r => String(r.event_id) === String(id));
            setMyReg(existingReg || null);
        } catch {
            setError("Lỗi khi tải thông tin sự kiện.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!["approved", "running"].includes(event.status)) return;
        setBusy(true);
        try {
            const res = await selfRegister(id);
            setMyReg({ id: res.data.id, qr_code: res.data.qr_code, event_id: id });
            alert("Đăng ký thành công!");
        } catch (err) {
            alert(err?.response?.data?.message || "Đăng ký thất bại");
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm(`Huỷ đăng ký "${event.name}"?`)) return;
        setBusy(true);
        try {
            await removeAttendee(myReg.id);
            setMyReg(null);
            alert("Đã huỷ đăng ký.");
        } catch (err) {
            alert(err?.response?.data?.message || "Huỷ thất bại");
        } finally {
            setBusy(false);
        }
    };

    if (loading) return (
        <EmployeeLayout>
            <div className="emp-empty"><div className="emp-empty-icon">⏳</div><p>Đang tải...</p></div>
        </EmployeeLayout>
    );

    if (error || !event) return (
        <EmployeeLayout>
            <div className="emp-empty"><div className="emp-empty-icon">⚠️</div><p>{error || "Không tìm thấy sự kiện."}</p></div>
        </EmployeeLayout>
    );

    const s = STATUS_MAP[event.status] || STATUS_MAP.draft;
    const canReg = ["approved","running"].includes(event.status);

    return (
        <EmployeeLayout>
            <div className="emp-sec-header">
                <h2>Chi tiết sự kiện</h2>
                <button className="emp-btn-ghost" onClick={() => navigate(-1)}>← Quay lại</button>
            </div>

            {/* Banner sự kiện */}
            <div className="emp-panel" style={{ marginBottom: 20, padding: 24, background: "linear-gradient(135deg, var(--emp-surface2), var(--emp-surface3))" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <span className={`emp-badge ${s.cls}`}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--emp-text3)", textTransform: "uppercase", padding: "4px 0" }}>
                        {event.event_type || "Sự kiện"}
                    </span>
                    {event.venue_type === "online" && <span className="emp-badge emp-badge-purple">🌐 Online</span>}
                </div>
                
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--emp-text)", marginBottom: 12 }}>{event.name}</h1>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", color: "var(--emp-text2)", fontSize: 13, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📅</span> {fmtDT(event.start_date)} {event.end_date && ` - ${fmtDT(event.end_date)}`}
                    </div>
                    {event.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>📍</span> {event.location}
                        </div>
                    )}
                    {event.capacity > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>👥</span> Sức chứa: {event.capacity} người
                        </div>
                    )}
                </div>

                {event.description && (
                    <div style={{ 
                        background: "var(--emp-surface)", padding: 16, borderRadius: 8, 
                        fontSize: 14, lineHeight: 1.6, color: "var(--emp-text2)" 
                    }}>
                        {event.description}
                    </div>
                )}

                <div style={{ display: "flex", marginTop: 24, gap: 12 }}>
                    {myReg ? (
                        <button className="emp-btn emp-btn-cancel" disabled={busy} onClick={handleCancel}>
                            {busy ? "..." : "Huỷ đăng ký"}
                        </button>
                    ) : canReg ? (
                        <button className="emp-btn emp-btn-primary" disabled={busy} onClick={handleRegister}>
                            {busy ? "..." : "Tham gia sự kiện"}
                        </button>
                    ) : (
                        <button className="emp-btn emp-btn-outline" disabled style={{ opacity: 0.5 }}>
                            Chưa mở đăng ký
                        </button>
                    )}
                </div>
            </div>

            {/* Vé QR — hiện khi đã đăng ký */}
            {myReg && myReg.qr_code && (
                <div className="emp-panel" style={{ marginBottom: 20, padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        🎟️ Vé check-in của bạn
                    </h3>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                        {/* QR ảnh */}
                        <div style={{ background: "#fff", padding: 14, borderRadius: 14, border: "2px solid var(--emp-border2)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", flexShrink: 0 }}>
                            <QRImage value={myReg.qr_code} size={160} />
                        </div>
                        {/* Thông tin vé */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 13, color: "var(--emp-text3)", marginBottom: 6 }}>Mã vé của bạn:</div>
                            <div style={{ fontFamily: "var(--emp-mono)", fontSize: 11, color: "var(--emp-accent)", wordBreak: "break-all", background: "var(--emp-surface2)", padding: "8px 12px", borderRadius: 8, marginBottom: 14, lineHeight: 1.5 }}>
                                {myReg.qr_code}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--emp-text3)", lineHeight: 1.6, marginBottom: 14 }}>
                                📋 Xuất trình mã QR này tại cửa check-in sự kiện.<br/>
                                ⚠️ Mã QR duy nhất cho bạn — không chia sẻ với người khác.
                            </p>
                            <button className="emp-btn emp-btn-outline" style={{ fontSize: 13 }}
                                onClick={() => {
                                    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(myReg.qr_code)}&margin=14`;
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `QR-${event.name?.replace(/\s/g,"_")}.png`;
                                    a.click();
                                }}>
                                ⬇️ Tải ảnh QR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Lịch trình */}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🗓️ Lịch trình dự kiến</h3>
            {timeline.length === 0 ? (
                <div className="emp-panel emp-empty" style={{ padding: "30px 20px" }}>
                    <span style={{ fontSize: 24, opacity: 0.5 }}>🗓️</span>
                    <p style={{ marginTop: 10 }}>Sự kiện này chưa có lịch trình chi tiết.</p>
                </div>
            ) : (
                <div className="emp-panel" style={{ padding: "0" }}>
                    {timeline.map((item, i) => (
                        <div key={item.id} style={{ 
                            display: "flex", padding: 16, 
                            borderBottom: i < timeline.length - 1 ? "1px solid var(--emp-border)" : "none" 
                        }}>
                            <div style={{ width: 100, flexShrink: 0, fontWeight: 600, color: "var(--emp-accent)" }}>
                                {fmtTime(item.start_time)}
                                {item.end_time && <><br/><span style={{ fontSize: 11, color: "var(--emp-text3)", fontWeight: 400 }}>đến {fmtTime(item.end_time)}</span></>}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                                {item.description && <div style={{ fontSize: 13, color: "var(--emp-text2)" }}>{item.description}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </EmployeeLayout>
    );
}
