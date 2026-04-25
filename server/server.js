require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes hiện có
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/guests", require("./routes/guestRoutes"));
app.use("/api/timeline", require("./routes/timelineRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/checkin", require("./routes/checkinRoutes"));

// Routes mới v3
app.use("/api/venues", require("./routes/venueRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/attendees", require("./routes/attendeeRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.get("/", (req, res) => res.json({ message: "EventCore API", version: "3.0" }));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: "Internal error" }); });

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test")
    app.listen(PORT, () => console.log(`✅ EventCore API v3.0 :${PORT}`));
module.exports = app;
