/**
 * Main entry point for backend API
 * Sets up Express server with routes and middleware
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pinoHttp } from "./utils/logger";
import aiRoutes from "./routes/ai";
import solanaRoutes from "./routes/solana";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"];

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());

// Request logging middleware
app.use(pinoHttp());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/v1/ai", aiRoutes);
app.use("/v1/solana", solanaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    requestId: req.headers["x-request-id"] || "unknown",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI endpoint: http://localhost:${PORT}/v1/ai/reading`);
  console.log(`💰 Solana endpoint: http://localhost:${PORT}/v1/solana/verify-and-grant`);
});

