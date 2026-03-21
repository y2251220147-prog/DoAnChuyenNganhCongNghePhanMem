import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import { getUsers } from "../services/userService";

export default function OrganizerUsers() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch {
            // silently fail
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <h2 className="page-title">Danh sách người dùng</h2>

            <div className="table-container">

                <div className="table-header">
                    <h3>Users ({filteredUsers.length})</h3>
                    <input
                        className="search-input"
                        placeholder="🔍 Tìm kiếm user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <p>Không có user nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`role-badge ${u.role}`}>
                                            {u.role}
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
