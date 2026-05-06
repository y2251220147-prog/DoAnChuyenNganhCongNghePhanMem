const path = require('path');
const fs = require('fs');
const User = require('../models/userModel');
const sharp = require('sharp');

// Upload avatar cho người dùng hiện tại
exports.uploadAvatar = async (req, res) => {
    let rawPath = null;
    let optimizedPath = null;

    try {
        // 1. Kiểm tra xem có file được upload không
        if (!req.file) {
            return res.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng chọn file ảnh để upload'
            });
        }

        rawPath = req.file.path;
        const userId = req.user.id;
        
        // 2. Tối ưu hóa ảnh bằng Sharp (Resize & Nén)
        // Tạo đường dẫn mới cho ảnh đã tối ưu
        const optimizedFilename = `optimized-${req.file.filename}`;
        optimizedPath = path.join(req.file.destination, optimizedFilename);

        await sharp(rawPath)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(optimizedPath);

        // Xóa file gốc chưa nén
        if (fs.existsSync(rawPath)) {
            fs.unlinkSync(rawPath);
        }

        // 3. Tìm người dùng trong database
        const user = await User.findById(userId);
        if (!user) {
            if (fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);
            return res.status(404).json({
                thanhCong: false,
                thongBao: 'Không tìm thấy người dùng'
            });
        }

        // 4. Xóa avatar cũ nếu có (không xóa nếu là avatar mặc định)
        if (user.avatar && !user.avatar.includes('default')) {
            const oldAvatarPath = path.join(__dirname, '..', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // 5. Cập nhật avatar mới vào database
        const newAvatarUrl = `uploads/avatars/${optimizedFilename}`;
        await User.updateAvatar(userId, newAvatarUrl);

        // 6. Trả về kết quả thành công
        res.status(200).json({
            thanhCong: true,
            thongBao: 'Cập nhật ảnh đại diện thành công (Đã tối ưu dung lượng)',
            duLieu: {
                avatar: newAvatarUrl
            }
        });

    } catch (error) {
        // Dọn dẹp file lỗi
        if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
        if (optimizedPath && fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);
        
        console.error('Upload Error:', error);
        res.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi server khi xử lý file ảnh'
        });
    }
};
