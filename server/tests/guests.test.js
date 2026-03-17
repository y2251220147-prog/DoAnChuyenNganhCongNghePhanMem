const request = require("supertest");
const app = require("../server");

describe("Guests API", () => {

    test("GET /api/guests should return guests list", async () => {
        const res = await request(app).get("/api/guests");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /api/guests should create guest", async () => {
        const res = await request(app)
            .post("/api/guests")
            .send({
                event_id: 1,
                name: "Nguyen Van A",
                email: "guest@test.com"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBeDefined();
    });

});