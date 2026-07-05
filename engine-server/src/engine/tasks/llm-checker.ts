/**
 * LLM Checker — Anthropic の web_search ツールでブランド言及状況を測定（GEO）
 *
 * 旧実装は Perplexity / Google AI Overview を Playwright でブラウザスクレイピング
 * していたが、datacenter IP からはほぼCAPTCHA/ブロックされ 0件しか取れなかった。
 * ここでは Claude（+ web_search サーバーツール）に「〇〇について教えて」等を投げ、
 * 実際にweb検索した回答の中でターゲットブランド/URLが言及・引用されるかを測定する。
 * これはスクレイピングと違いブロックされず、安定して実測値が得られる。
 *
 * metrics 契約（mentioned / mentionCount / citedUrlCount）は従来と同一に保つため、
 * analytics.ts（AI引用率の集計）は変更不要。
 */

import {
  startActivity,
  completeActivity,
  addArtifact,
} from "../activity-logger.js";

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

// 旧プラットフォーム名も型として許容（呼び出し側の移行を容易にするため）
export type LlmPlatform = "ai-search" | "perplexity" | "google-ai-overview";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Haiku 4.5 では web_search は基本版 web_search_20250305 を使う
// （_20260209 の動的フィルタ版は Opus 4.6+/Sonnet 4.6+ のみ）
const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 3,
} as const;

interface WebSearchResponse {
  responseText: string;
  citedUrls: string[];
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Claude に web_search させて回答テキストと引用URLを取得する */
async function askWithWebSearch(
  query: string,
  language: string,
): Promise<WebSearchResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY 未設定（web検索によるGEO測定に必要）",
    );
  }
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: `あなたは検索アシスタントです。ユーザーの質問（言語: ${language}）に対し、必ず web_search で最新情報を調べてから、事実に基づいて簡潔に答えてください。`,
        messages: [{ role: "user", content: query }],
        tools: [WEB_SEARCH_TOOL],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic web_search failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: Array<Record<string, unknown>>;
  };
  const blocks = Array.isArray(data.content) ? data.content : [];

  const responseText = blocks
    .filter((b) => b.type === "text")
    .map((b) => (typeof b.text === "string" ? b.text : ""))
    .join("\n")
    .trim();

  // 引用URL: web_search_tool_result の結果リスト + text ブロックの citations
  const citedUrls: string[] = [];
  for (const b of blocks) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content as Array<Record<string, unknown>>) {
        if (r && typeof r.url === "string") citedUrls.push(r.url);
      }
    }
    if (b.type === "text" && Array.isArray(b.citations)) {
      for (const c of b.citations as Array<Record<string, unknown>>) {
        if (c && typeof c.url === "string") citedUrls.push(c.url);
      }
    }
  }

  return { responseText, citedUrls: Array.from(new Set(citedUrls)) };
}

export async function checkLlm(params: {
  projectId: string;
  taskId: string;
  query: string;
  targetBrand: string;
  platform: LlmPlatform;
  country: string;
  language: string;
  targetUrl?: string;
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

  try {
    const { responseText, citedUrls } = await askWithWebSearch(
      params.query,
      params.language,
    );

    const brandLower = (params.targetBrand || "").trim().toLowerCase();
    const textLower = responseText.toLowerCase();
    const mentioned = brandLower.length > 0 && textLower.includes(brandLower);
    const mentionCount = mentioned
      ? textLower.split(brandLower).length - 1
      : 0;

    // 自社ドメインが引用元に含まれるか（より強いGEOシグナル）
    const targetDomain = params.targetUrl ? hostnameOf(params.targetUrl) : "";
    const brandCited =
      targetDomain.length > 0 &&
      citedUrls.some((u) => {
        const h = hostnameOf(u);
        return h.length > 0 && (h.includes(targetDomain) || targetDomain.includes(h));
      });

    addArtifact(activity.id, {
      type: "json",
      title: "LLMチェック結果（web検索）",
      content: JSON.stringify(
        {
          query: params.query,
          platform: params.platform,
          mentioned,
          mentionCount,
          brandCited,
          citedUrls: citedUrls.slice(0, 20),
          responseText: responseText.slice(0, 800),
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        mentioned: mentioned ? 1 : 0,
        mentionCount,
        citedUrlCount: citedUrls.length,
        brandCited: brandCited ? 1 : 0,
      },
      details: { source: "anthropic-web-search", brandCited },
    });

    return {
      query: params.query,
      platform: params.platform,
      country: params.country,
      language: params.language,
      targetBrand: params.targetBrand,
      mentioned,
      mentionCount,
      responseText,
      citedUrls,
      sentiment: mentioned ? "neutral" : "unknown",
      checkedAt: new Date(),
    };
  } catch (error) {
    // エラーでもクラッシュさせない — スキップ扱い
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[LLM] Skipping "${params.query}": ${msg}`);
    completeActivity(activity.id, {
      metrics: { mentioned: 0, mentionCount: 0, citedUrlCount: 0 },
      details: { note: `スキップ: ${msg}` },
    });
    return {
      query: params.query,
      platform: params.platform,
      country: params.country,
      language: params.language,
      targetBrand: params.targetBrand,
      mentioned: false,
      mentionCount: 0,
      responseText: "",
      citedUrls: [],
      sentiment: "unknown",
      checkedAt: new Date(),
    };
  }
}
