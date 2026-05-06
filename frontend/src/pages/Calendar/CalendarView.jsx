import { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { getMyRegistrations } from "../../services/attendeeService";
import "../../styles/global.css";

export default function CalendarView() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currDate, setCurrDate] = useState(new Date());

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getMyRegistrations();
                setEvents(res.data || []);
            } catch { /* error handling */ }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstDay = (y, m) => new Date(y, m, 1).getDay();

    const year = currDate.getFullYear();
    const month = currDate.getMonth();
    const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long' }).format(currDate);

    const prevMonth = () => setCurrDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrDate(new Date(year, month + 1, 1));

    const totalDays = daysInMonth(year, month);
    const offset = firstDay(year, month); // 0=Sun, 1=Mon...

    const dayCells = [];
    // Empty cells before start
    for (let i = 0; i < offset; i++) {
        dayCells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    // Content cells
    for (let d = 1; d <= totalDays; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.start_date?.startsWith(dStr));
        const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

        dayCells.push(
            <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`}>
                <span className="day-num">{d}</span>
                <div className="day-events">
                    {dayEvents.map(e => (
                        <div key={e.id} className="event-tag" title={e.event_name}>
                            {e.event_name}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">Lịch trình & Lộ trình</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                        Trực quan hóa lộ trình các sự kiện chiến lược bạn sẽ tham gia hoặc giám sát.
                    </p>
                </div>
                <div style={{ 
                    display: "flex", alignItems: "center", gap: 16, background: "#fff", 
                    padding: "8px 16px", borderRadius: 16, border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }}>
                    <button className="btn btn-outline" style={{ border: "none", background: "#f8fafc", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={prevMonth}>◀</button>
                    <span style={{ fontWeight: 900, fontSize: 16, minWidth: 150, textAlign: "center", textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.05em" }}>
                        {monthName} {year}
                    </span>
                    <button className="btn btn-outline" style={{ border: "none", background: "#f8fafc", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={nextMonth}>▶</button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state" style={{ padding: 100 }}><span>⏳</span><p>Đang đồng bộ dữ liệu lịch trình...</p></div>
            ) : (
                <div className="calendar-container" style={{ border: "1px solid #f1f5f9", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)", borderRadius: 24, overflow: "hidden", background: "#fff" }}>
                    <div className="calendar-header" style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)", borderBottom: "1px solid #e2e8f0" }}>
                        {["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"].map(d => (
                            <div key={d} style={{ padding: "16px", color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.05em" }}>{d}</div>
                        ))}
                    </div>
                    <div className="calendar-grid">
                        {dayCells}
                    </div>
                </div>
            )}

            <style>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: minmax(130px, auto);
                }
                .calendar-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                }
                .calendar-header div {
                    text-align: center;
                }
                .calendar-day {
                    border-right: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px;
                    background: #fff;
                    transition: all 0.2s;
                    position: relative;
                }
                .calendar-day:nth-child(7n) { border-right: none; }
                .calendar-day:nth-last-child(-n+7) { border-bottom: none; }
                .calendar-day.empty { background: #fcfcfd; opacity: 0.5; }
                .calendar-day:not(.empty):hover { background: #f8fafc; }
                .calendar-day.today { background: rgba(99,102,241,0.04); }
                .calendar-day.today .day-num {
                    background: var(--color-primary);
                    color: white;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    box-shadow: 0 4px 10px rgba(99,102,241,0.3);
                }
                .day-num { font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 10px; display: inline-block; }
                .day-events { display: flex; flex-direction: column; gap: 6px; }
                .event-tag {
                    font-size: 11px;
                    padding: 6px 10px;
                    background: rgba(99,102,241,0.1);
                    color: var(--color-primary-dark);
                    border-left: 3px solid var(--color-primary);
                    border-radius: 6px;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .event-tag:hover {
                    background: rgba(99,102,241,0.2);
                    transform: translateX(2px);
                }
            `}</style>
        </Layout>
    );
}
