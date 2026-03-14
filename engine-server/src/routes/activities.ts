/**
 * Activity Routes — アクティビティの取得・統計・リアルタイムストリーム
 */

import { Router, type Request, type Response } from "express";
import {
  getActivities,
  getActivityStats,
  onActivity,
  type ActivityEntry,
} from "../engine/activity-logger.js";

const router = Router();

/**
 * GET /activities?projectId=xxx&limit=50 — アクティビティ一覧
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { projectId, limit, taskId, type, country, status } = req.query;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    const activities = await getActivities(projectId, {
      limit: limit ? parseInt(limit as string, 10) : 50,
      taskId: taskId as string | undefined,
      type: type as ActivityEntry["type"] | undefined,
      country: country as string | undefined,
      status: status as ActivityEntry["status"] | undefined,
    });

    res.json({
      projectId,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("[Route] /activities error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /activities/stats?projectId=xxx — アクティビティ統計
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    const stats = await getActivityStats(projectId);

    res.json({
      projectId,
      ...stats,
    });
  } catch (error) {
    console.error("[Route] /activities/stats error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /activities/stream?projectId=xxx — SSE リアルタイムストリーム
 */
router.get("/stream", (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    // SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ projectId, timestamp: new Date().toISOString() })}\n\n`);

    // Keep-alive heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Subscribe to activity updates for this project
    const unsubscribe = onActivity((entry: ActivityEntry) => {
      if (entry.projectId !== projectId) return;

      try {
        const eventData = JSON.stringify({
          id: entry.id,
          type: entry.type,
          status: entry.status,
          country: entry.country,
          language: entry.language,
          method: entry.method,
          description: entry.description,
          metrics: entry.metrics,
          error: entry.error,
          startedAt: entry.startedAt,
          completedAt: entry.completedAt,
          durationMs: entry.durationMs,
        });

        res.write(`event: activity\ndata: ${eventData}\n\n`);
      } catch {
        // Client disconnected — will be cleaned up below
      }
    });

    // Cleanup on client disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      console.log(`[SSE] Client disconnected from project ${projectId}`);
    });
  } catch (error) {
    console.error("[Route] /activities/stream error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
