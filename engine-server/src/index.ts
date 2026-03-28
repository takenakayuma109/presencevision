/**
 * Presence Vision Engine Server
 *
 * Next.jsフロントエンドとは独立して動作するエンジンサーバー。
 * SEO/AEO/GEO自動化エンジンをREST APIで制御。
 */

import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { initDB, closeDB } from "./db/index.js";
import { setDBAvailable } from "./engine/activity-logger.js";

import engineRoutes from "./routes/engine.js";
import activitiesRoutes from "./routes/activities.js";
import healthRoutes from "./routes/health.js";
import articlesRoutes from "./routes/articles.js";
import analyticsRoutes from "./routes/analytics.js";
import { restoreProjects } from "./engine/presence-engine.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.ENGINE_PORT ?? "4000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------
const app = express();

// CORS
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
    credentials: true,
  }),
);

// JSON body parser
app.use(express.json({ limit: "10mb" }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ---------------------------------------------------------------------------
// API Key Auth Middleware
// ---------------------------------------------------------------------------
function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check and public articles
  if (req.path === "/health" || req.path.startsWith("/health") || req.path.startsWith("/articles") || req.path.startsWith("/analytics")) {
    next();
    return;
  }

  // If no API key is configured, skip auth (development mode)
  if (!ENGINE_API_KEY) {
    next();
    return;
  }

  const providedKey = req.headers["x-api-key"];

  if (!providedKey || providedKey !== ENGINE_API_KEY) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing x-api-key header",
    });
    return;
  }

  next();
}

app.use(apiKeyAuth);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/health", healthRoutes);
app.use("/engine", engineRoutes);
app.use("/activities", activitiesRoutes);
app.use("/articles", articlesRoutes);
app.use("/analytics", analyticsRoutes);

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Presence Vision Engine Server",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      engineStart: "POST /engine/start",
      engineStop: "POST /engine/stop",
      engineRunCycle: "POST /engine/run-cycle",
      engineStatus: "GET /engine/status",
      articles: "GET /articles?projectId=xxx&language=ja&limit=20",
      articleBySlug: "GET /articles/:slug",
      analytics: "GET /analytics?projectId=xxx&days=30",
      activities: "GET /activities?projectId=xxx&limit=50",
      activitiesStats: "GET /activities/stats?projectId=xxx",
      activitiesStream: "GET /activities/stream?projectId=xxx (SSE)",
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
async function start() {
  // Initialize database (gracefully degrade to in-memory if unavailable)
  try {
    await initDB();
    setDBAvailable(true);
    console.log("[DB] PostgreSQL connected");

    // DB接続成功時、稼働中プロジェクトを復帰
    await restoreProjects();
  } catch (err) {
    console.warn("[DB] PostgreSQL unavailable, running in-memory only:", (err as Error).message);
    setDBAvailable(false);
  }

  app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log("  Presence Vision Engine Server");
    console.log("=".repeat(60));
    console.log(`  Port:          ${PORT}`);
    console.log(`  Frontend URL:  ${FRONTEND_URL}`);
    console.log(`  API Key:       ${ENGINE_API_KEY ? "configured" : "not set (open access)"}`);
    console.log(`  Ollama:        ${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}`);
    console.log(`  Model:         ${process.env.OLLAMA_MODEL ?? "llama3.1"}`);
    console.log("=".repeat(60));
  });
}

start().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Server] SIGINT received, shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
});

export default app;
