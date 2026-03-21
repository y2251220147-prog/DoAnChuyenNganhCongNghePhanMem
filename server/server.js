const express = require("express");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const staffRoutes = require("./routes/staffRoutes");
const guestRoutes = require("./routes/guestRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const taskRoutes = require("./routes/taskRoutes");

// Controllers
const checkinController = require("./controllers/checkinController");

const app = express();

app.use(cors());
app.use(express.json());

// API Mounting
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/tasks", taskRoutes);

// Special endpoints
app.post("/api/checkin", checkinController.checkin);

app.get("/", (req, res) => {
    res.send("Server running");
});

if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;