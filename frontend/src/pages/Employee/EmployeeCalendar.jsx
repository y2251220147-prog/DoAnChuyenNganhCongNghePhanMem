import { useEffect, useState, useCallback } from "react";
import EmployeeLayout from "../../components/Layout/EmployeeLayout";
import { getMyRegistrations } from "../../services/attendeeService";
import { getEvents } from "../../services/eventService";
import { getNotifications } from "../../services/notificationService";
import "../../styles/employee-theme.css";

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

    // Days in month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // First weekday of month (0=Sun...6=Sat) → convert to Mon-first offset
    const rawFirst = new Date(year, month, 1).getDay(); // 0=Sun
    const monOffset = rawFirst === 0 ? 6 : rawFirst - 1; // Mon=0, Tue=1, ... Sun=6

    // Build a set of days (in current month) that have events I registered for
    const myRegDays = new Set();
    myRegs.forEach(r => {
        if (!r.start_date) return;
        const d = new Date(r.start_date);
        if (d.getFullYear() === year && d.getMonth() === month) myRegDays.add(d.getDate());
    });

    // Days that have ANY event (approved/running)
    const anyEventDays = new Set();
    allEvents.forEach(ev => {
        if (!ev.start_date) return;
        const d = new Date(ev.start_date);
        if (d.getFullYear() === year && d.getMonth() === month) anyEventDays.add(d.getDate());
    });

    const today = new Date();
    const isToday = (d) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;

    // Events in this month (for the bottom list)
    const monthEvents = allEvents.filter(ev => {
        if (!ev.start_date) return false;
        const d = new Date(ev.start_date);
        return d.getFullYear()===year && d.getMonth()===month;
    });

    // If a day is selected, show only that day's events; otherwise show all month events
    const displayedEvents = selectedDay
        ? monthEvents.filter(ev => new Date(ev.start_date).getDate() === selectedDay)
        : monthEvents;

    const myRegEventIds = new Set(myRegs.map(r => r.event_id));

    return (
        <EmployeeLayout
            title={`Lịch ${monthName}`}
            subtitle="Theo dõi lịch trình sự kiện hàng tháng"
            unreadCount={unread}
        >
            {loading ? (
                <div className="emp-empty"><div className="emp-empty-icon">⏳</div><p>Đang tải lịch...</p></div>
            ) : (
                <>
                    {/* Month nav */}
                    <div className="emp-sec-header" style={{ marginBottom:20 }}>
                        <div style={{ display:"flex", gap:8 }}>
                            <button className="emp-btn emp-btn-outline emp-btn-sm"
                                onClick={() => { setSel(null); setCurr(new Date(year, month-1, 1)); }}>
                                ← Tháng trước
                            </button>
                            <button className="emp-btn emp-btn-outline emp-btn-sm"
                                onClick={() => { setSel(null); setCurr(new Date(year, month+1, 1)); }}>
                                Tháng sau →
                            </button>
                        </div>
                        {selectedDay && (
                            <button className="emp-btn-ghost" onClick={() => setSel(null)}>
                                ✕ Bỏ chọn ngày {selectedDay}
                            </button>
                        )}
                    </div>

                    {/* Calendar grid */}
                    <div className="emp-panel" style={{ marginBottom:16 }}>
                        {/* Day headers — Monday first */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:10 }}>
                            {DAYS_VN.map(d => (
                                <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600, color:"var(--emp-text3)", padding:4, letterSpacing:"0.04em" }}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar cells */}
                        <div className="emp-cal-grid">
                            {/* Empty offset cells */}
                            {Array.from({ length: monOffset }).map((_, i) => (
                                <div key={`empty-${i}`} className="emp-cal-day other-month" />
                            ))}

                            {/* Day cells */}
                            {Array.from({ length: totalDays }).map((_, i) => {
                                const d = i + 1;
                                let cls = "emp-cal-day";
                                if (isToday(d)) cls += " today";
                                else if (myRegDays.has(d)) cls += " my-event";
                                if (anyEventDays.has(d)) cls += " has-event";
                                if (selectedDay === d) cls += " today"; // highlight selected

                                return (
                                    <div key={d} className={cls} onClick={() => setSel(prev => prev === d ? null : d)} title={anyEventDays.has(d) ? "Có sự kiện" : ""}>
                                        {d}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ display:"flex", gap:16, marginTop:16, paddingTop:12, borderTop:"1px solid var(--emp-border)" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--emp-text3)" }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--emp-accent)" }} />
                                Hôm nay
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--emp-text3)" }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--emp-accent-light)", border:"1px solid rgba(108,114,255,0.3)" }} />
                                Tôi đã đăng ký
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--emp-text3)" }}>
                                <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--emp-accent)" }} />
                                Có sự kiện
                            </div>
                        </div>
                    </div>

                    {/* Event list for month / selected day */}
                    <div>
                        <h3 style={{ fontSize:13, fontWeight:600, color:"var(--emp-text2)", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                            {selectedDay ? `Sự kiện ngày ${selectedDay}/${month+1}/${year}` : `Sự kiện trong tháng (${monthEvents.length})`}
                        </h3>

                        {displayedEvents.length === 0 ? (
                            <div className="emp-empty" style={{ padding:"32px 24px" }}>
                                <div className="emp-empty-icon" style={{ fontSize:28 }}>📅</div>
                                <p style={{ fontSize:13 }}>{selectedDay ? "Không có sự kiện ngày này." : "Không có sự kiện nào trong tháng này."}</p>
                            </div>
                        ) : (
                            <div className="emp-event-feed">
                                {displayedEvents.map(ev => {
                                    const isReg = myRegEventIds.has(ev.id);
                                    const att = myRegs.find(r => r.event_id === ev.id);
                                    return (
                                        <div key={ev.id} className={`emp-event-card${isReg ? " registered" : ""}`}>
                                            <div className="emp-ec-header">
                                                <div className="emp-ec-icon" style={{ background:"rgba(108,114,255,0.12)", fontSize:20 }}>
                                                    {new Date(ev.start_date).getDate()}<br/>
                                                    <span style={{ fontSize:8, display:"block", textAlign:"center", color:"var(--emp-accent)", fontWeight:600 }}>
                                                        {new Intl.DateTimeFormat("vi-VN",{month:"short"}).format(new Date(ev.start_date))}
                                                    </span>
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{ev.name}</div>
                                                    <div style={{ fontSize:12, color:"var(--emp-text2)" }}>
                                                        🕐 {fmtTime(ev.start_date)} {ev.location ? `· 📍 ${ev.location}` : ""}
                                                    </div>
                                                    <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                                                        {isReg && <span className="emp-badge emp-badge-green">✓ Đã đăng ký</span>}
                                                        {isReg && att?.checked_in && <span className="emp-badge emp-badge-purple">✓ Đã check-in</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </EmployeeLayout>
    );
}
