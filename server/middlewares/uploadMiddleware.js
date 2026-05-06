const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Hàm tạo thư mục nếu chưa tồn tại
const taoThuMuc = (duongDan) => {
    if (!fs.existsSync(duongDan)) {
        fs.mkdirSync(duongDan, { recursive: true });
    }
};

// Đảm bảo thư mục lưu trữ tồn tại khi khởi chạy Middleware
const thuMucAvatar = 'uploads/avatars';
taoThuMuc(thuMucAvatar);

// Cấu hình nơi lưu trữ file
const cauHinhLuuTru = multer.diskStorage({
    destination: (req, file, cb) => {
        // Trỏ trực tiếp vào thư mục đã tạo ở trên
        cb(null, thuMucAvatar);
    },
    filename: (req, file, cb) => {
        // Tên file duy nhất bằng UUID để tránh trùng lặp
        const duoiFile = path.extname(file.originalname);
        cb(null, uuidv4() + duoiFile);
    }
});

// Bộ lọc định dạng file (Chỉ chấp nhận file ảnh JPG, PNG, GIF, WEBP)
const boLocFile = (req, file, cb) => {
    const listDinhDang = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (listDinhDang.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận các định dạng file ảnh (JPG, PNG, GIF, WEBP)'), false);
    }
};

// Khởi tạo middleware upload
const upload = multer({
    storage: cauHinhLuuTru,
    fileFilter: boLocFile,
    limits: {
        fileSize: 2 * 1024 * 1024 // Giới hạn 2MB cho Avatar
    }
});

module.exports = upload;
