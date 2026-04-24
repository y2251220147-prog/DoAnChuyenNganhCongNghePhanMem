const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const SALT_ROUNDS = 10;

const register = async ({ name, email, password }) => {
    if (!name || !email || !password)
        throw { status: 400, message: "Name, email and password are required" };
    if (password.length < 6)
        throw { status: 400, message: "Password must be at least 6 characters" };

    const existing = await User.findByEmail(email);
    if (existing) throw { status: 400, message: "Email already exists" };

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = await User.createUser({ name, email, password: hashedPassword, role: "user" });

    // Thông báo cho toàn bộ admin
    const { notifyAdmins } = require("./notificationUtils");
    await notifyAdmins({
        type: 'default',
        title: 'Thành viên mới',
        message: `Tài khoản ${name} (${email}) vừa đăng ký. Hãy phân quyền nếu cần.`,
        link: '/admin/users'
    });

    return { userId: id };
};

const login = async ({ email, password }) => {
    if (!email || !password)
        throw { status: 400, message: "Email and password are required" };

    const user = await User.findByEmail(email);
    if (!user) throw { status: 401, message: "Invalid email or password" };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { status: 401, message: "Invalid email or password" };

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "2h" }
    );
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const resetPassword = async (uid, payload) => {
    const { oldPassword: currentPwd, newPassword: nextPwd } = payload;

    if (!currentPwd || !nextPwd) {
        throw { status: 400, message: "Thông tin mật khẩu không được để trống" };
    }
    
    if (nextPwd.length < 6) {
        throw { status: 400, message: "Mật khẩu mới phải từ 6 ký tự trở lên" };
    }

    const userData = await User.findById(uid);
    if (!userData) {
        throw { status: 404, message: "Không tìm thấy người dùng" };
    }

    const isCorrect = await bcrypt.compare(currentPwd, userData.password);
    if (!isCorrect) {
        throw { status: 400, message: "Mật khẩu hiện tại không chính xác" };
    }

    const saltRounds = SALT_ROUNDS;
    const encrypted = await bcrypt.hash(nextPwd, saltRounds);
    await User.updatePassword(uid, encrypted);
};

module.exports = { register, login, resetPassword };
