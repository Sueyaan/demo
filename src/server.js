require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const taskRoutes = require("./routes/tasks");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/tasks", taskRoutes);
app.use("/attendance", require("./routes/attendance"));

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.statusCode || 500).json({
    error: "internal_error",
    message: err.message,
    code: err.code,
    meta: err.meta,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});



const port = process.env.PORT || 4000;
app.listen(port, () => console.log("API running on port " + port));