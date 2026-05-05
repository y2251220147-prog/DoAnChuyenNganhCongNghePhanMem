import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import {
    createDepartment, deleteDepartment, getDepartments, updateDepartment,
} from "../../services/departmentService";
import { getUsers, changeDepartment } from "../../services/userService";
import "../../styles/global.css";

const DEPT_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];
const colorOf = (idx) => DEPT_COLORS[idx % DEPT_COLORS.length];

const EMPTY_FORM = { name: "", code: "", manager_id: "", description: "" };

export default function DepartmentList() {
    const [depts,   setDepts]   = useState([]);
    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(false);
    const [editing, setEditing] = useState(null);   // null = create, obj = edit
    const [form,    setForm]    = useState(EMPTY_FORM);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState("");
    const [search,  setSearch]  = useState("");

    const [memberModal, setMemberModal] = useState({ isOpen: false, deptId: null, deptName: "" });
    const [memberForm, setMemberForm] = useState({ userId: "", position: "" });
    const [expandedDept, setExpandedDept] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const [dR, uR] = await Promise.all([getDepartments(), getUsers()]);
            setDepts(dR.data || []);
            setUsers(uR.data || []);
        } catch { /**/ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setError("");
        setModal(true);
    };

    const openEdit = (d) => {
        setEditing(d);
        setForm({ name: d.name, code: d.code, manager_id: d.manager_id || "", description: d.description || "" });
        setError("");
        setModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(""); setSaving(true);
        try {
            const payload = { ...form, manager_id: form.manager_id || null };
            if (editing) await updateDepartment(editing.id, payload);
            else         await createDepartment(payload);
            setModal(false);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Lưu thất bại");
        } finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xoá phòng ban "${name}"?\nCác nhân viên thuộc phòng ban này sẽ không còn phòng ban.`)) return;
        try { await deleteDepartment(id); await load(); }
        catch (err) { alert(err.response?.data?.message || "Xoá thất bại"); }
    };

    const handleAddMember = async (e) => {
        e.preventDefault(); setError(""); setSaving(true);
        try {
            await changeDepartment(memberForm.userId, memberModal.deptId, memberForm.position);
            setMemberModal({ isOpen: false, deptId: null, deptName: "" });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Thêm thất bại");
        } finally { setSaving(false); }
    };

    const filtered = depts.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
    );

    const getUserName = (uid) => users.find(u => u.id === uid)?.name || "—";

    return (
        <Layout>
            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="page-header" style={{ marginBottom: 36 }}>
                <div>
                    <h2 style={{ fontSize: 30, fontWeight: 900 }}>
                        <span className="gradient-text">Quản lý Phòng ban</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                        {depts.length} phòng ban · {users.length} nhân viên trong hệ thống
                    </p>
                </div>
                <button
                    id="btn-create-dept"
                    className="btn btn-primary"
                    style={{ height: 46, padding: "0 24px", fontWeight: 800, borderRadius: 12 }}
                    onClick={openCreate}
                >
                    + Thêm phòng ban
                </button>
            </div>

            {/* ── Stats cards ─────────────────────────────────────────────── */}
            <div className="grid-3" style={{ marginBottom: 32, gap: 20 }}>
                {[
                    { label: "Tổng phòng ban",   value: depts.length,                                             icon: "🏢", bg: "#f5f3ff", text: "#4338ca" },
                    { label: "Có trưởng phòng",  value: depts.filter(d => d.manager_id).length,                  icon: "👔", bg: "#ecfdf5", text: "#047857" },
                    { label: "Nhân viên đã phân", value: depts.reduce((s, d) => s + (Number(d.member_count) || 0), 0), icon: "👥", bg: "#eff6ff", text: "#1d4ed8" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: s.bg, border: "1px solid rgba(0,0,0,0.04)",
                        padding: "22px 28px", borderRadius: 18,
                        display: "flex", alignItems: "center", gap: 18,
                    }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: s.text, lineHeight: 1 }}>{loading ? "…" : s.value}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search ──────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ position: "relative", maxWidth: 360 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
                    <input
                        id="dept-search-input"
                        className="form-control"
                        placeholder="Tìm theo tên hoặc mã phòng ban..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 44, borderRadius: 12, height: 44, fontSize: 14 }}
                    />
                </div>
            </div>

            {/* ── Department cards grid ───────────────────────────────────── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>⏳ Đang tải...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>Chưa có phòng ban nào.</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>Nhấn "+ Thêm phòng ban" để bắt đầu.</p>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: 18 }}>
                    {filtered.map((d, idx) => {
                        const color      = colorOf(idx);
                        const memberCount = users.filter(u => u.department_id === d.id).length;
                        return (
                            <div
                                key={d.id}
                                id={`dept-card-${d.id}`}
                                className="card"
                                style={{ borderTop: `4px solid ${color}`, padding: "22px 24px", borderRadius: 16, transition: "all 0.2s" }}
                            >
                                {/* Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                                                background: color + "18", color, padding: "3px 10px", borderRadius: 999,
                                            }}>{d.code}</span>
                                        </div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>{d.name}</h3>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                            id={`btn-edit-dept-${d.id}`}
                                            onClick={() => openEdit(d)}
                                            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}
                                            title="Chỉnh sửa"
                                        >✏️</button>
                                        <button
                                            id={`btn-delete-dept-${d.id}`}
                                            onClick={() => handleDelete(d.id, d.name)}
                                            style={{ background: "#fef2f2", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}
                                            title="Xoá phòng ban"
                                        >🗑</button>
                                        <button
                                            onClick={() => {
                                                setMemberModal({ isOpen: true, deptId: d.id, deptName: d.name });
                                                setMemberForm({ userId: "", position: "" });
                                                setError("");
                                            }}
                                            style={{ background: "#e0e7ff", color: "#4338ca", border: "none", borderRadius: 8, padding: "0 10px", height: 32, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                                            title="Thêm nhân viên"
                                        >+ Nhân viên</button>
                                    </div>
                                </div>

                                {/* Description */}
                                {d.description && (
                                    <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.5, minHeight: 36 }}>
                                        {d.description}
                                    </p>
                                )}

                                {/* Stats row */}
                                <div style={{ display: "flex", gap: 14, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color }}>{memberCount}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Nhân viên</div>
                                    </div>
                                    <div style={{ width: 1, background: "#f3f4f6" }} />
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                                            👔 {d.manager_id ? getUserName(d.manager_id) : <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Chưa có trưởng phòng</span>}
                                        </div>
                                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Trưởng phòng</div>
                                    </div>
                                </div>

                                {/* Member avatars + list */}
                                {memberCount > 0 && (
                                    <div style={{ marginTop: 14 }}>
                                        <div style={{ display: "flex", gap: -4 }}>
                                            {users.filter(u => u.department_id === d.id).slice(0, 6).map((u, i) => (
                                                <div key={u.id} title={`${u.name}${u.position ? ` · ${u.position}` : ""}`} style={{
                                                    width: 28, height: 28, borderRadius: "50%",
                                                    background: color + "25", border: `2px solid #fff`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 10, fontWeight: 800, color,
                                                    marginLeft: i > 0 ? -8 : 0,
                                                    cursor: "default",
                                                }}>
                                                    {u.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase()}
                                                </div>
                                            ))}
                                            {memberCount > 6 && (
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6",
                                                    border: "2px solid #fff", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#6b7280",
                                                    marginLeft: -8,
                                                }}>+{memberCount - 6}</div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                                            {users.filter(u => u.department_id === d.id).slice(0, expandedDept === d.id ? undefined : 4).map(u => (
                                                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{u.name}</span>
                                                    {u.position && <span style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}>{u.position}</span>}
                                                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "#f1f5f9", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{u.role}</span>
                                                </div>
                                            ))}
                                            {memberCount > 4 && (
                                                <div 
                                                    onClick={() => setExpandedDept(expandedDept === d.id ? null : d.id)}
                                                    style={{ fontSize: 11, color: color, fontWeight: 600, cursor: "pointer", marginTop: 4, display: "inline-block" }}
                                                >
                                                    {expandedDept === d.id ? "Thu gọn ⌃" : `Xem thêm ${memberCount - 4} thành viên ⌄`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal Tạo / Sửa phòng ban ───────────────────────────────── */}
            <Modal
                title={editing ? `✏️ Sửa: ${editing.name}` : "🏢 Thêm phòng ban mới"}
                isOpen={modal}
                onClose={() => { setModal(false); setError(""); }}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Tên phòng ban <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input
                                id="dept-name-input"
                                className="form-control"
                                placeholder="VD: Phòng Marketing"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mã phòng ban <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input
                                id="dept-code-input"
                                className="form-control"
                                placeholder="VD: MKT"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                maxLength={20}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Trưởng phòng</label>
                        <select
                            id="dept-manager-select"
                            className="form-control"
                            value={form.manager_id}
                            onChange={e => setForm({ ...form, manager_id: e.target.value })}
                        >
                            <option value="">— Chưa chỉ định —</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            id="dept-desc-input"
                            className="form-control"
                            rows={2}
                            placeholder="Chức năng, nhiệm vụ của phòng ban..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu phòng ban"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal Thêm nhân viên ───────────────────────────────────── */}
            <Modal
                title={`👥 Thêm nhân viên: ${memberModal.deptName}`}
                isOpen={memberModal.isOpen}
                onClose={() => { setMemberModal({ ...memberModal, isOpen: false }); setError(""); }}
            >
                <form onSubmit={handleAddMember}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <div className="form-group">
                        <label>Chọn nhân viên <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <select
                            className="form-control"
                            value={memberForm.userId}
                            onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })}
                            required
                        >
                            <option value="">-- Chọn nhân viên --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email}) {u.department_id === memberModal.deptId ? " - Đang ở phòng này" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Vai trò / Chức vụ trong phòng</label>
                        <input
                            className="form-control"
                            placeholder="VD: Nhân viên, Phó phòng, Trưởng nhóm..."
                            value={memberForm.position}
                            onChange={e => setMemberForm({ ...memberForm, position: e.target.value })}
                        />
                    </div>

                    <div className="form-actions" style={{ marginTop: 24 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setMemberModal({ ...memberModal, isOpen: false })}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !memberForm.userId}>
                            {saving ? "Đang thêm..." : "Thêm nhân viên"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
