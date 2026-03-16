const request = require("supertest");
const app = require("../server");

describe("Auth API", () => {

    test("POST /api/auth/register should create new user", async () => {

        const email = `user${Date.now()}@test.com`;

        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: email,
                password: "123456"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("userId");

    });

});