/**
 * Site Analyzer — ターゲットサイトのSEO状態を分析
 *
 * Playwrightでサイトをクロールし、以下を抽出:
 * - メタタグ（title, description, keywords, og:*）
 * - Schema.org構造化データ
 * - H1-H6構造
 * - 内部/外部リンク
 * - ページ速度指標
 * - robots.txt / sitemap.xml
 */

import type { Page } from "playwright";
import { getBrowserPool } from "../browser-pool";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger";

export interface SiteAnalysisResult {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string[];
  ogTags: Record<string, string>;
  headings: { level: number; text: string }[];
  schemaOrg: Record<string, unknown>[];
  internalLinks: number;
  externalLinks: number;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  loadTimeMs: number;
  issues: string[];
  score: number;
}

async function extractPageData(page: Page): Promise<Partial<SiteAnalysisResult>> {
  return page.evaluate(() => {
    const getMeta = (name: string): string =>
      document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
        ?.getAttribute("content") ?? "";

    // メタタグ
    const title = document.title;
    const metaDescription = getMeta("description");
    const metaKeywords = getMeta("keywords")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    // OGタグ
    const ogTags: Record<string, string> = {};
    document.querySelectorAll('meta[property^="og:"]').forEach((el) => {
      const prop = el.getAttribute("property") ?? "";
      ogTags[prop] = el.getAttribute("content") ?? "";
    });

    // 見出し構造
    const headings: { level: number; text: string }[] = [];
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
      headings.push({
        level: parseInt(el.tagName.charAt(1)),
        text: (el.textContent ?? "").trim().slice(0, 100),
      });
    });

    // Schema.org
    const schemaOrg: Record<string, unknown>[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        schemaOrg.push(JSON.parse(el.textContent ?? "{}"));
      } catch {
        // invalid JSON
      }
    });

    // リンク
    const links = Array.from(document.querySelectorAll("a[href]"));
    const currentHost = window.location.hostname;
    let internalLinks = 0;
    let externalLinks = 0;
    links.forEach((a) => {
      try {
        const url = new URL(a.getAttribute("href") ?? "", window.location.href);
        if (url.hostname === currentHost) internalLinks++;
        else externalLinks++;
      } catch {
        // invalid URL
      }
    });

    return {
      title,
      metaDescription,
      metaKeywords,
      ogTags,
      headings,
      schemaOrg,
      internalLinks,
      externalLinks,
    };
  });
}

function scoreSEO(data: Partial<SiteAnalysisResult>): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  if (!data.title) { issues.push("titleタグが未設定"); score -= 15; }
  else if (data.title.length < 20 || data.title.length > 70) {
    issues.push(`titleの長さが不適切 (${data.title.length}文字, 推奨: 20-70)`);
    score -= 5;
  }

  if (!data.metaDescription) { issues.push("meta descriptionが未設定"); score -= 15; }
  else if (data.metaDescription.length < 50 || data.metaDescription.length > 160) {
    issues.push(`meta descriptionの長さが不適切 (${data.metaDescription.length}文字, 推奨: 50-160)`);
    score -= 5;
  }

  if (!data.headings?.some((h) => h.level === 1)) {
    issues.push("H1タグが未設定");
    score -= 10;
  }

  const h1Count = data.headings?.filter((h) => h.level === 1).length ?? 0;
  if (h1Count > 1) {
    issues.push(`H1タグが${h1Count}個あります（1個推奨）`);
    score -= 5;
  }

  if (!data.schemaOrg?.length) {
    issues.push("Schema.org構造化データが未設定");
    score -= 15;
  }

  if (!data.ogTags || Object.keys(data.ogTags).length === 0) {
    issues.push("OGタグが未設定");
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

export async function analyzeSite(params: {
  projectId: string;
  taskId: string;
  url: string;
  country: string;
  language: string;
}): Promise<SiteAnalysisResult> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "site_analysis",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `サイト分析: ${params.url}`,
  });

  const pool = getBrowserPool();

  try {
    const result = await pool.withPage(
      async (page) => {
        const startTime = Date.now();
        await page.goto(params.url, { waitUntil: "networkidle", timeout: 30000 });
        const loadTimeMs = Date.now() - startTime;

        const pageData = await extractPageData(page);

        // robots.txt チェック
        let hasRobotsTxt = false;
        try {
          const robotsUrl = new URL("/robots.txt", params.url).href;
          const res = await page.context().request.get(robotsUrl);
          hasRobotsTxt = res.ok();
        } catch { /* ignore */ }

        // sitemap.xml チェック
        let hasSitemap = false;
        try {
          const sitemapUrl = new URL("/sitemap.xml", params.url).href;
          const res = await page.context().request.get(sitemapUrl);
          hasSitemap = res.ok();
        } catch { /* ignore */ }

        if (!hasRobotsTxt) pageData.issues = [...(pageData.issues ?? [])];
        if (!hasSitemap) pageData.issues = [...(pageData.issues ?? [])];

        const { score, issues } = scoreSEO(pageData);

        // スクリーンショット
        const screenshot = await page.screenshot({ fullPage: false, type: "png" });
        addArtifact(activity.id, {
          type: "screenshot",
          title: `${params.url} スクリーンショット`,
          content: screenshot.toString("base64"),
          mimeType: "image/png",
        });

        return {
          url: params.url,
          title: pageData.title ?? "",
          metaDescription: pageData.metaDescription ?? "",
          metaKeywords: pageData.metaKeywords ?? [],
          ogTags: pageData.ogTags ?? {},
          headings: pageData.headings ?? [],
          schemaOrg: pageData.schemaOrg ?? [],
          internalLinks: pageData.internalLinks ?? 0,
          externalLinks: pageData.externalLinks ?? 0,
          hasRobotsTxt,
          hasSitemap,
          loadTimeMs,
          issues,
          score,
        };
      },
      { country: params.country, locale: params.language },
    );

    // 分析結果をアーティファクトとして記録
    addArtifact(activity.id, {
      type: "json",
      title: "SEO分析レポート",
      content: JSON.stringify(result, null, 2),
    });

    completeActivity(activity.id, {
      metrics: {
        seoScore: result.score,
        loadTimeMs: result.loadTimeMs,
        issueCount: result.issues.length,
        schemaCount: result.schemaOrg.length,
      },
      details: {
        hasRobotsTxt: result.hasRobotsTxt,
        hasSitemap: result.hasSitemap,
      },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
