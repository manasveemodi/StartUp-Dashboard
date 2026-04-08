const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // increase limit
});

// Auth endpoints get stricter limit
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  // Increase to 100 during development, or keep 20 for production
  max: process.env.NODE_ENV === 'development' ? 100 : 20, 
  message: { 
    success: false, 
    message: "Too many auth attempts." 
  },
  // Optional: Don't count successful requests if you want to be strict only on failures
  skipSuccessfulRequests: true 
});

app.use("/api/auth/", authLimiter);

// ── Body Parsing & Sanitization ───────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize()); // prevent NoSQL injection

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP Logging ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Static Files ──────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/meetmind_enterprise", {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => logger.info("✅ MongoDB connected"))
.catch((err) => { logger.error("❌ MongoDB connection failed", err); process.exit(1); });

mongoose.connection.on("error", (err) => logger.error("MongoDB error", err));
mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/meetings",   require("./routes/meetings"));
app.use("/api/notes",      require("./routes/notes"));
app.use("/api/recordings", require("./routes/recordings"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/admin",      require("./routes/admin"));

app.use("/api/files", require("./routes/files"));

// Health check (no auth)
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const server = app.listen(PORT, () => logger.info(`🚀 MeetMind API running on port ${PORT} [${process.env.NODE_ENV}]`));

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed. Process exiting.");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => { logger.error("Unhandled Rejection:", reason); shutdown("unhandledRejection"); });
process.on("uncaughtException",  (err)    => { logger.error("Uncaught Exception:",  err);    shutdown("uncaughtException"); });

module.exports = app;