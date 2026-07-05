/**
 * SERP Checker — Google Search Console API で「対象キーワードの平均掲載順位」を取得
 *
 * 旧実装は Playwright で Google をスクレイピング（datacenter IPで全ブロック=0件）だったが、
 * ここでは顧客自身の Search Console データ（＝Google公式の平均掲載順位）を、PVが1つ持つ
 * サービスアカウント経由で読む。顧客はSAのメールに閲覧権限を付けるだけ。外部の第三者
 * サービス（Serper等）は不要。
 *
 * metrics 契約（position / topResultsCount / paaCount）は従来と同一に保つため、
 * analytics.ts（平均検索順位の集計）とダッシュボードは変更不要。
 *
 * 必要な環境変数: GOOGLE_SA_KEY（サービスアカウントのJSON鍵。JSONそのまま or base64）
 */

import {
  startActivity,
  completeActivity,
  addArtifact,
} from "../activity-logger.js";
import { getSaAccessToken, hasServiceAccount } from "../google-sa.js";

const SC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SC_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

export interface SerpResult {
  keyword: string;
  country: string;
  language: string;
  targetUrl: string;
  position: number | null; // null = そのキーワードでは掲載実績なし（圏外）
  totalResults: string;
  topResults: { position: number; title: string; url: string; snippet: string }[];
  featuredSnippet?: { title: string; content: string };
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  checkedAt: Date;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** siteUrl（"sc-domain:example.com" or "https://www.example.com/"）からドメインを抽出 */
function siteUrlDomain(siteUrl: string): string {
  if (siteUrl.startsWith("sc-domain:")) {
    return siteUrl.slice("sc-domain:".length).replace(/^www\./, "").toLowerCase();
  }
  return hostnameOf(siteUrl);
}

function ymd(d: Date): string {
  return d.toISOString().split("T")[0];
}

// targetDomain -> 解決済み siteUrl のキャッシュ（毎回 sites.list しない）
const siteUrlCache: Record<string, string | null> = {};

async function resolveSiteUrl(token: string, targetDomain: string): Promise<string | null> {
  if (targetDomain in siteUrlCache) return siteUrlCache[targetDomain];
  const res = await fetch(`${SC_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Search Console sites.list 失敗: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel: string }[];
  };
  const sites = data.siteEntry ?? [];
  // 対象ドメインに一致するプロパティを選ぶ（sc-domain を優先）
  const match =
    sites.find(
      (s) =>
        s.siteUrl.startsWith("sc-domain:") &&
        siteUrlDomain(s.siteUrl) === targetDomain,
    ) ??
    sites.find((s) => siteUrlDomain(s.siteUrl) === targetDomain) ??
    sites.find((s) => {
      const d = siteUrlDomain(s.siteUrl);
      return d.length > 0 && (d.includes(targetDomain) || targetDomain.includes(d));
    });
  const resolved = match ? match.siteUrl : null;
  siteUrlCache[targetDomain] = resolved;
  return resolved;
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

  const empty = (): SerpResult => ({
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
  });

  try {
    if (!hasServiceAccount()) {
      throw new Error("GOOGLE_SA_KEY 未設定（Search Console連携が必要）");
    }

    const token = await getSaAccessToken(SC_SCOPE);
    const siteUrl = await resolveSiteUrl(token, targetDomain);
    if (!siteUrl) {
      throw new Error(
        `Search Console に ${targetDomain} のプロパティが見つからない（SAに閲覧権限が付与されているか、対象サイトが登録済みか確認）`,
      );
    }

    // 直近28日（Search Consoleは2〜3日遅延があるので endDate は当日でも可）
    const now = new Date();
    const endDate = ymd(new Date(now.getTime() - 1 * 86_400_000));
    const startDate = ymd(new Date(now.getTime() - 28 * 86_400_000));

    const res = await fetch(
      `${SC_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          dimensionFilterGroups: [
            {
              filters: [
                { dimension: "query", operator: "equals", expression: params.keyword },
              ],
            },
          ],
          rowLimit: 1,
          dataState: "all",
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`searchAnalytics.query 失敗: ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    };
    const row = data.rows?.[0];

    // Search Console の position は平均掲載順位（1始まりの小数）。実績が無ければ圏外。
    const position =
      row && typeof row.position === "number" && row.position > 0
        ? Math.round(row.position * 10) / 10
        : null;

    addArtifact(activity.id, {
      type: "json",
      title: `Search Console: "${params.keyword}" (${startDate}〜${endDate})`,
      content: JSON.stringify(
        {
          keyword: params.keyword,
          siteUrl,
          position,
          impressions: row?.impressions ?? 0,
          clicks: row?.clicks ?? 0,
          ctr: row?.ctr ?? 0,
          period: `${startDate}〜${endDate}`,
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        position: position ?? -1,
        topResultsCount: row ? 1 : 0,
        paaCount: 0,
        impressions: row?.impressions ?? 0,
        clicks: row?.clicks ?? 0,
      },
      details: {
        position,
        source: "search-console",
        siteUrl,
        impressions: row?.impressions ?? 0,
      },
    });

    return {
      ...empty(),
      position,
      totalResults: row ? String(row.impressions) : "",
    };
  } catch (error) {
    // エラー（未連携含む）でもクラッシュさせない — スキップ扱い
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SERP] Skipping "${params.keyword}": ${msg}`);
    completeActivity(activity.id, {
      metrics: { position: -1, topResultsCount: 0, paaCount: 0 },
      details: { note: `スキップ: ${msg}`, source: "search-console" },
    });
    return empty();
  }
}
