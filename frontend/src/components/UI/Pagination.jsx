import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
            <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                style={{ padding: "4px 12px" }}
            >
                &laquo; Trước
            </button>

            {pages.map(p => (
                <button
                    key={p}
                    className={`btn btn-sm ${p === currentPage ? "btn-primary" : "btn-outline"}`}
                    onClick={() => onPageChange(p)}
                    style={{ 
                        minWidth: "32px", 
                        height: "32px", 
                        padding: 0,
                        backgroundColor: p === currentPage ? "var(--color-primary)" : "transparent",
                        color: p === currentPage ? "#fff" : "inherit"
                    }}
                >
                    {p}
                </button>
            ))}

            <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                style={{ padding: "4px 12px" }}
            >
                Sau &raquo;
            </button>
        </div>
    );
}
