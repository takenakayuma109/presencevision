/**
 * Ranking Monitor — 公開コンテンツの検索順位を定期追跡
 *
 * SERP Checkerのロジックを再利用し、順位の経時変化を記録。
 * 前回チェックとの差分(delta)を算出して改善/悪化を可視化。
 */

import type { Page } from "playwright";
import { getBrowserPool } from "../browser-pool.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RankingRecord {
  keyword: string;
  country: string;
  language: string;
  position: number | null; // null = not in top 100
  previousPosition: number | null;
  delta: number; // positive = improved
  url: string; // the published content URL
  checkedAt: Date;
  featuredSnippet: boolean;
}

export interface RankingMonitorParams {
  projectId: string;
  taskId: string;
  publishedContent: { keyword: string; url: string; language: string }[];
  targetUrl: string; // main site URL
  country: string;
  language: string;
}

// ---------------------------------------------------------------------------
// In-memory ranking history store
// ---------------------------------------------------------------------------

// key = `${keyword}::${country}::${language}`
const rankingHistory = new Map<string, RankingRecord[]>();

function historyKey(keyword: string, country: string, language: string): string {
  return `${keyword}::${country}::${language}`;
}

function getLastPosition(keyword: string, country: string, language: string): number | null {
  const key = historyKey(keyword, country, language);
  const history = rankingHistory.get(key);
  if (!history || history.length === 0) return null;
  return history[history.length - 1].position;
}

function storeRecord(record: RankingRecord): void {
  const key = historyKey(record.keyword, record.country, record.language);
  const history = rankingHistory.get(key) ?? [];
  history.push(record);
  // Keep last 100 records per keyword
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  rankingHistory.set(key, history);
}

export function getRankingHistory(keyword: string, country: string, language: string): RankingRecord[] {
  const key = historyKey(keyword, country, language);
  return rankingHistory.get(key) ?? [];
}

// ---------------------------------------------------------------------------
// Google domain helper (same as serp-checker)
// ---------------------------------------------------------------------------

function getGoogleDomain(country: string): string {
  const domains: Record<string, string> = {
    JP: "google.co.jp",
    US: "google.com",
    GB: "google.co.uk",
    DE: "google.de",
    FR: "google.fr",
    KR: "google.co.kr",
    BR: "google.com.br",
    IN: "google.co.in",
    AU: "google.com.au",
    CA: "google.ca",
    ES: "google.es",
    IT: "google.it",
    NL: "google.nl",
    SE: "google.se",
    SG: "google.com.sg",
    ID: "google.co.id",
    TH: "google.co.th",
    VN: "google.com.vn",
    TW: "google.com.tw",
  };
  return domains[country] ?? "google.com";
}

// ---------------------------------------------------------------------------
// SERP position extraction (reuses serp-checker pattern)
// ---------------------------------------------------------------------------

async function extractPosition(
  page: Page,
  targetDomain: string,
): Promise<{ position: number | null; featuredSnippet: boolean }> {
  return page.evaluate('(domain) => {\
    var position = null;\
    var searchResults = document.querySelectorAll("#search .g, #rso .g");\
    var pos = 0;\
    searchResults.forEach(function(el) {\
      var linkEl = el.querySelector("a[href]");\
      var titleEl = el.querySelector("h3");\
      if (!linkEl || !titleEl) return;\
      var url = linkEl.getAttribute("href") || "";\
      if (!url.startsWith("http")) return;\
      pos++;\
      try {\
        if (new URL(url).hostname.includes(domain)) {\
          if (position === null) position = pos;\
        }\
      } catch(e) { /* invalid url */ }\
    });\
    var hasFeaturedSnippet = false;\
    var featured = document.querySelector("[data-attrid=\'wa:/description\'], .IZ6rdc, .hgKElc");\
    if (featured) {\
      var featuredLink = document.querySelector(".yuRUbf a[href]");\
      if (featuredLink) {\
        try {\
          if (new URL(featuredLink.getAttribute("href") || "").hostname.includes(domain)) {\
            hasFeaturedSnippet = true;\
          }\
        } catch(e) { /* invalid url */ }\
      }\
    }\
    return { position: position, featuredSnippet: hasFeaturedSnippet };\
  }', targetDomain) as Promise<{ position: number | null; featuredSnippet: boolean }>;
}

// ---------------------------------------------------------------------------
// Main: monitorRankings
// ---------------------------------------------------------------------------

export async function monitorRankings(params: RankingMonitorParams): Promise<RankingRecord[]> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "ranking_monitor",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `順位モニタリング: ${params.publishedContent.length}件 (${params.country})`,
  });

  const pool = getBrowserPool();
  const targetDomain = new URL(params.targetUrl).hostname;
  const googleDomain = getGoogleDomain(params.country);
  const records: RankingRecord[] = [];

  try {
    for (const item of params.publishedContent) {
      const previousPosition = getLastPosition(item.keyword, params.country, item.language);

      const result = await pool.withPage(
        async (page) => {
          const searchUrl = `https://www.${googleDomain}/search?q=${encodeURIComponent(item.keyword)}&hl=${item.language}&gl=${params.country.toLowerCase()}&num=100`;
          await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(2000);

          // Cookie consent handling
          try {
            const consentBtn = page.locator('button:has-text("Accept"), button:has-text("同意"), #L2AGLb');
            if (await consentBtn.isVisible({ timeout: 2000 })) {
              await consentBtn.click();
              await page.waitForTimeout(1000);
            }
          } catch { /* no consent dialog */ }

          return extractPosition(page, targetDomain);
        },
        { country: params.country, locale: item.language },
      );

      // Calculate delta: positive = improved (moved up)
      let delta = 0;
      if (result.position !== null && previousPosition !== null) {
        delta = previousPosition - result.position; // e.g. was 10, now 5 → delta = +5
      } else if (result.position !== null && previousPosition === null) {
        delta = 100 - result.position; // entered top 100
      } else if (result.position === null && previousPosition !== null) {
        delta = -(100 - previousPosition); // dropped out of top 100
      }

      const record: RankingRecord = {
        keyword: item.keyword,
        country: params.country,
        language: item.language,
        position: result.position,
        previousPosition,
        delta,
        url: item.url,
        checkedAt: new Date(),
        featuredSnippet: result.featuredSnippet,
      };

      storeRecord(record);
      records.push(record);

      // Brief pause between queries to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Build ranking report
    const reportLines = records.map((r) => {
      const pos = r.position !== null ? `#${r.position}` : "圏外";
      const prev = r.previousPosition !== null ? `#${r.previousPosition}` : "N/A";
      const deltaStr = r.delta > 0 ? `+${r.delta}` : `${r.delta}`;
      const snippet = r.featuredSnippet ? " [Featured Snippet]" : "";
      return `${r.keyword}: ${pos} (前回: ${prev}, 変動: ${deltaStr})${snippet}`;
    });

    addArtifact(activity.id, {
      type: "text",
      title: `順位レポート (${params.country})`,
      content: reportLines.join("\n"),
    });

    addArtifact(activity.id, {
      type: "json",
      title: "順位データ (JSON)",
      content: JSON.stringify(records, null, 2),
    });

    const improved = records.filter((r) => r.delta > 0).length;
    const declined = records.filter((r) => r.delta < 0).length;
    const featured = records.filter((r) => r.featuredSnippet).length;

    completeActivity(activity.id, {
      metrics: {
        totalKeywords: records.length,
        improved,
        declined,
        featuredSnippets: featured,
      },
      details: {
        improved,
        declined,
        unchanged: records.length - improved - declined,
        featuredSnippets: featured,
      },
    });

    return records;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
