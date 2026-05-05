import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import { getMyRegistrations } from "../../services/attendeeService";
import { getEvents } from "../../services/eventService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/global.css";

const DAYS_VN = ["T2","T3","T4","T5","T6","T7","CN"]; // Monday first

const fmtTime = d => d ? new Date(d).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }) : "";

export default function EmployeeCalendar() {
    const [myRegs, setMyRegs]   = useState([]);
    const [allEvents, setAll]   = useState([]);
    const [unread, setUnread]   = useState(0);
    const [currDate, setCurr]   = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSel] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [evRes, regRes, notifRes] = await Promise.all([
                    getEvents().catch(() => ({ data: [] })),
                    getMyRegistrations().catch(() => ({ data: [] })),
                    getNotifications().catch(() => ({ data: [] })),
                ]);
                setAll(evRes.data || []);
                setMyRegs(regRes.data || []);
                setUnread((notifRes.data || []).filter(n => !n.read_at).length);
            } catch { /**/ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const year  = currDate.getFullYear();
    const month = currDate.getMonth();

    const monthName = new Intl.DateTimeFormat("vi-VN", { month:"long", year:"numeric" }).format(currDate);

    const totalDays = new Date(year, month + 1, 0).getDate();
    const rawFirst = new Date(year, month, 1).getDay(); // 0=Sun
    const monOffset = rawFirst === 0 ? 6 : rawFirst - 1; // Mon=0, Tue=1, ... Sun=6

    const myRegDays = new Set();
    myRegs.forEach(r => {
        if (!r.start_date) return;
        const d = new Date(r.start_date);
        if (d.getFullYear() === year && d.getMonth() === month) myRegDays.add(d.getDate());
    });

    const anyEventDays = new Set();
    allEvents.forEach(ev => {
        if (!ev.start_date) return;
        const d = new Date(ev.start_date);
        if (d.getFullYear() === year && d.getMonth() === month) anyEventDays.add(d.getDate());
    });

    const today = new Date();
    const isToday = (d) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;

    const monthEvents = allEvents.filter(ev => {
        if (!ev.start_date) return false;
        const d = new Date(ev.start_date);
        return d.getFullYear()===year && d.getMonth()===month;
    });

    const displayedEvents = selectedDay
        ? monthEvents.filter(ev => new Date(ev.start_date).getDate() === selectedDay)
        : monthEvents;

    const myRegEventIds = new Set(myRegs.map(r => r.event_id));

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>Lịch Sự kiện</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Theo dõi lộ trình các hoạt động trong tháng {monthName}</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" style={{ borderRadius: 12, height: 44 }} onClick={() => { setSel(null); setCurr(new Date(year, month-1, 1)); }}>← Tháng trước</button>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 44 }} onClick={() => { setSel(null); setCurr(new Date()); }}>Tháng hiện tại</button>
                    <button className="btn btn-outline" style={{ borderRadius: 12, height: 44 }} onClick={() => { setSel(null); setCurr(new Date(year, month+1, 1)); }}>Tháng sau →</button>
                </div>
            </div>

            <div className="grid-2-1" style={{ gap: 32 }}>
                <div className="card" style={{ padding: 32, borderRadius: 28, background: "#fff", border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{monthName}</h3>
                        {selectedDay && (
                            <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 8 }} onClick={() => setSel(null)}>Bỏ chọn ngày</button>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#f1f5f9", border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
                        {DAYS_VN.map(d => (
                            <div key={d} style={{ background: "#f8fafc", textAlign: "center", padding: "12px 0", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{d}</div>
                        ))}
                        
                        {Array.from({ length: monOffset }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ background: "#fff", minHeight: 80 }} />
                        ))}

                        {Array.from({ length: totalDays }).map((_, i) => {
                            const d = i + 1;
                            const today_ = isToday(d);
                            const sel_ = selectedDay === d;
                            const has_ = anyEventDays.has(d);
                            const mine_ = myRegDays.has(d);

                            return (
                                <div key={d} 
                                    onClick={() => setSel(prev => prev === d ? null : d)}
                                    style={{ 
                                        background: sel_ ? "var(--bg-main)" : "#fff",
                                        minHeight: 100, padding: 12, cursor: "pointer", position: "relative",
                                        transition: "all 0.2s",
                                        border: sel_ ? "2px solid var(--color-primary)" : "none",
                                        zIndex: sel_ ? 2 : 1
                                    }}>
                                    <span style={{ 
                                        fontSize: 14, fontWeight: 800, 
                                        color: today_ ? "var(--color-primary)" : "var(--text-primary)",
                                        display: "flex", width: 28, height: 28, alignItems: "center", justifyContent: "center",
                                        borderRadius: "50%", background: today_ ? "var(--bg-main)" : "transparent"
                                    }}>{d}</span>
                                    
                                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {mine_ && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} title="Đã đăng ký" />}
                                        {has_ && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)" }} title="Có sự kiện" />}
                                    </div>

                                    {mine_ && (
                                        <div style={{ 
                                            marginTop: 12, fontSize: 10, fontWeight: 700, color: "#059669", background: "#ecfdf5", 
                                            padding: "4px 8px", borderRadius: 6, display: "inline-block" 
                                        }}>Đã đăng ký</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)" }} /> Có sự kiện
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} /> Đã đăng ký
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--bg-main)", border: "1px solid var(--color-primary)" }} /> Hôm nay
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 32, borderRadius: 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                        {selectedDay ? `Ngày ${selectedDay} / ${month + 1}` : "Tất cả sự kiện tháng này"}
                    </h3>

                    {displayedEvents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                            <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Không có sự kiện nào được ghi nhận.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {displayedEvents.map(ev => {
                                const isReg = myRegEventIds.has(ev.id);
                                return (
                                    <div key={ev.id} className="card" style={{ padding: 20, borderRadius: 20, background: isReg ? "linear-gradient(to right, #f8fafc, #fff)" : "#fff", border: isReg ? "1px solid #e2e8f0" : "1px solid #f1f5f9" }}>
                                        <div style={{ display: "flex", gap: 16 }}>
                                            <div style={{ 
                                                width: 52, height: 52, borderRadius: 14, background: "var(--bg-main)", flexShrink: 0,
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>{new Date(ev.start_date).getDate()}</div>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(new Date(ev.start_date))}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{ev.name}</h4>
                                                <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 12 }}>
                                                    <span>🕒 {fmtTime(ev.start_date)}</span>
                                                    {ev.location && <span>📍 {ev.location}</span>}
                                                </div>
                                                {isReg && (
                                                    <div style={{ marginTop: 12 }}>
                                                        <span className="badge badge-success" style={{ fontSize: 10 }}>✓ Đã đăng ký tham gia</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
