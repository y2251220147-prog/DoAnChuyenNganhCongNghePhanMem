import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function GuestList() {

    const [guests, setGuests] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await api.get("/guests");
            setGuests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredGuests = guests.filter(g =>
        g.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase()) ||
        g.event_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <h2 className="page-title">Quản lý khách mời hệ thống</h2>

            <div className="table-container">

                <div className="table-header">
                    <h3>Tổng số khách ({filteredGuests.length})</h3>
                    <input
                        className="search-input"
                        placeholder="🔍 Tìm tên, email hoặc sự kiện..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tên khách</th>
                            <th>Sự kiện</th>
                            <th>Liên hệ</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGuests.length === 0 ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <p>Không tìm thấy dữ liệu</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredGuests.map((g) => (
                                <tr key={g.id}>
                                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{g.name}</td>
                                    <td style={{ color: "#818cf8" }}>{g.event_name}</td>
                                    <td>{g.email}<br/><small>{g.phone}</small></td>
                                    <td>
                                        <span className={`role-badge ${g.checked_in ? 'user' : 'admin'}`}>
                                            {g.checked_in ? 'Đã đến' : 'Chưa đến'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>

        </Layout>

    );

}