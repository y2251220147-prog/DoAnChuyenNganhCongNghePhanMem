const request = require("supertest")
const app = require("../server")

describe("Events API", () => {

    test("should get events", async () => {

        const res = await request(app).get("/api/events")

        expect(res.statusCode).toBe(200)

    })

})