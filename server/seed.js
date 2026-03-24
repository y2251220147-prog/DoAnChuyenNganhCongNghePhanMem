require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./config/database");

async function seed() {
    console.log("🌱 Seeding database...");

    const defaultUsers = [
        { name: "Super Admin", email: "admin@eventpro.com", password: "admin123", role: "admin" },
        { name: "Organizer Demo", email: "organizer@eventpro.com", password: "organizer123", role: "organizer" },
        { name: "User Demo", email: "user@eventpro.com", password: "user123", role: "user" },
    ];

    for (const u of defaultUsers) {
        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [u.email]);
        if (existing.length > 0) {
            console.log(`⚠️  Đã tồn tại: ${u.email}`);
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [u.name, u.email, hashed, u.role]
        );
        console.log(`✅ Đã tạo [${u.role}]: ${u.email} / ${u.password}`);
    }

    console.log("\n🎉 Xong! Đăng nhập bằng:");
    console.log("   Admin:     admin@eventpro.com     / admin123");
    console.log("   Organizer: organizer@eventpro.com / organizer123");
    console.log("   User:      user@eventpro.com      / user123");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
});