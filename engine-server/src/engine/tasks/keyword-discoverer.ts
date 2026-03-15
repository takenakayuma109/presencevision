/**
 * Keyword Discoverer — シードキーワードからロングテールキーワードを自動発見
 *
 * 4つのソースを組み合わせて100+キーワードを収集:
 * 1. Google Autocomplete — 検索サジェスト
 * 2. People Also Ask — 関連質問
 * 3. Related Searches — 関連検索
 * 4. LLM Expansion — Ollamaでバリエーション生成
 *
 * 全てローカル実行。API課金ゼロ。
 */

import { getBrowserPool } from "../browser-pool.js";
import { getAIProvider } from "../../ai/provider.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredKeyword {
  keyword: string;
  source: "autocomplete" | "paa" | "related" | "llm_expansion";
  intent: "informational" | "commercial" | "navigational";
  language: string;
  country: string;
  parentKeyword: string;
}

export interface KeywordDiscoveryParams {
  projectId: string;
  taskId: string;
  seedKeywords: string[];
  brandName: string;
  country: string;
  language: string;
  maxKeywords?: number; // default 100
}

// ---------------------------------------------------------------------------
// Google domain mapping (reuse pattern from serp-checker)
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
// Intent classification heuristic
// ---------------------------------------------------------------------------

function classifyIntent(keyword: string): "informational" | "commercial" | "navigational" {
  const commercialPatterns = /\b(buy|price|cost|cheap|best|top|review|compare|vs|deal|discount|coupon|purchase|おすすめ|比較|価格|安い|レビュー|ランキング)\b/i;
  const navigationalPatterns = /\b(login|sign in|official|website|homepage|公式|ログイン|サイト)\b/i;

  if (navigationalPatterns.test(keyword)) return "navigational";
  if (commercialPatterns.test(keyword)) return "commercial";
  return "informational";
}

// ---------------------------------------------------------------------------
// 1. Google Autocomplete
// ---------------------------------------------------------------------------

