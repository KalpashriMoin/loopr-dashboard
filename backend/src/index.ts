import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import { notFound, errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import exportRoutes from "./routes/export.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting on auth routes to slow down brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});
app.use("/api/auth", authLimiter);

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is healthy", timestamp: new Date() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/export", exportRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Loopr Dashboard API running on port ${PORT} (${process.env.NODE_ENV})`);
  });
};

start();
