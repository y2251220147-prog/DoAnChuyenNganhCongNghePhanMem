// formatDateMiddleware.js - No dependencies required

// Regex to detect dd/mm/yyyy (or dd/mm/yyyy HH:mm)
const DDMMYYYY_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;

// Chuyển từ dd/mm/yyyy -> YYYY-MM-DD để lưu db
const parseIncomingDate = (val) => {
    if (typeof val === 'string') {
        const match = val.match(DDMMYYYY_REGEX);
        if (match) {
            const [, d, m, y, h, min] = match;
            if (h && min) return `${y}-${m}-${d} ${h}:${min}:00`;
            return `${y}-${m}-${d} 00:00:00`;
        }
    }
    return val;
};

// Đệ quy parse request body/query
const processIncoming = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(processIncoming);
    }
    const result = {};
    for (const key in obj) {
        result[key] = parseIncomingDate(obj[key]);
    }
    return result;
};

// Chuyển từ YYYY-MM-DD -> dd/mm/yyyy (hoặc JS Date object sang dd/mm/yyyy)
const formatOutgoingDate = (val) => {
    if (val instanceof Date) {
        const d = String(val.getDate()).padStart(2, '0');
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const y = val.getFullYear();
        const h = String(val.getHours()).padStart(2, '0');
        const min = String(val.getMinutes()).padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}`;
    }
    if (typeof val === 'string' && val.length > 8 && !isNaN(Date.parse(val))) {
        // Có thể là ISO string từ db, MySQL trả về ISO 8601
        // Tùy theo logic project, nếu muốn tự động convert mọi ISO string
        // Nhưng tạm thời convert instance Date trước.
    }
    return val;
};

const processOutgoing = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(processOutgoing);
    }
    if (obj instanceof Date) {
        return formatOutgoingDate(obj);
    }
    const result = {};
    for (const key in obj) {
        if (obj[key] instanceof Date) {
            result[key] = formatOutgoingDate(obj[key]);
        } else if (typeof obj[key] === 'object') {
            result[key] = processOutgoing(obj[key]);
        } else {
            result[key] = obj[key];
        }
    }
    return result;
};

const dateMiddleware = (req, res, next) => {
    if (req.body) req.body = processIncoming(req.body);
    if (req.query) req.query = processIncoming(req.query);

    // Override res.json to format before sending
    const originalJson = res.json;
    res.json = function (data) {
        const formattedData = processOutgoing(data);
        return originalJson.call(this, formattedData);
    };

    next();
};

module.exports = dateMiddleware;