async function fetchAutocomplete(
  seedKeyword: string,
  country: string,
  language: string,
): Promise<string[]> {
  const pool = getBrowserPool();
  const googleDomain = getGoogleDomain(country);

  try {
    return await pool.withPage(
      async (page) => {
        await page.goto(`https://www.${googleDomain}/?hl=${language}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Handle consent dialog
        try {
          const consentBtn = page.locator(
            'button:has-text("Accept"), button:has-text("同意"), #L2AGLb',
          );
          if (await consentBtn.isVisible({ timeout: 2000 })) {
            await consentBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch {
          /* no consent dialog */
        }

        // Type the seed keyword to trigger autocomplete
        const searchInput = page.locator('textarea[name="q"], input[name="q"]');
        await searchInput.click();
        await searchInput.fill(seedKeyword);
        await page.waitForTimeout(1500); // Wait for suggestions to appear

        // Extract autocomplete suggestions
        const suggestions = await page.evaluate(() => {
          const results: string[] = [];
          // Google autocomplete renders in various containers
          const selectors = [
            'ul[role="listbox"] li span',
            ".sbct .sbtc .sbl1",
            ".erkvQe li .wM6W7d span",
            '[role="option"] .wM6W7d span',
            ".OBMEnb li .wM6W7d span",
            ".lnnVSe span",
          ];
          for (const selector of selectors) {
            document.querySelectorAll(selector).forEach((el) => {
              const text = (el.textContent || "").trim();
              if (text && text.length > 2) results.push(text);
            });
            if (results.length > 0) break;
          }
          return results;
        });

        // Also try with suffixes for more variations
        const suffixes = [" ", " how", " what", " best", " vs"];
        for (const suffix of suffixes.slice(0, 2)) {
          await searchInput.fill(seedKeyword + suffix);
          await page.waitForTimeout(1000);

          const moreSuggestions = await page.evaluate(() => {
            const results: string[] = [];
            document
              .querySelectorAll(
                'ul[role="listbox"] li span, [role="option"] .wM6W7d span, .lnnVSe span',
              )
              .forEach((el) => {
                const text = (el.textContent || "").trim();
                if (text && text.length > 2) results.push(text);
              });
            return results;
          });
          suggestions.push(...moreSuggestions);
        }

        return [...new Set(suggestions)];
      },
      { country, locale: language },
    );
  } catch (error) {
    console.warn(
      `[KeywordDiscoverer] Autocomplete failed for "${seedKeyword}":`,
      error,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. People Also Ask + Related Searches (from SERP)
// ---------------------------------------------------------------------------

async function fetchSerpKeywords(
  seedKeyword: string,
  country: string,
  language: string,
): Promise<{ paa: string[]; related: string[] }> {
  const pool = getBrowserPool();
  const googleDomain = getGoogleDomain(country);

  try {
    return await pool.withPage(
      async (page) => {
        const searchUrl = `https://www.${googleDomain}/search?q=${encodeURIComponent(
          seedKeyword,
        )}&hl=${language}&gl=${country.toLowerCase()}&num=20`;
        await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });

        // Handle consent dialog
        try {
          const consentBtn = page.locator(
            'button:has-text("Accept"), button:has-text("同意"), #L2AGLb',
          );
          if (await consentBtn.isVisible({ timeout: 2000 })) {
            await consentBtn.click();
            await page.waitForTimeout(1000);
          }
        } catch {
          /* no consent dialog */
        }

        const data = await page.evaluate(() => {
          // People Also Ask
          const paa: string[] = [];
          document
            .querySelectorAll('[data-q], .related-question-pair')
            .forEach((el) => {
              const q =
                el.getAttribute("data-q") || (el.textContent || "").trim();
              if (q && q.length > 5) paa.push(q);
            });

          // Related Searches
          const related: string[] = [];
          document
            .querySelectorAll("#botstuff a, .k8XOCe, .s75CSd a")
            .forEach((el) => {
              const text = (el.textContent || "").trim();
              if (text && text.length > 2) related.push(text);
            });

          return { paa: paa.slice(0, 10), related: related.slice(0, 10) };
        });

        return data;
      },
      { country, locale: language },
    );
  } catch (error) {
    console.warn(
      `[KeywordDiscoverer] SERP extraction failed for "${seedKeyword}":`,
      error,
    );
    return { paa: [], related: [] };
  }
}

// ---------------------------------------------------------------------------
// 3. LLM Expansion via Ollama
// ---------------------------------------------------------------------------

async function expandWithLlm(
  seedKeyword: string,
  brandName: string,
  language: string,
  count: number,
): Promise<string[]> {
  try {
    const ai = getAIProvider();
    const response = await ai.complete(
      [
        {
          role: "user",
          content: `Given the seed keyword "${seedKeyword}" for a ${brandName} business, generate ${count} long-tail keyword variations in ${language}. These should be specific search queries that potential customers might use. Include a mix of informational, commercial, and question-based keywords.

Output one keyword per line. No numbering, no bullets, no explanation. Just the keywords.`,
        },
      ],
      { maxTokens: 2048, temperature: 0.8 },
    );

    return response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 2 && !line.startsWith("#") && !line.startsWith("-"));
  } catch (error) {
    console.warn(
      `[KeywordDiscoverer] LLM expansion failed for "${seedKeyword}":`,
      error,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main: discoverKeywords
// ---------------------------------------------------------------------------

export async function discoverKeywords(
  params: KeywordDiscoveryParams,
): Promise<DiscoveredKeyword[]> {
  const maxKeywords = params.maxKeywords ?? 100;

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "keyword_research",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `キーワード発見: ${params.seedKeywords.length}シードから最大${maxKeywords}件 (${params.country})`,
  });

  try {
    const allKeywords: DiscoveredKeyword[] = [];
    const seen = new Set<string>();

    const addKeyword = (
      keyword: string,
      source: DiscoveredKeyword["source"],
      parentKeyword: string,
    ) => {
      const normalized = keyword.toLowerCase().trim();
      if (seen.has(normalized) || normalized.length < 3) return;
      seen.add(normalized);

      allKeywords.push({
        keyword: keyword.trim(),
        source,
        intent: classifyIntent(keyword),
        language: params.language,
        country: params.country,
        parentKeyword,
      });
    };

    for (const seed of params.seedKeywords) {
      if (allKeywords.length >= maxKeywords) break;

      console.log(
        `[KeywordDiscoverer] Processing seed: "${seed}" (${allKeywords.length}/${maxKeywords})`,
      );

      // 1. Autocomplete
      const autocompleteResults = await fetchAutocomplete(
        seed,
        params.country,
        params.language,
      );
      for (const suggestion of autocompleteResults) {
        addKeyword(suggestion, "autocomplete", seed);
      }
      console.log(
        `[KeywordDiscoverer] Autocomplete: +${autocompleteResults.length} suggestions`,
      );

      // Cooldown between scraping requests
      await sleep(2000 + Math.random() * 2000);

      // 2. PAA + Related from SERP
      const serpData = await fetchSerpKeywords(
        seed,
        params.country,
        params.language,
      );
      for (const question of serpData.paa) {
        addKeyword(question, "paa", seed);
      }
      for (const related of serpData.related) {
        addKeyword(related, "related", seed);
      }
      console.log(
        `[KeywordDiscoverer] SERP: +${serpData.paa.length} PAA, +${serpData.related.length} related`,
      );

      // Cooldown before LLM call
      await sleep(1000);

      // 3. LLM Expansion
      const remaining = maxKeywords - allKeywords.length;
      const llmCount = Math.min(15, remaining);
      if (llmCount > 0) {
        const llmKeywords = await expandWithLlm(
          seed,
          params.brandName,
          params.language,
          llmCount,
        );
        for (const kw of llmKeywords) {
          addKeyword(kw, "llm_expansion", seed);
        }
        console.log(
          `[KeywordDiscoverer] LLM expansion: +${llmKeywords.length} keywords`,
        );
      }

      // Cooldown between seed keywords
      await sleep(2000 + Math.random() * 3000);
    }

    // Trim to max
    const finalKeywords = allKeywords.slice(0, maxKeywords);

    // Log results
    const bySource = {
      autocomplete: finalKeywords.filter((k) => k.source === "autocomplete").length,
      paa: finalKeywords.filter((k) => k.source === "paa").length,
      related: finalKeywords.filter((k) => k.source === "related").length,
      llm_expansion: finalKeywords.filter((k) => k.source === "llm_expansion").length,
    };

    addArtifact(activity.id, {
      type: "json",
      title: `発見キーワード (${finalKeywords.length}件)`,
      content: JSON.stringify(
        {
          total: finalKeywords.length,
          bySource,
          keywords: finalKeywords.map((k) => ({
            keyword: k.keyword,
            source: k.source,
            intent: k.intent,
          })),
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        totalKeywords: finalKeywords.length,
        autocompleteCount: bySource.autocomplete,
        paaCount: bySource.paa,
        relatedCount: bySource.related,
        llmExpansionCount: bySource.llm_expansion,
        seedCount: params.seedKeywords.length,
      },
      details: { bySource },
    });

    console.log(
      `[KeywordDiscoverer] Done: ${finalKeywords.length} keywords discovered`,
    );
    return finalKeywords;
  } catch (error) {
    failActivity(
      activity.id,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
