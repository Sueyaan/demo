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

const allowlist = [
  process.env.FRONTEND_URL,          // production vercel domain
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .map((s) => (s || "").trim())
  .filter(Boolean);

const vercelPrefix = (process.env.CORS_VERCEL_PREFIX || "").trim(); // e.g. https://v0-

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/postman
  if (allowlist.includes(origin)) return true;

  // Allow Vercel preview domains for v0 projects
  // Example: https://v0-something-<hash>.vercel.app
  if (vercelPrefix && origin.startsWith(vercelPrefix) && origin.endsWith(".vercel.app")) return true;

  return false;
}

const corsOptions = {
  origin(origin, cb) {
    // IMPORTANT: do NOT throw errors here
    // If not allowed => cb(null, false) so no CORS headers are added
    // Browser blocks, server does not 500.
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
