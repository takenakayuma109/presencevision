/**
 * SERP Checker — 検索エンジンでのランキングを定点観測
 *
 * 対象キーワードでGoogle検索し、ターゲットサイトの順位を記録。
 * 国・言語ごとにブラウザコンテキストを切り替えて実行。
 */

import type { Page } from "playwright";
import { getBrowserPool } from "../browser-pool.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

export interface SerpResult {
  keyword: string;
  country: string;
  language: string;
  targetUrl: string;
  position: number | null; // null = 100位圏外
  totalResults: string;
  topResults: { position: number; title: string; url: string; snippet: string }[];
  featuredSnippet?: { title: string; content: string };
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  checkedAt: Date;
}

async function extractSerpData(page: Page, targetDomain: string): Promise<Partial<SerpResult>> {
  return page.evaluate('(domain) => {\
    var results = [];\
    var position = null;\
    var searchResults = document.querySelectorAll("#search .g, #rso .g");\
    var pos = 0;\
    searchResults.forEach(function(el) {\
      var linkEl = el.querySelector("a[href]");\
      var titleEl = el.querySelector("h3");\
      var snippetEl = el.querySelector(\'[data-sncf], .VwiC3b, [style="-webkit-line-clamp:2"]\');\
      if (!linkEl || !titleEl) return;\
      var url = linkEl.getAttribute("href") || "";\
      if (!url.startsWith("http")) return;\
      pos++;\
      var entry = {\
        position: pos,\
        title: (titleEl.textContent || "").trim(),\
        url: url,\
        snippet: (snippetEl && snippetEl.textContent || "").trim(),\
      };\
      results.push(entry);\
      try {\
        if (new URL(url).hostname.includes(domain)) {\
          position = pos;\
        }\
      } catch(e) { /* invalid url */ }\
    });\
    var featuredSnippet = undefined;\
    var featured = document.querySelector("[data-attrid=\'wa:/description\'], .IZ6rdc, .hgKElc");\
    if (featured) {\
      featuredSnippet = {\
        title: ((document.querySelector(".yuRUbf h3, .LC20lb") || {}).textContent || "").trim(),\
        content: (featured.textContent || "").trim(),\
      };\
    }\
    var peopleAlsoAsk = [];\
    document.querySelectorAll("[data-q], .related-question-pair").forEach(function(el) {\
      var q = el.getAttribute("data-q") || (el.textContent || "").trim();\
      if (q) peopleAlsoAsk.push(q);\
    });\
    var relatedSearches = [];\
    document.querySelectorAll("#botstuff a, .k8XOCe").forEach(function(el) {\
      var text = (el.textContent || "").trim();\
      if (text) relatedSearches.push(text);\
    });\
    var totalResults = ((document.querySelector("#result-stats") || {}).textContent || "").trim();\
    return {\
      position: position,\
      totalResults: totalResults,\
      topResults: results.slice(0, 20),\
      featuredSnippet: featuredSnippet,\
      peopleAlsoAsk: peopleAlsoAsk.slice(0, 10),\
      relatedSearches: relatedSearches.slice(0, 10),\
    };\
  }', targetDomain) as Promise<Partial<SerpResult>>;
}

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

export async function checkSerp(params: {
  projectId: string;
  taskId: string;
  keyword: string;
  targetUrl: string;
  country: string;
  language: string;
}): Promise<SerpResult> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "serp_check",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `SERP順位チェック: "${params.keyword}" (${params.country})`,
  });

  const pool = getBrowserPool();
  const targetDomain = new URL(params.targetUrl).hostname;
  const googleDomain = getGoogleDomain(params.country);

  try {
    const result = await pool.withPage(
      async (page) => {
        // Google検索
        const searchUrl = `https://www.${googleDomain}/search?q=${encodeURIComponent(params.keyword)}&hl=${params.language}&gl=${params.country.toLowerCase()}&num=20`;
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(2000);

        // Cookie同意ダイアログ処理
        try {
          const consentBtn = page.locator('button:has-text("Accept"), button:has-text("同意"), #L2AGLb');
          if (await consentBtn.isVisible({ timeout: 2000 })) {
            await consentBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch { /* no consent dialog */ }

        const serpData = await extractSerpData(page, targetDomain) || {};

        // スクリーンショット
        const screenshot = await page.screenshot({ fullPage: false, type: "png" });
        addArtifact(activity.id, {
          type: "screenshot",
          title: `SERP: "${params.keyword}" (${params.country})`,
          content: screenshot.toString("base64"),
          mimeType: "image/png",
        });

        return {
          keyword: params.keyword,
          country: params.country,
          language: params.language,
          targetUrl: params.targetUrl,
          position: serpData.position ?? null,
          totalResults: serpData.totalResults ?? "",
          topResults: serpData.topResults ?? [],
          featuredSnippet: serpData.featuredSnippet,
          peopleAlsoAsk: serpData.peopleAlsoAsk ?? [],
          relatedSearches: serpData.relatedSearches ?? [],
          checkedAt: new Date(),
        };
      },
      { country: params.country, locale: params.language },
    );

    addArtifact(activity.id, {
      type: "json",
      title: "SERP結果データ",
      content: JSON.stringify(result, null, 2),
    });

    completeActivity(activity.id, {
      metrics: {
        position: result.position ?? -1,
        topResultsCount: result.topResults.length,
        paaCount: result.peopleAlsoAsk.length,
      },
      details: {
        hasFeaturedSnippet: !!result.featuredSnippet,
        position: result.position,
      },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
