/**
 * Tiện ích format ngày tháng — dd/mm/yyyy toàn hệ thống
 */

/**
 * Format ISO/Date string → "dd/mm/yyyy"
 * @param {string|Date} dateStr
 * @returns {string} e.g. "04/05/2026"
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format ISO/Date string → "dd/mm/yyyy HH:MM"
 * @param {string|Date} dateStr
 * @returns {string} e.g. "04/05/2026 14:30"
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
};

/**
 * Chuyển ISO string → giá trị cho input[type=datetime-local]
 * @param {string} isoStr
 * @returns {string} e.g. "2026-05-04T14:30"
 */
export const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Chuyển ISO string → giá trị cho input[type=date]
 * @param {string} isoStr
 * @returns {string} e.g. "2026-05-04"
 */
export const toDateInput = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Kiểm tra task có bị quá hạn không
 * @param {string} dueDateStr ISO date string
 * @param {string} status task status
 * @returns {boolean}
 */
export const isOverdue = (dueDateStr, status) => {
    if (!dueDateStr || status === "done") return false;
    return new Date(dueDateStr) < new Date();
};

/**
 * Tính số ngày còn lại đến deadline
 * @param {string} dueDateStr
 * @returns {number} số ngày (âm = đã quá hạn)
 */
export const daysUntilDeadline = (dueDateStr) => {
    if (!dueDateStr) return null;
    const diff = new Date(dueDateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
