/**
 * LLM Checker — ChatGPT/Perplexity等でのブランド言及状況を確認
 *
 * 「〇〇について教えて」等のプロンプトを各LLMに投げて、
 * ターゲットブランド/URLが言及されるかを確認。
 * GEO（Generative Engine Optimization）の効果測定。
 */

import type { Page } from "playwright";
import { getBrowserPool } from "../browser-pool";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger";

export interface LlmCheckResult {
  query: string;
  platform: string;
  country: string;
  language: string;
  targetBrand: string;
  mentioned: boolean;
  mentionCount: number;
  responseText: string;
  citedUrls: string[];
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  checkedAt: Date;
}

// Perplexity（ログイン不要で使える）
async function checkPerplexity(
  page: Page,
  query: string,
  targetBrand: string,
): Promise<Partial<LlmCheckResult>> {
  await page.goto("https://www.perplexity.ai/", { waitUntil: "networkidle", timeout: 30000 });

  // 検索ボックスに入力
  const searchInput = page.locator('textarea, input[placeholder*="Ask"]').first();
  await searchInput.waitFor({ timeout: 10000 });
  await searchInput.fill(query);
  await searchInput.press("Enter");

  // 回答を待つ
  await page.waitForTimeout(15000); // LLMの回答生成を待つ

  // 回答テキストを取得
  const responseText = await page.evaluate(() => {
    // Perplexityの回答エリアからテキスト取得
    const answerEl = document.querySelector('[class*="prose"], [class*="answer"], .markdown');
    return (answerEl?.textContent ?? document.body.innerText).trim();
  });

  // 引用URLを取得
  const citedUrls = await page.evaluate(() => {
    const urls: string[] = [];
    document.querySelectorAll('a[href^="http"]').forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (href && !href.includes("perplexity.ai")) {
        urls.push(href);
      }
    });
    return [...new Set(urls)];
  });

  const brandLower = targetBrand.toLowerCase();
  const responseLower = responseText.toLowerCase();
  const mentioned = responseLower.includes(brandLower);
  const mentionCount = responseLower.split(brandLower).length - 1;

  return {
    platform: "perplexity",
    responseText: responseText.slice(0, 5000),
    citedUrls,
    mentioned,
    mentionCount,
    sentiment: mentioned ? "neutral" : "unknown",
  };
}

// Google AI Overview（SGE）
async function checkGoogleAI(
  page: Page,
  query: string,
  targetBrand: string,
  country: string,
  language: string,
): Promise<Partial<LlmCheckResult>> {
  const googleDomains: Record<string, string> = {
    JP: "google.co.jp", US: "google.com", GB: "google.co.uk",
  };
  const domain = googleDomains[country] ?? "google.com";

  await page.goto(
    `https://www.${domain}/search?q=${encodeURIComponent(query)}&hl=${language}`,
    { waitUntil: "networkidle", timeout: 30000 },
  );

  // Cookie同意
  try {
    const btn = page.locator('#L2AGLb, button:has-text("Accept"), button:has-text("同意")');
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
  } catch { /* */ }

  await page.waitForTimeout(3000);

  // AI Overview セクションを探す
  const aiOverview = await page.evaluate((brand: string) => {
    const aiEl = document.querySelector(
      '[data-attrid*="ai"], [class*="ai-overview"], #kp-wp-tab-overview, .wDYxhc',
    );

    const text = (aiEl?.textContent ?? "").trim();
    const brandLower = brand.toLowerCase();
    const mentioned = text.toLowerCase().includes(brandLower);

    return {
      hasAiOverview: !!aiEl && text.length > 0,
      responseText: text.slice(0, 3000),
      mentioned,
      mentionCount: text.toLowerCase().split(brandLower).length - 1,
    };
  }, targetBrand);

  return {
    platform: "google-ai-overview",
    responseText: aiOverview.responseText,
    citedUrls: [],
    mentioned: aiOverview.mentioned,
    mentionCount: aiOverview.mentionCount,
    sentiment: aiOverview.mentioned ? "neutral" : "unknown",
  };
}

export type LlmPlatform = "perplexity" | "google-ai-overview";

export async function checkLlm(params: {
  projectId: string;
  taskId: string;
  query: string;
  targetBrand: string;
  platform: LlmPlatform;
  country: string;
  language: string;
}): Promise<LlmCheckResult> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "llm_check",
    country: params.country,
    language: params.language,
    method: "GEO",
    description: `LLM言及チェック: "${params.query}" on ${params.platform} (${params.country})`,
  });

  const pool = getBrowserPool();

  try {
    const result = await pool.withPage(
      async (page) => {
        let data: Partial<LlmCheckResult>;

        switch (params.platform) {
          case "perplexity":
            data = await checkPerplexity(page, params.query, params.targetBrand);
            break;
          case "google-ai-overview":
            data = await checkGoogleAI(page, params.query, params.targetBrand, params.country, params.language);
            break;
          default:
            throw new Error(`Unknown platform: ${params.platform}`);
        }

        // スクリーンショット
        const screenshot = await page.screenshot({ fullPage: false, type: "png" });
        addArtifact(activity.id, {
          type: "screenshot",
          title: `LLM: ${params.platform} "${params.query}" (${params.country})`,
          content: screenshot.toString("base64"),
          mimeType: "image/png",
        });

        return {
          query: params.query,
          platform: params.platform,
          country: params.country,
          language: params.language,
          targetBrand: params.targetBrand,
          mentioned: data.mentioned ?? false,
          mentionCount: data.mentionCount ?? 0,
          responseText: data.responseText ?? "",
          citedUrls: data.citedUrls ?? [],
          sentiment: data.sentiment ?? "unknown",
          checkedAt: new Date(),
        };
      },
      { country: params.country, locale: params.language },
    );

    addArtifact(activity.id, {
      type: "json",
      title: "LLMチェック結果",
      content: JSON.stringify({ ...result, responseText: result.responseText.slice(0, 500) }, null, 2),
    });

    completeActivity(activity.id, {
      metrics: {
        mentioned: result.mentioned ? 1 : 0,
        mentionCount: result.mentionCount,
        citedUrlCount: result.citedUrls.length,
      },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
