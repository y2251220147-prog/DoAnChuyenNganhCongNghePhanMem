const request = require("supertest");
const app = require("../server");

describe("Auth API Suite - Tuan 7", () => {
    const testUser = {
        name: "Test User 7",
        email: `test${Date.now()}@tuan7.com`,
        password: "password123"
    };

    let authToken = "";

    test("1. Đăng ký tài khoản mới (POST /api/auth/register)", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("userId");
    });

    test("2. Báo lỗi khi đăng ký trùng Email", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/exists/i);
    });

    test("3. Đăng nhập và nhận JWT Token (POST /api/auth/login)", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user.email).toBe(testUser.email);
        authToken = res.body.token;
    });

    test("4. Truy cập Route bảo vệ với Token hợp lệ (GET /api/auth/verify)", async () => {
        const res = await request(app)
            .get("/api/auth/verify")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.email).toBe(testUser.email);
    });

    test("5. Bị chặn khi truy cập không có Token (Unauthorized)", async () => {
        const res = await request(app).get("/api/auth/verify");
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized");
    });
});