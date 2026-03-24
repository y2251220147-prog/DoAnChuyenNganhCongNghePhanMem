const crypto = require("crypto");

// FIX: QR được tạo và ký phía server bằng HMAC
// Format: EP-{eventId}-{nameCode}-{timestamp}-{hmac_signature}
const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET || "qr_fallback_secret";

/**
 * Tạo QR code có chữ ký server-side
 * @param {number} eventId
 * @param {string} name
 * @returns {string} qr_code string
 */
const generateQR = (eventId, name) => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const payload = `EP-${eventId}-${code}-${ts}-${rand}`;
    // HMAC signature để verify tính toàn vẹn
    const sig = crypto.createHmac("sha256", QR_SECRET).update(payload).digest("hex").substring(0, 8).toUpperCase();
    return `${payload}-${sig}`;
};

/**
 * Verify QR code hợp lệ (có chữ ký đúng)
 * @param {string} qrCode
 * @returns {boolean}
 */
const verifyQR = (qrCode) => {
    const parts = qrCode.split("-");
    if (parts.length < 6) return false;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join("-");
    const expected = crypto.createHmac("sha256", QR_SECRET).update(payload).digest("hex").substring(0, 8).toUpperCase();
    return sig === expected;
};

module.exports = { generateQR, verifyQR };
