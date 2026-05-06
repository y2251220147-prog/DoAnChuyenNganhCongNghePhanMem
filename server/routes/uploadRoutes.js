const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadController = require('../controllers/uploadController');

// Tuyến đường upload ảnh đại diện - Yêu cầu đăng nhập
// upload.single('avatar'): Chấp nhận 1 file với key là 'avatar' trong FormData
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadController.uploadAvatar);

module.exports = router;
