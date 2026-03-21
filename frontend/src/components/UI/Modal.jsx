import { useEffect } from "react";
import "../../styles/global.css";

export default function Modal({ title, isOpen, onClose, children }) {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px"
        }}>
            <div className="card" style={{
                width: "100%", maxWidth: "480px",
                position: "relative",
                animation: "modalFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: "20px", right: "20px",
                        background: "none", border: "none", fontSize: "20px",
                        cursor: "pointer", color: "var(--text-muted)"
                    }}
                >
                    &times;
                </button>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                    {title}
                </h3>
                {children}
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
