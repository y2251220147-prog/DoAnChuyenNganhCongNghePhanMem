import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function TimelineList() {

    const [timeline, setTimeline] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await api.get("/timeline");
            setTimeline(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = timeline.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.event_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <h2 className="page-title">Lịch trình sự kiện tổng thể</h2>

            <div className="table-container">

                <div className="table-header">
                    <h3>Các hạng mục công việc ({filtered.length})</h3>
                    <input
                        className="search-input"
                        placeholder="🔍 Tìm hạng mục hoặc sự kiện..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Hạng mục</th>
                            <th>Sự kiện</th>
                            <th>Mô tả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="empty-state"><p>Không có hạng mục nào</p></div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ color: "#818cf8", fontWeight: "600" }}>{t.start_time?.substring(0, 5)} - {t.end_time?.substring(0, 5)}</td>
                                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{t.title}</td>
                                    <td>{t.event_name}</td>
                                    <td>{t.description}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>

        </Layout>

    );
}