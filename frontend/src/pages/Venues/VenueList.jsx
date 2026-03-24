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
            <div className="page-header">
                <div>
                    <h2>🏢 Địa điểm & Tài nguyên</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                        {venues.length} địa điểm · {resources.length} thiết bị
                    </p>
                </div>
                {isManager && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {tab === "venues" && <button className="btn btn-primary" onClick={() => openVenueModal()}>+ Thêm địa điểm</button>}
                        {tab === "resources" && <button className="btn btn-primary" onClick={() => { setRForm(EMPTY_RES); setRError(""); setRModal(true); }}>+ Thêm tài nguyên</button>}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[
                    { key: "venues", label: `🏢 Địa điểm (${venues.length})` },
                    { key: "resources", label: `🔧 Tài nguyên (${resources.length})` },
                ].map(t => (
                    <button key={t.key} className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTab(t.key)}>{t.label}</button>
                ))}
                <input className="form-control" placeholder="🔍 Tìm kiếm..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 240, marginLeft: "auto" }} />
            </div>

            {/* ══ VENUES ══ */}
            {tab === "venues" && (
                loading ? <div className="empty-state"><span>⏳</span><p>Đang tải...</p></div>
                    : filteredV.length === 0
                        ? <div className="empty-state"><span>🏢</span><p>Chưa có địa điểm nào</p></div>
                        : <div className="grid-3" style={{ alignItems: "start" }}>
                            {filteredV.map(v => {
                                const sc = STATUS_CFG[v.status] || STATUS_CFG.available;
                                const fac = v.facilities ? (typeof v.facilities === 'string' ? JSON.parse(v.facilities) : v.facilities) : [];
                                return (
                                    <div key={v.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                                        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-color)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                    {TYPE_ICON[v.type]} {TYPE_LABEL[v.type]}
                                                </div>
                                                <span className={`badge ${sc.cls}`}>{sc.label}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{v.name}</div>
                                            {v.location && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>📍 {v.location}</div>}
                                            {v.capacity && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>👤 Sức chứa: {v.capacity} người</div>}
                                        </div>
                                        {fac.length > 0 && (
                                            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {fac.map(f => (
                                                    <span key={f} className="badge badge-default" style={{ fontSize: 10 }}>{f}</span>
                                                ))}
                                            </div>
                                        )}
                                        {isManager && (
                                            <div style={{ padding: "10px 16px", display: "flex", gap: 8 }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => openVenueModal(v)}>✎ Sửa</button>
                                                {user?.role === "admin" && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVenue(v.id)}>🗑</button>
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

            {/* Modal Venue */}
            <Modal title={editingV ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"} isOpen={vModal} onClose={() => { setVModal(false); setVError(""); }}>
                <form onSubmit={handleSaveVenue}>
                    {vError && <div className="alert alert-error">{vError}</div>}
                    <div className="form-group">
                        <label>Tên địa điểm *</label>
                        <input className="form-control" value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Loại</label>
                            <select className="form-control" value={vForm.type} onChange={e => setVForm({ ...vForm, type: e.target.value })}>
                                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sức chứa</label>
                            <input type="number" className="form-control" value={vForm.capacity} onChange={e => setVForm({ ...vForm, capacity: e.target.value })} placeholder="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ / Vị trí</label>
                        <input className="form-control" value={vForm.location} onChange={e => setVForm({ ...vForm, location: e.target.value })} placeholder="Phòng B4, Tầng 3..." />
                    </div>
                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select className="form-control" value={vForm.status} onChange={e => setVForm({ ...vForm, status: e.target.value })}>
                            <option value="available">Sẵn sàng</option>
                            <option value="unavailable">Không có sẵn</option>
                            <option value="maintenance">Đang bảo trì</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tiện ích</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                            {FACILITIES.map(f => (
                                <button key={f} type="button"
                                    className={`btn btn-sm ${vForm.facilities.includes(f) ? "btn-primary" : "btn-outline"}`}
                                    onClick={() => toggleFacility(f)}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-control" rows={2} value={vForm.description} onChange={e => setVForm({ ...vForm, description: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={vSaving}>
                        {vSaving ? "Đang lưu..." : (editingV ? "Lưu thay đổi" : "Thêm địa điểm")}
                    </button>
                </form>
            </Modal>

            {/* Modal Resource */}
            <Modal title="Thêm tài nguyên / thiết bị" isOpen={rModal} onClose={() => { setRModal(false); setRError(""); }}>
                <form onSubmit={handleSaveResource}>
                    {rError && <div className="alert alert-error">{rError}</div>}
                    <div className="form-group">
                        <label>Tên thiết bị *</label>
                        <input className="form-control" value={rForm.name} onChange={e => setRForm({ ...rForm, name: e.target.value })} required placeholder="VD: Máy chiếu Epson 4K" />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Danh mục</label>
                            <select className="form-control" value={rForm.category} onChange={e => setRForm({ ...rForm, category: e.target.value })}>
                                <option value="">-- Chọn danh mục --</option>
                                {RES_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Số lượng</label>
                            <input type="number" className="form-control" min={1} value={rForm.quantity} onChange={e => setRForm({ ...rForm, quantity: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Đơn vị</label>
                        <input className="form-control" value={rForm.unit} onChange={e => setRForm({ ...rForm, unit: e.target.value })} placeholder="cái, bộ, m..." />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={rSaving}>
                        {rSaving ? "Đang thêm..." : "Thêm tài nguyên"}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
