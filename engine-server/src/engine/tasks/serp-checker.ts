/**
 * SERP Checker — 検索順位を専用API（Serper）で定点観測
 *
 * 旧実装は Playwright で Google を直接スクレイピングしていたが、datacenter IP から
 * はほぼCAPTCHA/クラッシュでブロックされ、成功0件だった（実測: 1501回中0件）。
 * ここでは Serper（Google検索結果API）を1つだけPV裏側に持ち、対象キーワードでの
 * 自社ドメインの掲載順位を安定して取得する。顧客側のGoogle設定は一切不要。
 *
 * metrics 契約（position / topResultsCount / paaCount）は従来と同一に保つため、
 * analytics.ts（平均検索順位の集計）とダッシュボードは変更不要。
 *
 * 必要な環境変数: SERPER_API_KEY（https://serper.dev で取得。1アカウントを全顧客で共用）
 */

import {
  startActivity,
  completeActivity,
  addArtifact,
} from "../activity-logger.js";

export interface SerpResult {
  keyword: string;
  country: string;
  language: string;
  targetUrl: string;
  position: number | null; // null = 100位圏外/未取得
  totalResults: string;
  topResults: { position: number; title: string; url: string; snippet: string }[];
  featuredSnippet?: { title: string; content: string };
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  checkedAt: Date;
}

const SERPER_URL = "https://google.serper.dev/search";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

/** Serper を叩いて Google検索結果を取得 */
async function fetchSerper(
  keyword: string,
  country: string,
  language: string,
): Promise<{
  organic: SerperOrganic[];
  answerBox?: { title?: string; snippet?: string; answer?: string };
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  totalResults: string;
}> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY 未設定（順位取得元のAPIキーが必要）");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: keyword,
        gl: (country || "jp").toLowerCase() === "global" ? "jp" : (country || "jp").toLowerCase(),
        hl: language || "ja",
        num: 100, // page10相当まで取得して圏外に落ちるまで追える
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Serper failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    organic?: SerperOrganic[];
    answerBox?: { title?: string; snippet?: string; answer?: string };
    peopleAlsoAsk?: Array<{ question?: string }>;
    relatedSearches?: Array<{ query?: string }>;
    searchInformation?: { totalResults?: string };
  };

  return {
    organic: Array.isArray(data.organic) ? data.organic : [],
    answerBox: data.answerBox,
    peopleAlsoAsk: (data.peopleAlsoAsk ?? [])
      .map((p) => p.question ?? "")
      .filter(Boolean),
    relatedSearches: (data.relatedSearches ?? [])
      .map((r) => r.query ?? "")
      .filter(Boolean),
    totalResults: data.searchInformation?.totalResults ?? "",
  };
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

  const targetDomain = hostnameOf(params.targetUrl);

  try {
    const serp = await fetchSerper(
      params.keyword,
      params.country,
      params.language,
    );

    // organic は順位順。自社ドメインが現れる最初の位置＝掲載順位
    let position: number | null = null;
    const topResults = serp.organic.slice(0, 100).map((o, i) => {
      const url = o.link ?? "";
      const rank = typeof o.position === "number" && o.position > 0 ? o.position : i + 1;
      const host = hostnameOf(url);
      if (
        position === null &&
        targetDomain.length > 0 &&
        host.length > 0 &&
        (host.includes(targetDomain) || targetDomain.includes(host))
      ) {
        position = rank;
      }
      return {
        position: rank,
        title: o.title ?? "",
        url,
        snippet: o.snippet ?? "",
      };
    });

    const featuredSnippet = serp.answerBox
      ? {
          title: serp.answerBox.title ?? "",
          content: serp.answerBox.snippet ?? serp.answerBox.answer ?? "",
        }
      : undefined;

    const result: SerpResult = {
      keyword: params.keyword,
      country: params.country,
      language: params.language,
      targetUrl: params.targetUrl,
      position,
      totalResults: serp.totalResults,
      topResults: topResults.slice(0, 20),
      featuredSnippet,
      peopleAlsoAsk: serp.peopleAlsoAsk.slice(0, 10),
      relatedSearches: serp.relatedSearches.slice(0, 10),
      checkedAt: new Date(),
    };

    addArtifact(activity.id, {
      type: "json",
      title: `SERP結果: "${params.keyword}" (${params.country})`,
      content: JSON.stringify(
        {
          keyword: params.keyword,
          country: params.country,
          position,
          totalResults: serp.totalResults,
          top10: topResults.slice(0, 10),
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        position: position ?? -1,
        topResultsCount: serp.organic.length,
        paaCount: serp.peopleAlsoAsk.length,
      },
      details: {
        position,
        hasFeaturedSnippet: !!featuredSnippet,
        source: "serper",
      },
    });

    return result;
  } catch (error) {
    // エラー（未キー含む）でもクラッシュさせない — スキップ扱い
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SERP] Skipping "${params.keyword}": ${msg}`);
    completeActivity(activity.id, {
      metrics: { position: -1, topResultsCount: 0, paaCount: 0 },
      details: { note: `スキップ: ${msg}`, source: "serper" },
    });
    return {
      keyword: params.keyword,
      country: params.country,
      language: params.language,
      targetUrl: params.targetUrl,
      position: null,
      totalResults: "",
      topResults: [],
      peopleAlsoAsk: [],
      relatedSearches: [],
      checkedAt: new Date(),
    };
  }
}
