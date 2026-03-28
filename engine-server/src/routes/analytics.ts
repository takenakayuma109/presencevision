/**
 * Analytics Routes — SERP順位トレンド、LLM言及率、コンテンツ生成統計
 */

import { Router, type Request, type Response } from "express";
import { getDB } from "../db/index.js";

const router = Router();

/**
 * GET /analytics?projectId=xxx&days=30 — アナリティクスデータ
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { projectId, days } = req.query;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    const dayCount = days ? parseInt(days as string, 10) : 30;
    const db = getDB();

    // 1) SERP position trend over time (per keyword, grouped by date)
    const serpTrend = await db.query(
      `SELECT
         DATE(started_at) AS date,
         description,
         (metrics->>'position')::int AS position
       FROM activities
       WHERE project_id = $1
         AND type = 'serp_check'
         AND status = 'completed'
         AND metrics->>'position' IS NOT NULL
         AND (metrics->>'position')::int > 0
         AND started_at >= NOW() - INTERVAL '1 day' * $2
       ORDER BY date ASC`,
      [projectId, dayCount],
    );

    // Parse keyword from description: SERP順位チェック: "keyword" (country)
    const serpByKeyword: Record<string, { date: string; position: number }[]> = {};
    for (const row of serpTrend.rows) {
      const match = (row.description as string).match(/"([^"]+)"/);
      const keyword = match ? match[1] : "unknown";
      if (!serpByKeyword[keyword]) serpByKeyword[keyword] = [];
      serpByKeyword[keyword].push({
        date: (row.date as Date).toISOString().split("T")[0],
        position: row.position as number,
      });
    }

    // 2) LLM mention rate over time (per platform, grouped by date)
    const llmTrend = await db.query(
      `SELECT
         DATE(started_at) AS date,
         description,
         (metrics->>'mentioned')::int AS mentioned,
         (metrics->>'mentionCount')::int AS mention_count
       FROM activities
       WHERE project_id = $1
         AND type = 'llm_check'
         AND status = 'completed'
         AND metrics->>'mentioned' IS NOT NULL
         AND started_at >= NOW() - INTERVAL '1 day' * $2
       ORDER BY date ASC`,
      [projectId, dayCount],
    );

    // Parse platform from description: LLM言及チェック: "query" on platform (country)
    const llmByPlatform: Record<string, { date: string; mentioned: number; total: number; mentionCount: number }[]> = {};
    const llmDayPlatform: Record<string, { mentioned: number; total: number; mentionCount: number }> = {};

    for (const row of llmTrend.rows) {
      const match = (row.description as string).match(/on\s+(\S+)\s+\(/);
      const platform = match ? match[1] : "unknown";
      const date = (row.date as Date).toISOString().split("T")[0];
      const key = `${platform}::${date}`;

      if (!llmDayPlatform[key]) {
        llmDayPlatform[key] = { mentioned: 0, total: 0, mentionCount: 0 };
      }
      llmDayPlatform[key].total += 1;
      llmDayPlatform[key].mentioned += (row.mentioned as number) > 0 ? 1 : 0;
      llmDayPlatform[key].mentionCount += (row.mention_count as number) ?? 0;
    }

    for (const [key, data] of Object.entries(llmDayPlatform)) {
      const [platform, date] = key.split("::");
      if (!llmByPlatform[platform]) llmByPlatform[platform] = [];
      llmByPlatform[platform].push({ date, ...data });
    }

    // 3) Content generation count over time
    const contentTrend = await db.query(
      `SELECT
         DATE(started_at) AS date,
         COUNT(*) AS count,
         SUM(COALESCE((metrics->>'wordCount')::int, 0)) AS total_words
       FROM activities
       WHERE project_id = $1
         AND type = 'content_generation'
         AND status = 'completed'
         AND started_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [projectId, dayCount],
    );

    const contentData = contentTrend.rows.map((row) => ({
      date: (row.date as Date).toISOString().split("T")[0],
      count: parseInt(row.count as string, 10),
      totalWords: parseInt(row.total_words as string, 10),
    }));

    // 4) Summary statistics
    const summaryResult = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE type = 'content_generation' AND status = 'completed') AS articles_generated,
         AVG((metrics->>'position')::float) FILTER (
           WHERE type = 'serp_check' AND status = 'completed'
             AND metrics->>'position' IS NOT NULL
             AND (metrics->>'position')::int > 0
         ) AS avg_position,
         COUNT(*) FILTER (
           WHERE type = 'llm_check' AND status = 'completed'
             AND metrics->>'mentioned' IS NOT NULL
             AND (metrics->>'mentioned')::int > 0
         ) AS llm_mentioned_count,
         COUNT(*) FILTER (
           WHERE type = 'llm_check' AND status = 'completed'
             AND metrics->>'mentioned' IS NOT NULL
         ) AS llm_total_checks,
         COUNT(DISTINCT method) FILTER (WHERE status = 'completed') AS active_channels
       FROM activities
       WHERE project_id = $1
         AND started_at >= NOW() - INTERVAL '1 day' * $2`,
      [projectId, dayCount],
    );

    const summary = summaryResult.rows[0];
    const llmTotalChecks = parseInt(summary.llm_total_checks as string, 10) || 0;
    const llmMentionedCount = parseInt(summary.llm_mentioned_count as string, 10) || 0;

    res.json({
      projectId,
      days: dayCount,
      summary: {
        articlesGenerated: parseInt(summary.articles_generated as string, 10) || 0,
        avgPosition: summary.avg_position ? Math.round((summary.avg_position as number) * 10) / 10 : null,
        llmMentionRate: llmTotalChecks > 0 ? Math.round((llmMentionedCount / llmTotalChecks) * 100) : null,
        llmMentionedCount,
        llmTotalChecks,
        activeChannels: parseInt(summary.active_channels as string, 10) || 0,
      },
      serpTrend: serpByKeyword,
      llmTrend: llmByPlatform,
      contentTrend: contentData,
    });
  } catch (error) {
    console.error("[Route] /analytics error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
