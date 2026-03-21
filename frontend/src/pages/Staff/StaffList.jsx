import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function StaffList() {

    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await api.get("/staff");
            setStaff(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = staff.filter(s =>
        s.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <h2 className="page-title">Điều phối nhân sự sự kiện</h2>

            <div className="table-container">

                <div className="table-header">
                    <h3>Danh sách phân công ({filtered.length})</h3>
                    <input
                        className="search-input"
                        placeholder="🔍 Tìm tên, phòng ban, sự kiện..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nhân viên</th>
                            <th>Phòng ban</th>
                            <th>Sự kiện</th>
                            <th>Nhiệm vụ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="empty-state"><p>Chưa có dữ liệu phân công</p></div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{s.staff_name}</td>
                                    <td>{s.department || "—"}</td>
                                    <td style={{ color: "#818cf8" }}>{s.event_name}</td>
                                    <td><span className="role-badge organizer">{s.role}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>

        </Layout>

    );
}