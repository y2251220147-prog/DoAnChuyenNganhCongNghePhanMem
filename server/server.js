const express = require("express");
const cors = require("cors");

const eventRoutes = require("./routes/eventRoutes");
const staffRoutes = require("./routes/staffRoutes");
const guestRoutes = require("./routes/guestRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const authRoutes = require("./routes/authRoutes");

const checkinController = require("./controllers/checkinController");

/* PHẢI TẠO APP TRƯỚC */
const app = express();

app.use(cors());
app.use(express.json());

/* SAU ĐÓ MỚI DÙNG ROUTE */
app.use("/api/events", eventRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/auth", authRoutes);

app.post("/api/checkin", checkinController.checkin);

app.get("/", (req, res) => {
    res.send("Server running");
});

/* Chỉ chạy server khi không phải test */
if (process.env.NODE_ENV !== "test") {
    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
}

module.exports = app;