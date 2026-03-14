/**
 * Health Check Route — サーバー状態とOllama接続確認
 */

import { Router, type Request, type Response } from "express";
import { getActiveProjects } from "../engine/presence-engine.js";

const router = Router();

const startTime = Date.now();

/**
 * GET /health — ヘルスチェック
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    let ollamaStatus: "connected" | "disconnected" | "error" = "disconnected";
    let ollamaVersion: string | undefined;

    // Check Ollama connectivity
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${ollamaBaseUrl}/api/version`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as { version?: string };
        ollamaStatus = "connected";
        ollamaVersion = data.version;
      } else {
        ollamaStatus = "error";
      }
    } catch {
      ollamaStatus = "disconnected";
    }

    const activeProjects = getActiveProjects();
    const uptimeMs = Date.now() - startTime;

    res.json({
      status: "ok",
      uptime: uptimeMs,
      uptimeFormatted: formatUptime(uptimeMs),
      activeProjects: activeProjects.length,
      ollamaStatus,
      ollamaVersion,
      ollamaBaseUrl,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Route] /health error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default router;
