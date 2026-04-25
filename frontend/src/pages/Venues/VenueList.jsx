import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/UI/Modal";
import { AuthContext } from "../../context/AuthContext";
import {
    getVenues, createVenue, updateVenue, deleteVenue,
    getAllResources, createResource, deleteResource
} from "../../services/venueService";
import "../../styles/global.css";

const TYPE_LABEL = { room: "Phòng họp", hall: "Hội trường", outdoor: "Ngoài trời", online: "Online" };
const TYPE_ICON = { room: "🚪", hall: "🏛️", outdoor: "🌳", online: "🌐" };
const RES_CATS = ["AV", "Kỹ thuật âm thanh", "Ánh sáng", "Bàn ghế", "CNTT", "Catering", "Khác"];

const EMPTY_VENUE = { name: "", type: "room", location: "", capacity: "", description: "", status: "available", facilities: [] };
const EMPTY_RES = { name: "", category: "", quantity: 1, unit: "cái", description: "" };

export default function VenueList() {
    const { user } = useContext(AuthContext);
    const isManager = user?.role === "admin" || user?.role === "organizer";

    const [venues, setVenues] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("venues");
    const [search, setSearch] = useState("");

    // Venue modal
    const [vModal, setVModal] = useState(false);
    const [editingV, setEditingV] = useState(null);
    const [vForm, setVForm] = useState(EMPTY_VENUE);
    const [vSaving, setVSaving] = useState(false);
    const [vError, setVError] = useState("");

    // Resource modal
    const [rModal, setRModal] = useState(false);
    const [rForm, setRForm] = useState(EMPTY_RES);
    const [rSaving, setRSaving] = useState(false);
    const [rError, setRError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const [vR, rR] = await Promise.all([getVenues(), getAllResources()]);
            setVenues(vR.data || []);
            setResources(rR.data || []);
        } catch {/**/ }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    // ── Venue CRUD ──
    const openVenueModal = (v = null) => {
        setEditingV(v?.id || null);
        setVForm(v ? {
            name: v.name, type: v.type, location: v.location || "", capacity: v.capacity || "",
            description: v.description || "", status: v.status, facilities: v.facilities || []
        } : EMPTY_VENUE);
        setVError(""); setVModal(true);
    };
    const handleSaveVenue = async (e) => {
        e.preventDefault(); setVError(""); setVSaving(true);
        try {
            if (editingV) await updateVenue(editingV, vForm);
            else await createVenue(vForm);
            setVModal(false); load();
        } catch (err) { setVError(err.response?.data?.message || "Lưu thất bại"); }
        finally { setVSaving(false); }
    };
    const handleDeleteVenue = async (id) => {
        if (!window.confirm("Xóa địa điểm này?")) return;
        try { await deleteVenue(id); setVenues(v => v.filter(x => x.id !== id)); }
        catch (err) { alert(err.response?.data?.message || "Xóa thất bại"); }
    };

    // ── Resource CRUD ──
    const handleSaveResource = async (e) => {
        e.preventDefault(); setRError(""); setRSaving(true);
        try { await createResource(rForm); setRModal(false); setRForm(EMPTY_RES); load(); }
        catch (err) { setRError(err.response?.data?.message || "Lưu thất bại"); }
        finally { setRSaving(false); }
    };
    const handleDeleteRes = async (id) => {
        if (!window.confirm("Xóa tài nguyên này?")) return;
        try { await deleteResource(id); setResources(r => r.filter(x => x.id !== id)); }
        catch { alert("Xóa thất bại"); }
    };

    const toggleFacility = (f) => {
        setVForm(prev => ({
            ...prev,
            facilities: prev.facilities.includes(f)
                ? prev.facilities.filter(x => x !== f)
                : [...prev.facilities, f]
        }));
    };

    const filteredV = venues.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.location || "").toLowerCase().includes(search.toLowerCase())
    );
    const filteredR = resources.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category || "").toLowerCase().includes(search.toLowerCase())
    );

    const STATUS_CFG = {
        available: { label: "Sẵn sàng", cls: "badge-success" },
        unavailable: { label: "Không có", cls: "badge-danger" },
        maintenance: { label: "Bảo trì", cls: "badge-warning" },
        in_use: { label: "Đang dùng", cls: "badge-admin" },
    };
    const FACILITIES = ["Máy chiếu", "Màn hình LED", "Âm thanh", "Điều hòa", "Wifi", "Bảng trắng", "Webcam", "Micro"];

    return (
        <Layout>
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">Hạ tầng & Tài nguyên</span>
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                         Hệ thống quản lý <strong>{venues.length}</strong> điểm tổ chức và <strong>{resources.length}</strong> thiết bị vận hành.
                    </p>
                </div>
                {isManager && (
                    <div style={{ display: "flex", gap: 12 }}>
                        {tab === "venues" && <button className="btn btn-primary" style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 700 }} onClick={() => openVenueModal()}>+ THÊM ĐỊA ĐIỂM</button>}
                        {tab === "resources" && <button className="btn btn-primary" style={{ borderRadius: 14, height: 48, padding: "0 24px", fontWeight: 700 }} onClick={() => { setRForm(EMPTY_RES); setRError(""); setRModal(true); }}>+ THÊM TÀI NGUYÊN</button>}
                    </div>
                )}
            </div>

            {/* Sub-header & Controls */}
            <div style={{ 
                display: "flex", gap: 12, marginBottom: 32, padding: "12px 20px", 
                background: "#f8fafc", borderRadius: 20, alignItems: "center",
                border: "1px solid #f1f5f9"
            }}>
                <div style={{ display: "flex", gap: 6, background: "#fff", padding: 6, borderRadius: 14, boxShadow: "var(--shadow-sm)" }}>
                    {[
                        { key: "venues", label: "🏢 Địa điểm", count: venues.length },
                        { key: "resources", label: "🔧 Tài nguyên", count: resources.length },
                    ].map(t => (
                        <button key={t.key} 
                            style={{ 
                                padding: "10px 20px", borderRadius: 10, border: "none",
                                fontSize: 13, fontWeight: 800, cursor: "pointer",
                                background: tab === t.key ? "var(--color-primary)" : "transparent",
                                color: tab === t.key ? "#fff" : "#64748b",
                                transition: "all 0.2s"
                            }}
                            onClick={() => setTab(t.key)}>
                            {t.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>({t.count})</span>
                        </button>
                    ))}
                </div>
                
                <div style={{ position: "relative", marginLeft: "auto", width: 320 }}>
                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
                    <input className="form-control" placeholder="Tìm kiếm nhanh hạ tầng..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ borderRadius: 14, height: 46, paddingLeft: 44, border: "1px solid #e2e8f0", background: "#fff" }} />
                </div>
            </div>

            {/* ══ VENUES ══ */}
            {tab === "venues" && (
                loading ? <div className="empty-state" style={{ padding: 100 }}><span>⏳</span><p>Đang đồng bộ dữ liệu địa điểm...</p></div>
                    : filteredV.length === 0
                        ? <div className="empty-state" style={{ padding: 100 }}><span>🏢</span><p>Hiện không có địa điểm nào phù hợp.</p></div>
                        : <div className="grid-3" style={{ gap: 32 }}>
                            {filteredV.map(v => {
                                const sc = STATUS_CFG[v.status] || STATUS_CFG.available;
                                const fac = v.facilities ? (typeof v.facilities === 'string' ? JSON.parse(v.facilities) : v.facilities) : [];
                                return (
                                    <div key={v.id} className="card" 
                                        style={{ 
                                            padding: 0, overflow: "hidden", border: "1px solid #f1f5f9", 
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.03)", borderRadius: 24,
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            cursor: "default"
                                        }}>
                                        <div style={{ 
                                            padding: "32px 32px 24px", 
                                            background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
                                            borderBottom: "1px solid #f1f5f9" 
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                                <div style={{ 
                                                    fontSize: 11, fontWeight: 900, color: "var(--color-primary)", 
                                                    textTransform: "uppercase", letterSpacing: "0.1em",
                                                    background: "rgba(99,102,241,0.05)", padding: "4px 10px", borderRadius: 8
                                                }}>
                                                    {TYPE_ICON[v.type]} {TYPE_LABEL[v.type]}
                                                </div>
                                                <StatusBadge cfg={sc} />
                                            </div>
                                            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 16, color: "#1e293b", letterSpacing: "-0.02em" }}>{v.name}</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                {v.location && (
                                                    <div style={{ fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
                                                        <span style={{ fontSize: 18 }}>📍</span> <span>{v.location}</span>
                                                    </div>
                                                )}
                                                {v.capacity && (
                                                    <div style={{ fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
                                                        <span style={{ fontSize: 18 }}>👥</span> <span>Sức chứa: <strong style={{ color: "#1e293b" }}>{v.capacity}</strong> nhân sự</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ padding: "20px 32px", background: "#fff", display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            {fac.length > 0 ? fac.map(f => (
                                                <span key={f} style={{ 
                                                    fontSize: 12, background: "#f1f5f9", color: "#475569", 
                                                    fontWeight: 700, padding: "4px 12px", borderRadius: 10
                                                }}>{f}</span>
                                            )) : (
                                                <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Không có tiện ích tiêu chuẩn</span>
                                            )}
                                        </div>

                                        {isManager && (
                                            <div style={{ padding: "24px 32px", display: "flex", gap: 12, background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                                                <button className="btn btn-outline" 
                                                    style={{ flex: 1, borderRadius: 14, height: 44, fontWeight: 700 }} 
                                                    onClick={() => openVenueModal(v)}>✎ Hiệu chỉnh</button>
                                                {user?.role === "admin" && (
                                                    <button className="btn btn-danger" 
                                                        style={{ width: 50, borderRadius: 14, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }} 
                                                        onClick={() => handleDeleteVenue(v.id)}>🗑</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
            )}

            {/* ══ RESOURCES ══ */}
            {tab === "resources" && (
                <div className="data-table-wrapper">
                    {loading ? <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                        : filteredR.length === 0
                            ? <div className="empty-state"><span>🔧</span><p>Chưa có tài nguyên nào</p></div>
                            : <table className="data-table">
                                <thead><tr><th>#</th><th>Tên thiết bị</th><th>Danh mục</th><th>Số lượng</th><th>Đơn vị</th><th>Trạng thái</th>{isManager && <th>Thao tác</th>}</tr></thead>
                                <tbody>
                                    {filteredR.map((r, i) => {
                                        const sc = STATUS_CFG[r.status] || STATUS_CFG.available;
                                        return (
                                            <tr key={r.id}>
                                                <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>🔧 {r.name}</td>
                                                <td><span className="badge badge-default">{r.category || "—"}</span></td>
                                                <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{r.quantity}</td>
                                                <td style={{ color: "var(--text-secondary)" }}>{r.unit || "—"}</td>
                                                <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                                                {isManager && (
                                                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteRes(r.id)}>🗑</button></td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                    }
                </div>
            )}

            <Modal title={editingV ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"} isOpen={vModal} onClose={() => { setVModal(false); setVError(""); }} maxWidth="750px">
                <form onSubmit={handleSaveVenue} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {vError && <div className="alert alert-error">{vError}</div>}
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Tên địa điểm *</label>
                                <input className="form-control" value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} required placeholder="VD: Hội trường A, Phòng họp C1..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Loại không gian</label>
                                <select className="form-control" value={vForm.type} onChange={e => setVForm({ ...vForm, type: e.target.value })}>
                                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Sức chứa tối đa (người)</label>
                                <input type="number" className="form-control" value={vForm.capacity} onChange={e => setVForm({ ...vForm, capacity: e.target.value })} placeholder="VD: 100" />
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Địa chỉ / Vị trí cụ thể</label>
                                <input className="form-control" value={vForm.location} onChange={e => setVForm({ ...vForm, location: e.target.value })} placeholder="VD: Tầng 3, Tòa nhà trung tâm..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Trạng thái vận hành</label>
                                <select className="form-control" value={vForm.status} onChange={e => setVForm({ ...vForm, status: e.target.value })}>
                                    <option value="available">Sẵn sàng (Available)</option>
                                    <option value="unavailable">Tạm khóa (Unavailable)</option>
                                    <option value="maintenance">Đang bảo trì (Maintenance)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Ghi chú / Mô tả</label>
                                <textarea className="form-control" rows={1} style={{ minHeight: 46 }} value={vForm.description} onChange={e => setVForm({ ...vForm, description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Trang thiết bị & Tiện ích tiêu chuẩn</label>
                        <div style={{ 
                            display: "flex", flexWrap: "wrap", gap: 8, padding: "16px", 
                            background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0" 
                        }}>
                            {FACILITIES.map(f => (
                                <button key={f} type="button"
                                    className={`btn btn-sm ${vForm.facilities.includes(f) ? "btn-primary" : "btn-outline"}`}
                                    style={{ borderRadius: 8, fontSize: 12, borderWidth: 1 }}
                                    onClick={() => toggleFacility(f)}>{f}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                         <button type="button" className="btn btn-outline" onClick={() => setVModal(false)} style={{ borderRadius: 12, padding: "10px 24px" }}>Hủy</button>
                         <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 32px" }} disabled={vSaving}>
                            {vSaving ? "Đang lưu..." : (editingV ? "Lưu thay đổi" : "🚀 Thêm địa điểm ngay")}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Resource */}
            <Modal title="Thêm tài nguyên / thiết bị" isOpen={rModal} onClose={() => { setRModal(false); setRError(""); }} maxWidth="600px">
                <form onSubmit={handleSaveResource} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {rError && <div className="alert alert-error">{rError}</div>}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Tên thiết bị / Tài nguyên *</label>
                        <input className="form-control" value={rForm.name} onChange={e => setRForm({ ...rForm, name: e.target.value })} required placeholder="VD: Máy chiếu Epson 4K, Loa kéo Harman..." />
                    </div>
                    <div className="grid-2">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Danh mục phân loại</label>
                            <select className="form-control" value={rForm.category} onChange={e => setRForm({ ...rForm, category: e.target.value })}>
                                <option value="">-- Chọn danh mục --</option>
                                {RES_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Số lượng tồn kho</label>
                            <input type="number" className="form-control" min={1} value={rForm.quantity} onChange={e => setRForm({ ...rForm, quantity: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Đơn vị tính</label>
                        <input className="form-control" value={rForm.unit} onChange={e => setRForm({ ...rForm, unit: e.target.value })} placeholder="VD: cái, chiếc, bộ, m..." />
                    </div>
                    <div style={{ padding: "16px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setRModal(false)} style={{ borderRadius: 12 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: "10px 32px" }} disabled={rSaving}>
                            {rSaving ? "Đang thêm..." : "✅ Thêm tài nguyên"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}

function StatusBadge({ cfg }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", padding: "4px 10px",
            borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: cfg.cls === 'badge-success' ? '#d1fae5' : cfg.cls === 'badge-danger' ? '#fee2e2' : cfg.cls === 'badge-warning' ? '#fef3c7' : '#ede9fe',
            color: cfg.cls === 'badge-success' ? '#065f46' : cfg.cls === 'badge-danger' ? '#991b1b' : cfg.cls === 'badge-warning' ? '#92400e' : '#4338ca',
        }}>
            {cfg.label}
        </span>
    );
}
