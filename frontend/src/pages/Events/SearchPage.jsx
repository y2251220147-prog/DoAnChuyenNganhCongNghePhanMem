import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { globalSearch } from "../../services/eventService";
import "../../styles/global.css";

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const navigate = useNavigate();

    const [results, setResults] = useState({ events: [], venues: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchResults = useCallback(async (p, isNew = false) => {
        if (!query) return;
        setLoading(true);
        try {
            const r = await globalSearch({ q: query, page: p, limit: 6 });
            const data = r.data || { events: [], venues: [], users: [], hasMore: false };
            
            if (isNew) {
                setResults(data);
            } else {
                setResults(prev => ({
                    events: [...prev.events, ...data.events],
                    venues: [...prev.venues, ...data.venues],
                    users: [...prev.users, ...data.users],
                }));
            }
            setHasMore(data.hasMore);
        } catch (err) {
            console.error("Global search error:", err);
        } finally {
            setLoading(false);
        }
    }, [query]);

    // Reset when query changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchResults(1, true);
    }, [query, fetchResults]);

    // Infinite Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading && hasMore) {
                setPage(prev => {
                    const next = prev + 1;
                    fetchResults(next);
                    return next;
                });
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore, query, fetchResults]);

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    return (
        <Layout title="Kết quả tìm kiếm" subtitle={`Tìm kiếm cho "${query}"`}>
            <div className="search-results-page">
                {loading ? (
                    <div className="empty-state">
                        <span>⏳</span>
                        <p>Đang tìm kiếm kết quả cho "{query}"...</p>
                    </div>
                ) : !query ? (
                    <div className="empty-state">
                        <span>🔎</span>
                        <p>Nhập từ khóa để tìm kiếm sự kiện, địa điểm hoặc nhân sự.</p>
                    </div>
                ) : (results.events.length === 0 && results.venues.length === 0 && results.users.length === 0) ? (
                    <div className="empty-state">
                        <span>🚫</span>
                        <p>Không tìm thấy kết quả nào cho "{query}".</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        
                        {/* ── Events Results ── */}
                        {results.events.length > 0 && (
                            <section>
                                <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    🎪 Sự kiện ({results.events.length})
                                </h3>
                                <div className="grid-3">
                                    {results.events.map(ev => (
                                        <div key={ev.id} className="card" style={{ cursor: "pointer", transition: "all 0.2s" }}
                                             onClick={() => navigate(`/events/${ev.id}`)}>
                                            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>{ev.name}</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                                📅 {fmtDate(ev.start_date)}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                📍 {ev.location || "Chưa xác định"}
                                            </div>
                                            <div style={{ marginTop: "10px" }}>
                                                <span className={`badge-${ev.status}`} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>
                                                    {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Venues Results ── */}
                        {results.venues.length > 0 && (
                            <section>
                                <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    🏢 Địa điểm ({results.venues.length})
                                </h3>
                                <div className="grid-3">
                                    {results.venues.map(v => (
                                        <div key={v.id} className="card" style={{ cursor: "pointer" }}
                                             onClick={() => navigate(`/venues`)}>
                                            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>{v.name}</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                                🏗 {v.type === "room" ? "Phòng họp" : "Hội trường"}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                👥 Sức chứa: {v.capacity} người
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Users Results ── */}
                        {results.users.length > 0 && (
                            <section>
                                <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    👤 Nhân sự ({results.users.length})
                                </h3>
                                <div className="grid-3">
                                    {results.users.map(u => (
                                        <div key={u.id} className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ 
                                                width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0",
                                                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
                                            }}>
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.email}</div>
                                                <div style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 500 }}>
                                                    {u.role.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {/* ── Infinite Scroll Indicator ── */}
                        {loading && page > 1 && (
                            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "14px" }}>
                                🔄 Đang tải thêm kết quả (Trang {page})...
                            </div>
                        )}

                        {!hasMore && (query && results.events.length > 0) && (
                            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "14px", borderTop: "1px solid #eee" }}>
                                ✨ Đã hiển thị tất cả kết quả cho "{query}".
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
