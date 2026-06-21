/**
 * Analytics Routes — SERP順位トレンド、LLM言及率、コンテンツ生成統計
 */

import { Router, type Request, type Response } from "express";
import { getDB } from "../db/index.js";

const router = Router();

// ─── 時系列サマリー（株価風ダッシュボード用）ヘルパー ──────────────────────

type Granularity = "day" | "month" | "year";

const GRAN: Record<Granularity, { unit: string; fmt: string }> = {
  day: { unit: "day", fmt: "YYYY-MM-DD" },
  month: { unit: "month", fmt: "YYYY-MM" },
  year: { unit: "year", fmt: "YYYY" },
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** UTCメソッドでJST壁時計の "YYYY-MM-DD" を返す（now を +9h シフト済みの Date に対して使う） */
function ymdUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** from..to（YYYY-MM-DD, JST暦）を粒度ごとに連続したバケットキー配列へ展開（穴埋め用） */
function genBucketKeys(from: string, to: string, g: Granularity): string[] {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const keys: string[] = [];
  if (g === "day") {
    let t = Date.UTC(fy, fm - 1, fd);
    const end = Date.UTC(ty, tm - 1, td);
    while (t <= end && keys.length < 1000) {
      const x = new Date(t);
      keys.push(`${x.getUTCFullYear()}-${pad2(x.getUTCMonth() + 1)}-${pad2(x.getUTCDate())}`);
      t += 86_400_000;
    }
  } else if (g === "month") {
    let y = fy;
    let m = fm;
    while ((y < ty || (y === ty && m <= tm)) && keys.length < 1000) {
      keys.push(`${y}-${pad2(m)}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  } else {
    for (let y = fy; y <= ty && keys.length < 1000; y += 1) keys.push(`${y}`);
  }
  return keys;
}

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

/**
 * GET /analytics/timeseries?projectId=xxx&granularity=day|month|year&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * 株価風ダッシュボード用の時系列サマリー。
 * 各バケット(日/月/年, JST暦)ごとに 記事公開数 / 露出先別配信数 / 平均SERP順位 / AI引用率 を返す。
 * 範囲外（穴）のバケットもゼロ埋めして連続したX軸を保証する。
 */
router.get("/timeseries", async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    if (!projectId) {
      res.status(400).json({ error: "Missing required query parameter: projectId" });
      return;
    }

    const granularity: Granularity = (["day", "month", "year"].includes(
      req.query.granularity as string,
    )
      ? req.query.granularity
      : "day") as Granularity;
    const g = GRAN[granularity];

    // 範囲（JST暦 YYYY-MM-DD）。未指定なら粒度に応じた既定ウィンドウ。
    const jstNow = new Date(Date.now() + 9 * 3_600_000); // UTCメソッドでJST壁時計
    let to = (req.query.to as string) || ymdUTC(jstNow);
    let from = req.query.from as string | undefined;
    if (!from) {
      const f = new Date(jstNow.getTime());
      if (granularity === "day") f.setUTCDate(f.getUTCDate() - 29);
      else if (granularity === "month") f.setUTCMonth(f.getUTCMonth() - 11);
      else f.setUTCFullYear(f.getUTCFullYear() - 4);
      from = ymdUTC(f);
    }
    // 簡易バリデーション（YYYY-MM-DD以外は既定に戻す）
    const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isYmd(to)) to = ymdUTC(jstNow);
    if (!from || !isYmd(from)) from = to;

    const db = getDB();
    const jst = (col: string) => `(${col} AT TIME ZONE 'Asia/Tokyo')`;
    const bucketExpr = (col: string) =>
      `to_char(date_trunc('${g.unit}', ${jst(col)}), '${g.fmt}')`;
    // $2=from, $3=to（to は当日も含めるため +1日 未満で判定）
    const rangeWhere = (col: string) =>
      `${jst(col)} >= $2::timestamp AND ${jst(col)} < ($3::date + 1)::timestamp`;

    // 1) 記事公開数（Hub = published_articles）
    const articlesQ = await db.query(
      `SELECT ${bucketExpr("published_at")} AS bucket, COUNT(*)::int AS n
       FROM published_articles
       WHERE project_id = $1 AND status = 'published' AND ${rangeWhere("published_at")}
       GROUP BY 1`,
      [projectId, from, to],
    );

    // 2) 露出先別の配信数（content_distribution を method 別に集計）
    const distQ = await db.query(
      `SELECT ${bucketExpr("started_at")} AS bucket, method, COUNT(*)::int AS n
       FROM activities
       WHERE project_id = $1 AND type = 'content_distribution' AND status = 'completed'
         AND ${rangeWhere("started_at")}
       GROUP BY 1, 2`,
      [projectId, from, to],
    );

    // 3) 平均SERP順位（順位が付いた serp_check のみ）
    const serpQ = await db.query(
      `SELECT ${bucketExpr("started_at")} AS bucket,
              AVG((metrics->>'position')::float) AS avg_pos, COUNT(*)::int AS n
       FROM activities
       WHERE project_id = $1 AND type = 'serp_check' AND status = 'completed'
         AND metrics->>'position' IS NOT NULL AND (metrics->>'position')::int > 0
         AND ${rangeWhere("started_at")}
       GROUP BY 1`,
      [projectId, from, to],
    );

    // 4) AI引用率（llm_check の mentioned/total）
    const llmQ = await db.query(
      `SELECT ${bucketExpr("started_at")} AS bucket,
              COUNT(*) FILTER (WHERE (metrics->>'mentioned')::int > 0)::int AS mentioned,
              COUNT(*)::int AS total
       FROM activities
       WHERE project_id = $1 AND type = 'llm_check' AND status = 'completed'
         AND metrics->>'mentioned' IS NOT NULL
         AND ${rangeWhere("started_at")}
       GROUP BY 1`,
      [projectId, from, to],
    );

    const methodToChannel: Record<string, "wordpress" | "gbp" | "community"> = {
      WordPress: "wordpress",
      GoogleBusiness: "gbp",
      BlogDistribution: "community",
    };

    const articlesMap = new Map<string, number>();
    for (const r of articlesQ.rows) articlesMap.set(r.bucket as string, r.n as number);

    const distMap = new Map<
      string,
      { wordpress: number; gbp: number; community: number; total: number }
    >();
    for (const r of distQ.rows) {
      const ch = methodToChannel[r.method as string];
      if (!ch) continue;
      const e = distMap.get(r.bucket as string) ?? {
        wordpress: 0,
        gbp: 0,
        community: 0,
        total: 0,
      };
      e[ch] += r.n as number;
      e.total += r.n as number;
      distMap.set(r.bucket as string, e);
    }

    const serpMap = new Map<string, { avg: number | null; count: number }>();
    for (const r of serpQ.rows) {
      serpMap.set(r.bucket as string, {
        avg: r.avg_pos != null ? Math.round((r.avg_pos as number) * 10) / 10 : null,
        count: r.n as number,
      });
    }

    const llmMap = new Map<string, { rate: number | null; mentioned: number; total: number }>();
    for (const r of llmQ.rows) {
      const total = r.total as number;
      const mentioned = r.mentioned as number;
      llmMap.set(r.bucket as string, {
        rate: total > 0 ? Math.round((mentioned / total) * 100) : null,
        mentioned,
        total,
      });
    }

    const keys = genBucketKeys(from, to, granularity);
    const buckets = keys.map((key) => ({
      key,
      articles: articlesMap.get(key) ?? 0,
      dist: distMap.get(key) ?? { wordpress: 0, gbp: 0, community: 0, total: 0 },
      serp: serpMap.get(key) ?? { avg: null as number | null, count: 0 },
      llm: llmMap.get(key) ?? { rate: null as number | null, mentioned: 0, total: 0 },
    }));

    // 期間サマリー
    const acc = buckets.reduce(
      (a, b) => {
        a.articles += b.articles;
        a.dist.wordpress += b.dist.wordpress;
        a.dist.gbp += b.dist.gbp;
        a.dist.community += b.dist.community;
        a.dist.total += b.dist.total;
        if (b.serp.avg != null) {
          a.serpSum += b.serp.avg * b.serp.count;
          a.serpCount += b.serp.count;
        }
        a.llmMentioned += b.llm.mentioned;
        a.llmTotal += b.llm.total;
        return a;
      },
      {
        articles: 0,
        dist: { wordpress: 0, gbp: 0, community: 0, total: 0 },
        serpSum: 0,
        serpCount: 0,
        llmMentioned: 0,
        llmTotal: 0,
      },
    );

    res.json({
      projectId,
      granularity,
      from,
      to,
      buckets,
      summary: {
        articles: acc.articles,
        dist: acc.dist,
        serp: {
          avg: acc.serpCount > 0 ? Math.round((acc.serpSum / acc.serpCount) * 10) / 10 : null,
          count: acc.serpCount,
        },
        llm: {
          rate: acc.llmTotal > 0 ? Math.round((acc.llmMentioned / acc.llmTotal) * 100) : null,
          mentioned: acc.llmMentioned,
          total: acc.llmTotal,
        },
      },
    });
  } catch (error) {
    console.error("[Route] /analytics/timeseries error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
