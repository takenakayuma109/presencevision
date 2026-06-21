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
import { getDB } from "../db/index.js";

const router = Router();

/**
 * GET /activities/hourly?projectId=xxx&date=YYYY-MM-DD
 *
 * 「本日のスケジュール」用に、指定日(JST)の各時間(0-23)のタスク実行数を type 別に返す。
 * in-memory ログの上限に依存せず DB から集計するため、1日分すべての時間帯を正確に取得できる。
 */
router.get("/hourly", async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    if (!projectId) {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    // date は JST 暦の YYYY-MM-DD。未指定なら本日(JST)。
    const jstNow = new Date(Date.now() + 9 * 3_600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    let date = req.query.date as string | undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = `${jstNow.getUTCFullYear()}-${pad(jstNow.getUTCMonth() + 1)}-${pad(jstNow.getUTCDate())}`;
    }

    const db = getDB();
    const result = await db.query(
      `SELECT EXTRACT(HOUR FROM (started_at AT TIME ZONE 'Asia/Tokyo'))::int AS hour,
              type, COUNT(*)::int AS n
       FROM activities
       WHERE project_id = $1
         AND (started_at AT TIME ZONE 'Asia/Tokyo')::date = $2::date
       GROUP BY 1, 2`,
      [projectId, date],
    );

    // 0-23 をゼロ埋めして type 別内訳と合計を構築
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: 0,
      byType: {} as Record<string, number>,
    }));
    for (const row of result.rows) {
      const h = row.hour as number;
      if (h < 0 || h > 23) continue;
      hours[h].byType[row.type as string] = row.n as number;
      hours[h].total += row.n as number;
    }

    res.json({ projectId, date, hours });
  } catch (error) {
    console.error("[Route] /activities/hourly error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

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
