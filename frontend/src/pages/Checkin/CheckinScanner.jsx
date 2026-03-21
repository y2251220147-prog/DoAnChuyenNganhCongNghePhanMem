import { useState, useRef, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import api from "../../services/api";

export default function CheckinScanner() {

    const [guestId, setGuestId] = useState("");
    const [status, setStatus] = useState("");
    const [guestInfo, setGuestInfo] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleCheckin = async (e) => {
        e.preventDefault();
        if (!guestId) return;

        setStatus("testing");
        setGuestInfo(null);

        try {
            // First find the guest (we need a getById endpoint or similar)
            // For now, let's assume we use the update endpoint directly if ID is known
            const res = await api.put(`/guests/${guestId}/checkin`, { checked_in: true });
            
            setStatus("success");
            setGuestId("");
            inputRef.current?.focus();
            
            // Note: In a real app we'd fetch the guest name to show a success message like "Welcome, John Doe!"
            setTimeout(() => setStatus(""), 3000);

        } catch (err) {
            setStatus("error");
            setTimeout(() => setStatus(""), 3000);
        }
    };

    return (

        <Layout>

            <h2 className="page-title">Máy quét Check-in nhanh</h2>

            <div className="profile-container" style={{ maxWidth: "500px", margin: "0 auto" }}>
                
                <div className="profile-card" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "20px" }}>
                        {status === "success" ? "✅" : status === "error" ? "❌" : "🔍"}
                    </div>
                    
                    <h3>Quét mã QR hoặc nhập Mã khách mời</h3>
                    <p style={{ color: "#94a3b8", marginBottom: "30px" }}>Dùng thiết bị quét để nhập ID tự động</p>

                    <form onSubmit={handleCheckin}>
                        <input
                            ref={inputRef}
                            className="form-control"
                            style={{ fontSize: "24px", textAlign: "center", letterSpacing: "4px" }}
                            placeholder="GUEST-ID"
                            value={guestId}
                            onChange={(e) => setGuestId(e.target.value)}
                            autoFocus
                        />
                        <button className="btn btn-primary" style={{ width: "100%", marginTop: "20px", padding: "15px" }}>
                            Xác nhận Check-in
                        </button>
                    </form>

                    {status === "success" && (
                        <div className="alert alert-success" style={{ marginTop: "20px" }}>
                            🎉 Check-in thành công!
                        </div>
                    )}
                    {status === "error" && (
                        <div className="alert alert-error" style={{ marginTop: "20px" }}>
                            ⚠️ Không tìm thấy khách mời hoặc lỗi hệ thống
                        </div>
                    )}
                </div>

                <div className="profile-card" style={{ marginTop: "20px" }}>
                    <h4>Hướng dẫn nhanh:</h4>
                    <ul style={{ color: "#94a3b8", fontSize: "14px", paddingLeft: "20px", lineHeight: "2" }}>
                        <li>Đặt con trỏ vào ô nhập liệu trước khi quét.</li>
                        <li>Hệ thống sẽ tự động xác nhận sau khi quét xong.</li>
                        <li>Trạng thái sẽ được cập nhật đồng thời trong danh sách khách mời.</li>
                    </ul>
                </div>
            </div>

        </Layout>

    );
}