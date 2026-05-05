import { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import {
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getEligibleManagers, getDepartmentEmployees, getAvailableUsers,
    addEmployeeToDept, removeEmployeeFromDept, updateEmployeeRole
} from "../../services/departmentService";

const EMPTY_FORM = { name: "", description: "", manager_id: "" };
const ROLE_BADGE = {
    admin: { label: "Admin", bg: "#7c3aed", color: "#fff" },
    organizer: { label: "Tổ chức", bg: "#0ea5e9", color: "#fff" },
    user: { label: "Nhân viên", bg: "#10b981", color: "#fff" },
};

export default function DepartmentList() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eligibleManagers, setEligibleManagers] = useState([]);
    const [loadError, setLoadError] = useState("");

    // Modal state
    const [modal, setModal] = useState(false);
    const [activeTab, setActiveTab] = useState("info"); // "info" | "employees"
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Employee management state (in modal)
    const [employees, setEmployees] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingRoleVal, setEditingRoleVal] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true); setLoadError("");
            const [dR, mR] = await Promise.all([
                getDepartments(),
                getEligibleManagers().catch(() => ({ data: [] }))
            ]);
            setDepartments(dR.data || []);
            setEligibleManagers(mR.data || []);
        } catch (err) {
            setLoadError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Load employees + available users when dept is selected
    const loadEmployees = useCallback(async (deptId) => {
        if (!deptId) return;
        setEmpLoading(true);
        try {
            const [eR, aR] = await Promise.all([
                getDepartmentEmployees(deptId),
                getAvailableUsers(deptId).catch(() => ({ data: [] }))
            ]);
            setEmployees(eR.data?.employees || []);
            setAvailableUsers(aR.data || []);
        } catch { setEmployees([]); setAvailableUsers([]); }
        finally { setEmpLoading(false); }
    }, []);

    const openAdd = () => {
        setEditTarget(null); setForm(EMPTY_FORM);
        setFormError(""); setActiveTab("info");
        setEmployees([]); setAvailableUsers([]);
        setModal(true);
    };

    const openEdit = (d) => {
        setEditTarget(d);
        setForm({ name: d.name, description: d.description || "", manager_id: d.manager_id || "" });
        setFormError(""); setActiveTab("info");
        setSelectedUserId(""); setEditingRoleId(null);
        loadEmployees(d.id);
        setModal(true);
    };

    const closeModal = () => { setModal(false); setEditTarget(null); };

    const handleSave = async (e) => {
        e.preventDefault(); setFormError(""); setSaving(true);
        try {
            if (editTarget) await updateDepartment(editTarget.id, form);
            else {
                const res = await createDepartment(form);
                // Auto-open edit mode to manage employees
                const newId = res.data.id;
                await load();
                const updated = (await getDepartments()).data.find(d => d.id === newId);
                if (updated) { setEditTarget(updated); setActiveTab("employees"); await loadEmployees(newId); return; }
            }
            // Reload employees if on employee tab
            if (editTarget) await loadEmployees(editTarget.id);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Lưu thất bại");
        } finally { setSaving(false); }
    };

    const handleAddEmployee = async () => {
        if (!selectedUserId || !editTarget) return;
        try {
            await addEmployeeToDept(editTarget.id, selectedUserId);
            setSelectedUserId("");
            await loadEmployees(editTarget.id);
            load();
        } catch (err) { alert(err.response?.data?.message || "Thêm thất bại"); }
    };

    const handleRemoveEmployee = async (emp) => {
        if (!window.confirm(`Xóa "${emp.name}" khỏi phòng ban?`)) return;
        try {
            await removeEmployeeFromDept(editTarget.id, emp.id);
            await loadEmployees(editTarget.id);
            load();
        } catch (err) { alert(err.response?.data?.message || "Xóa thất bại"); }
    };

    const handleSaveRole = async (emp) => {
        try {
            await updateEmployeeRole(editTarget.id, emp.id, editingRoleVal);
            setEditingRoleId(null);
            await loadEmployees(editTarget.id);
        } catch (err) { alert(err.response?.data?.message || "Cập nhật thất bại"); }
    };

    const handleDelete = async (dept) => {
        if (!window.confirm(`Xóa phòng ban "${dept.name}"?`)) return;
        try { await deleteDepartment(dept.id); load(); }
        catch (err) { alert(err.response?.data?.message || "Xóa thất bại"); }
    };

    const totalEmployees = departments.reduce((s, d) => s + (d.employee_count || 0), 0);

    return (
        <Layout>
            <div style={{ padding: "0 0 40px" }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>🏢 Quản lý Phòng ban</h1>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Tổ chức cơ cấu nhân sự và phân công phòng ban vào sự kiện</p>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>+ Thêm phòng ban</button>
                </div>

                {/* Error */}
                {loadError && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14 }}>
                        ⚠️ {loadError} <button onClick={load} style={{ marginLeft: 10, background: "none", border: "1px solid #dc2626", color: "#dc2626", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12 }}>Thử lại</button>
                    </div>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                    {[
                        { label: "Tổng phòng ban", value: departments.length, icon: "🏢", color: "#6366f1" },
                        { label: "Tổng nhân viên", value: totalEmployees, icon: "👥", color: "#0ea5e9" },
                        { label: "Có trưởng phòng", value: departments.filter(d => d.manager_id).length, icon: "👑", color: "#10b981" },
                    ].map(s => (
                        <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px", borderLeft: `4px solid ${s.color}` }}>
                            <div style={{ fontSize: 22 }}>{s.icon}</div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Đang tải...</div>
                    ) : departments.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                            <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                            <div>Chưa có phòng ban nào</div>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={openAdd}>Thêm phòng ban đầu tiên</button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead><tr>
                                <th>#</th><th>Tên phòng ban</th><th>Trưởng phòng</th><th>Mô tả</th>
                                <th style={{ textAlign: "center" }}>Nhân viên</th><th style={{ textAlign: "right" }}>Thao tác</th>
                            </tr></thead>
                            <tbody>
                                {departments.map((d, i) => (
                                    <tr key={d.id}>
                                        <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                                        <td><div style={{ fontWeight: 700, fontSize: 14 }}>🏢 {d.name}</div></td>
                                        <td>
                                            {d.manager_name ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.12)", color: "#4338ca", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {d.manager_name[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.manager_name}</div>
                                                        <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>👑 Trưởng phòng</span>
                                                    </div>
                                                </div>
                                            ) : <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Chưa phân công</span>}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 200 }}>
                                            {d.description || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Chưa có mô tả</span>}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <span style={{ background: d.employee_count > 0 ? "rgba(99,102,241,0.1)" : "var(--bg-main)", color: d.employee_count > 0 ? "var(--color-primary)" : "var(--text-muted)", borderRadius: 20, padding: "3px 12px", fontWeight: 700, fontSize: 13 }}>
                                                {d.employee_count || 0} người
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => openEdit(d)} style={{ marginRight: 6 }}>✏️ Sửa</button>
                                            <button className="btn btn-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }} onClick={() => handleDelete(d)}>🗑️ Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── MODAL ── */}
                {modal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
                        <div style={{ background: "var(--bg-card)", borderRadius: 18, width: "100%", maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>
                            {/* Modal Header */}
                            <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                        {editTarget ? `✏️ ${editTarget.name}` : "➕ Thêm phòng ban mới"}
                                    </h3>
                                    <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>✕</button>
                                </div>

                                {/* Tabs — chỉ hiện khi đang edit */}
                                {editTarget && (
                                    <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-color)" }}>
                                        {[
                                            { key: "info", label: "📋 Thông tin" },
                                            { key: "employees", label: `👥 Nhân viên (${employees.length})` }
                                        ].map(t => (
                                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                                background: "none", border: "none", padding: "8px 18px",
                                                fontWeight: activeTab === t.key ? 700 : 500,
                                                color: activeTab === t.key ? "var(--color-primary)" : "var(--text-muted)",
                                                borderBottom: activeTab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                                                cursor: "pointer", fontSize: 14, marginBottom: -2
                                            }}>{t.label}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Body */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                                {/* TAB: THÔNG TIN */}
                                {(!editTarget || activeTab === "info") && (
                                    <form id="dept-form" onSubmit={handleSave}>
                                        {formError && <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{formError}</div>}

                                        <div className="form-group">
                                            <label>Tên phòng ban <span style={{ color: "#ef4444" }}>*</span></label>
                                            <input className="form-control" placeholder="VD: Phòng Marketing"
                                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                        </div>

                                        <div className="form-group">
                                            <label>Trưởng phòng</label>
                                            <select className="form-control" value={form.manager_id}
                                                onChange={e => setForm({ ...form, manager_id: e.target.value })}>
                                                <option value="">-- Chọn trưởng phòng --</option>
                                                {eligibleManagers.map(m => {
                                                    const isCurrentMgr = editTarget && String(editTarget.manager_id) === String(m.id);
                                                    const hasOtherRole = m.role_in_dept && m.role_in_dept.startsWith("Trưởng phòng") && !isCurrentMgr;
                                                    return (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name}{m.position ? ` – ${m.position}` : ""}
                                                            {isCurrentMgr ? " ★ Đang giữ chức" : hasOtherRole ? ` (${m.role_in_dept})` : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <small style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                                ⚠️ Chỉ nhân viên thường có thể làm trưởng phòng. Hệ thống tự cập nhật chức danh khi chọn.
                                            </small>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Mô tả</label>
                                            <textarea className="form-control" rows={3} placeholder="Mô tả chức năng, nhiệm vụ..."
                                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                        </div>
                                    </form>
                                )}

                                {/* TAB: NHÂN VIÊN */}
                                {editTarget && activeTab === "employees" && (
                                    <div>
                                        {/* Add employee section */}
                                        <div style={{ background: "var(--bg-main)", borderRadius: 10, padding: 16, marginBottom: 18, border: "1px solid var(--border-color)" }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--text-secondary)" }}>➕ THÊM NHÂN VIÊN VÀO PHÒNG BAN</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <select className="form-control" style={{ flex: 1 }} value={selectedUserId}
                                                    onChange={e => setSelectedUserId(e.target.value)}>
                                                    <option value="">-- Chọn nhân viên để thêm --</option>
                                                    {availableUsers.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name}{u.current_dept_name ? ` (đang ở: ${u.current_dept_name})` : " (chưa có phòng ban)"}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button className="btn btn-primary" onClick={handleAddEmployee}
                                                    disabled={!selectedUserId} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                    + Thêm
                                                </button>
                                            </div>
                                            {availableUsers.length === 0 && (
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                                                    Tất cả nhân viên đã thuộc phòng ban này hoặc chưa có tài khoản nhân viên nào.
                                                </div>
                                            )}
                                        </div>

                                        {/* Employee list */}
                                        {empLoading ? (
                                            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>Đang tải...</div>
                                        ) : employees.length === 0 ? (
                                            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                                                Phòng ban chưa có nhân viên nào
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {employees.map(emp => {
                                                    const rb = ROLE_BADGE[emp.role] || ROLE_BADGE.user;
                                                    const isManager = editTarget?.manager_id === emp.id;
                                                    const isEditingRole = editingRoleId === emp.id;
                                                    return (
                                                        <div key={emp.id} style={{
                                                            display: "flex", alignItems: "center", gap: 10,
                                                            padding: "10px 14px", borderRadius: 10,
                                                            border: `1px solid ${isManager ? "rgba(251,191,36,0.4)" : "var(--border-color)"}`,
                                                            background: isManager ? "rgba(254,243,199,0.2)" : "var(--bg-main)"
                                                        }}>
                                                            {/* Avatar */}
                                                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: isManager ? "rgba(251,191,36,0.2)" : "rgba(99,102,241,0.1)", color: isManager ? "#d97706" : "#4338ca", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>
                                                                {isManager ? "👑" : emp.name?.[0]?.toUpperCase()}
                                                            </div>

                                                            {/* Info */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                                    {emp.name}
                                                                    {isManager && <span style={{ fontSize: 10, marginLeft: 6, color: "#d97706", fontWeight: 700 }}>Trưởng phòng</span>}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.email}</div>
                                                                {/* Role editor */}
                                                                {!isManager && (
                                                                    isEditingRole ? (
                                                                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                                                            <input
                                                                                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text)", flex: 1, minWidth: 0 }}
                                                                                value={editingRoleVal}
                                                                                onChange={e => setEditingRoleVal(e.target.value)}
                                                                                placeholder="VD: Kỹ thuật viên"
                                                                                autoFocus
                                                                            />
                                                                            <button onClick={() => handleSaveRole(emp)} style={{ fontSize: 11, padding: "2px 8px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>✓</button>
                                                                            <button onClick={() => setEditingRoleId(null)} style={{ fontSize: 11, padding: "2px 8px", background: "none", border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                                                            <span style={{ fontSize: 11, color: emp.role_in_dept ? "var(--text-secondary)" : "var(--text-muted)", fontStyle: emp.role_in_dept ? "normal" : "italic" }}>
                                                                                {emp.role_in_dept || "Chưa có chức danh"}
                                                                            </span>
                                                                            <button onClick={() => { setEditingRoleId(emp.id); setEditingRoleVal(emp.role_in_dept || ""); }}
                                                                                style={{ fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 2px" }} title="Sửa chức danh">✏️</button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>

                                                            {/* Role badge */}
                                                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: rb.bg, color: rb.color, flexShrink: 0 }}>{rb.label}</span>

                                                            {/* Remove button */}
                                                            <button onClick={() => handleRemoveEmployee(emp)} title="Xóa khỏi phòng ban"
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, flexShrink: 0, padding: "2px 4px", borderRadius: 6, lineHeight: 1 }}>🗑</button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
                                <button className="btn btn-outline" onClick={closeModal}>
                                    {editTarget ? "Đóng" : "Hủy"}
                                </button>
                                {(!editTarget || activeTab === "info") && (
                                    <button form="dept-form" type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "Đang lưu..." : editTarget ? "Cập nhật thông tin" : "Tạo phòng ban"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
