import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function BudgetList() {

    const [budgets, setBudgets] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await api.get("/budget");
            setBudgets(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = budgets.filter(b =>
        b.item?.toLowerCase().includes(search.toLowerCase()) ||
        b.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.category?.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.reduce((sum, b) => sum + parseFloat(b.cost || 0), 0);

    return (

        <Layout>

            <h2 className="page-title">Quản lý ngân sách hệ thống</h2>

            <div className="table-container">

                <div className="table-header">
                    <h3>Chi phí sự kiện ({filtered.length})</h3>
                    <input
                        className="search-input"
                        placeholder="🔍 Tìm hạng mục, sự kiện, phân loại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Hạng mục</th>
                            <th>Phân loại</th>
                            <th>Sự kiện</th>
                            <th>Chi phí (VNĐ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4"><div className="empty-state"><p>Chưa có dữ liệu ngân sách</p></div></td>
                            </tr>
                        ) : (
                            <>
                                {filtered.map((b) => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{b.item}</td>
                                        <td><span className="role-badge user">{b.category}</span></td>
                                        <td style={{ color: "#818cf8" }}>{b.event_name}</td>
                                        <td style={{ color: "#10b981", fontWeight: "600" }}>{parseFloat(b.cost).toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr style={{ background: "rgba(16, 185, 129, 0.05)" }}>
                                    <td colSpan="3" style={{ textAlign: "right", fontWeight: "700" }}>TỔNG CỘNG ĐANG HIỂN THỊ:</td>
                                    <td style={{ color: "#10b981", fontWeight: "700", fontSize: "16px" }}>{total.toLocaleString()}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>

            </div>

        </Layout>

    );
}