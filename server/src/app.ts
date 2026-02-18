import express from "express";
import cors from "cors";
import path from "path";
import publicRoutes from "./routes/public.routes";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import parentAuthRoutes from "./routes/parentAuth.routes";
import parentRoutes from "./routes/parent.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { rateLimiter } from "./middlewares/rateLimit.middleware";
import { requestLogger } from "./middlewares/logger.middleware";

const app = express();

// Request logging (first middleware)
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// CORS: with credentials: true, origin cannot be "*" — allow explicit origins
const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : [];

const allowedOrigins = Array.from(new Set([...defaultLocalOrigins, ...envOrigins]));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-device-id"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parent/auth", parentAuthRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
