import { useContext, useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../services/departmentService";
import { getUsers, changeDepartment } from "../../services/userService";
import "../../styles/global.css";

export default function DepartmentList() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === "admin";

    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal Dept
    const [deptModal, setDeptModal] = useState(false);
    const [currentDept, setCurrentDept] = useState(null);
    const [deptForm, setDeptForm] = useState({ name: "", description: "", manager_id: "" });
    const [submittingDept, setSubmittingDept] = useState(false);

    // Modal Member
    const [memberModal, setMemberModal] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [submittingMember, setSubmittingMember] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [deptRes, userRes] = await Promise.all([
                getDepartments(),
                getUsers()
            ]);
            setDepartments(deptRes.data || []);
            setUsers(userRes.data || []);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        setSubmittingDept(true);
        try {
            if (currentDept) {
                await updateDepartment(currentDept.id, deptForm);
            } else {
                await createDepartment(deptForm);
            }
            setDeptModal(false);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Thao tác thất bại");
        } finally {
            setSubmittingDept(false);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa phòng ban này?")) return;
        try {
            await deleteDepartment(id);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Xóa thất bại");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setSubmittingMember(true);
        try {
            await changeDepartment(selectedUserId, selectedDeptId);
            setMemberModal(false);
            setSelectedUserId("");
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Thêm thành viên thất bại");
        } finally {
            setSubmittingMember(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Loại nhân viên này khỏi phòng ban?")) return;
        try {
            await changeDepartment(userId, null);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || "Thao tác thất bại");
        }
    };

    if (loading && departments.length === 0) return <Layout><div className="empty-state"><span>⏳</span><p>Đang tải...</p></div></Layout>;

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h2 className="gradient-text">🏢 Quản lý Phòng ban</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Tạo và phân bổ nhân sự vào các phòng ban chuyên môn
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => {
                        setCurrentDept(null);
                        setDeptForm({ name: "", description: "", manager_id: "" });
                        setDeptModal(true);
                    }}>
                        + Thêm phòng ban mới
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24 }}>
                {departments.map(dept => {
                    const deptMembers = users.filter(u => u.department_id === dept.id);
                    return (
                        <div key={dept.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: 24, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)", marginBottom: 4 }}>{dept.name}</h3>
                                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{dept.description || "Chưa có mô tả"}</p>
                                    </div>
                                    {isAdmin && (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="btn btn-outline btn-sm" onClick={() => {
                                                setCurrentDept(dept);
                                                setDeptForm({ name: dept.name, description: dept.description || "", manager_id: dept.manager_id || "" });
                                                setDeptModal(true);
                                            }}>✏️</button>
                                            <button className="btn btn-outline btn-sm" style={{ color: "red", borderColor: "#fee2e2" }} onClick={() => handleDeleteDept(dept.id)}>🗑️</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Trưởng phòng:</span>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>👤 {dept.manager_name || "Chưa bổ nhiệm"}</span>
                                    </div>
                                    <div style={{ background: "var(--color-primary)", color: "white", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                        {dept.active_tasks || 0} việc đang chạy
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: 20, flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>👥 Thành viên ({deptMembers.length})</h4>
                                    {isAdmin && (
                                        <button className="btn btn-outline btn-sm" onClick={() => {
                                            setSelectedDeptId(dept.id);
                                            setMemberModal(true);
                                        }}>+ Thêm</button>
                                    )}
                                </div>
                                
                                {deptMembers.length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>Chưa có thành viên</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {deptMembers.map(m => (
                                            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                                        {m.name[0].toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                                                </div>
                                                {isAdmin && (
                                                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: 0.6 }} onClick={() => handleRemoveMember(m.id)}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Department */}
            <Modal title={currentDept ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"} isOpen={deptModal} onClose={() => setDeptModal(false)}>
                <form onSubmit={handleDeptSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                        <label>Tên phòng ban</label>
                        <input className="form-control" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required placeholder="VD: Phòng Kỹ thuật, Ban Marketing..." />
                    </div>
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} rows="3" />
                    </div>
                    <div className="form-group">
                        <label>Trưởng phòng (Manager)</label>
                        <select className="form-control" value={deptForm.manager_id} onChange={e => setDeptForm({ ...deptForm, manager_id: e.target.value })}>
                            <option value="">-- Chọn nhân sự --</option>
                            {users.filter(u => !u.department_id || u.department_id === 0 || u.department_id === "0" || (currentDept && u.department_id === currentDept.id)).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setDeptModal(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={submittingDept}>
                            {submittingDept ? "Đang lưu..." : "✅ Lưu thông tin"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Add Member */}
            <Modal title="Thêm nhân sự vào phòng ban" isOpen={memberModal} onClose={() => setMemberModal(false)}>
                <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                        <label>Chọn nhân viên</label>
                        <select className="form-control" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                            <option value="">-- Chọn thành viên --</option>
                            {users.filter(u => u.role === "user" && (!u.department_id || u.department_id === 0 || u.department_id === "0")).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>* Chỉ hiển thị những nhân viên chưa thuộc phòng ban nào.</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setMemberModal(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={submittingMember}>
                            {submittingMember ? "Đang xử lý..." : "✅ Xác nhận thêm"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
