const request = require("supertest");
const app = require("../server");

describe("Budget API", () => {

    test("GET /api/budgets should return budgets", async () => {
        const res = await request(app).get("/api/budgets");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /api/budgets should create budget", async () => {
        const res = await request(app)
            .post("/api/budgets")
            .send({
                event_id: 1,
                item: "Decoration",
                cost: 500
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBeDefined();
    });

});