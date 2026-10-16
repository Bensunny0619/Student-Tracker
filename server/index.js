
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const createSessionMiddleware = require("./config/session");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const progressRoutes = require("./routes/progressRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

app.use(createSessionMiddleware());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Student Progress Tracker API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/students/:id/lessons", lessonRoutes);
app.use("/api/students/:id/assessments", assessmentRoutes);
app.use("/api/students/:id/progress", progressRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
