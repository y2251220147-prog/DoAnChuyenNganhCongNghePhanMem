const User = require("../models/userModel");

const VALID_ROLES = ["admin", "organizer", "user"];

/**
 * Lấy danh sách tất cả users (ẩn password)
 */
const getAllUsers = async () => {
    return await User.getAllUsers();
};

/**
 * Lấy thông tin 1 user theo ID
 */
const getUserById = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }
    // Không trả về password
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = user;
    return safeUser;
};

/**
 * Đổi role của user
 */
const changeRole = async (id, role) => {
    if (!VALID_ROLES.includes(role)) {
        throw { status: 400, message: `Role must be one of: ${VALID_ROLES.join(", ")}` };
    }

    const user = await User.findById(id);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    await User.updateRole(id, role);
};

/**
 * Xóa user
 */
const deleteUser = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw { status: 404, message: "User not found" };
    }
    await User.deleteUser(id);
};

module.exports = { getAllUsers, getUserById, changeRole, deleteUser };
