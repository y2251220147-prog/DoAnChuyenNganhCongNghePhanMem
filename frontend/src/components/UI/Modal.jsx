import { useEffect } from "react";
import "../../styles/global.css";

export default function Modal({ title, isOpen, onClose, children, maxWidth = "520px" }) {

    // Khóa scroll body khi modal mở
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Đóng khi bấm Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="modal-box"
                style={{ maxWidth }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="modal-header">
                    <h3 id="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Đóng">
                        ✕
                    </button>
                </div>

                {/* Body — có thể cuộn nếu nội dung dài */}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
