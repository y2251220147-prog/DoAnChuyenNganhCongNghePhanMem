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
            <div className="page-header">
                <div>
                    <h2>📅 Lịch sự kiện của tôi</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        Theo dõi lịch trình các sự kiện bạn đã đăng ký tham gia.
                    </p>
                </div>
                <div className="calendar-controls">
                    <button className="btn btn-outline btn-sm" onClick={prevMonth}>◀</button>
                    <span style={{ fontWeight: 800, fontSize: 16, minWidth: 140, textAlign: "center", textTransform: "capitalize" }}>
                        {monthName} {year}
                    </span>
                    <button className="btn btn-outline btn-sm" onClick={nextMonth}>▶</button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><span>⏳</span><p>Đang tải lịch trình...</p></div>
            ) : (
                <div className="calendar-container">
                    <div className="calendar-header">
                        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="calendar-grid">
                        {dayCells}
                    </div>
                </div>
            )}

            <style>{`
                .calendar-controls { display: flex; align-items: center; gap: 15px; }
                .calendar-container {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                }
                .calendar-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: var(--bg-hover);
                    border-bottom: 1px solid var(--border-color);
                }
                .calendar-header div {
                    padding: 12px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: minmax(110px, auto);
                }
                .calendar-day {
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    padding: 8px;
                    background: var(--bg-card);
                    transition: all 0.2s;
                    position: relative;
                }
                .calendar-day:nth-child(7n) { border-right: none; }
                .calendar-day.empty { background: var(--bg-secondary); opacity: 0.3; }
                .calendar-day:not(.empty):hover { background: var(--bg-hover); }
                .calendar-day.today { background: rgba(99,102,241,0.03); }
                .calendar-day.today .day-num {
                    background: var(--color-primary);
                    color: white;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                .day-num { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: inline-block; }
                .day-events { display: flex; flex-direction: column; gap: 4px; }
                .event-tag {
                    font-size: 11px;
                    padding: 3px 6px;
                    background: var(--color-primary);
                    color: white;
                    border-radius: 4px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </Layout>
    );
}
