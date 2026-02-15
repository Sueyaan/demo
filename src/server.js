require("dotenv").config();
console.log("JWT_ACCESS_SECRET loaded:", !!process.env.JWT_ACCESS_SECRET);
console.log("JWT_ACCESS_TTL:", process.env.JWT_ACCESS_TTL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const taskRoutes = require("./routes/tasks");

const app = express();
app.use(helmet());

const allowlist = [
  process.env.FRONTEND_URL,
  "https://v0-finalbur.vercel.app",  
  "http://localhost:3000",
].filter(Boolean);

console.log("CORS Allowlist:", allowlist);

app.use(cors({
  origin: function (origin, callback) {
    console.log("Request from origin:", origin);
    
    // Allow no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow if in allowlist
    if (allowlist.includes(origin)) return callback(null, true);
    
    // Allow all Vercel preview and production domains
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    
    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/tasks", taskRoutes);
app.use("/attendance", require("./routes/attendance"));

// Error handler
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