"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe,
  FileText,
  Search,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ArticleLite {
  published_at?: string;
  publishedAt?: string;
}
interface ChannelLite {
  type: string;
  connected: boolean;
}
interface DistributionLite {
  method?: string;
  startedAt?: string;
  completedAt?: string;
}

interface Counts {
  total: number;
  month: number;
  today: number;
}

const DESTINATIONS = [
  {
    key: "hub",
    name: "自社ナレッジHub",
    desc: "PVが自動で作成・公開（常時有効・接続不要）",
    icon: BookOpen,
    types: [] as string[],
    // Hub の件数は記事DB（published_articles）から算出する
    method: null as string | null,
    alwaysOn: true,
  },
  {
    key: "cms",
    name: "あなたのサイト / WordPress",
    desc: "連携すると、あなたの既存サイトにも自動投稿",
    icon: Globe,
    types: ["wordpress"],
    method: "WordPress",
    alwaysOn: false,
  },
  {
    key: "gbp",
    name: "Googleビジネスプロフィール",
    desc: "Google検索・マップに最新投稿を自動掲載",
    icon: Search,
    types: ["google_business"],
    method: "GoogleBusiness",
    alwaysOn: false,
  },
  {
    key: "community",
    name: "技術コミュニティ",
    desc: "dev.to / Qiita / Hashnode（公式API）",
    icon: FileText,
    types: ["devto", "qiita", "hashnode"],
    method: "BlogDistribution",
    alwaysOn: false,
  },
];

/** ISO日時を日本時間(JST)の "YYYY-MM-DD" に変換 */
function jstDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  } catch {
    return "";
  }
}

/** ISO日時の配列を 累計 / 今月 / 今日 に集計（JST基準） */
function bucket(timestamps: string[], todayKey: string, monthKey: string): Counts {
  let total = 0;
  let month = 0;
  let today = 0;
  for (const iso of timestamps) {
    if (!iso) continue;
    total++;
    const day = jstDay(iso);
    if (day.slice(0, 7) === monthKey) month++;
    if (day === todayKey) today++;
  }
  return { total, month, today };
}

const EMPTY: Counts = { total: 0, month: 0, today: 0 };

export function ExposureSummary({ projectId }: { projectId: string }) {
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [articlesTotal, setArticlesTotal] = useState<number | null>(null);
  const [channels, setChannels] = useState<ChannelLite[]>([]);
  const [distributions, setDistributions] = useState<DistributionLite[]>([]);

  useEffect(() => {
    fetch(`/api/engine/articles?projectId=${projectId}&limit=300`)
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((d) => {
        setArticles(Array.isArray(d.articles) ? d.articles : []);
        setArticlesTotal(typeof d.total === "number" ? d.total : null);
      })
      .catch(() => {});
    fetch(`/api/channels?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
    // 外部露出先（WordPress / GBP / 技術コミュニティ）への公開実績は
    // content_distribution アクティビティから method 別に集計する。
    fetch(
      `/api/engine/activities?projectId=${projectId}&type=content_distribution&status=completed&limit=2000`,
    )
      .then((r) => (r.ok ? r.json() : { activities: [] }))
      .then((d) =>
        setDistributions(Array.isArray(d.activities) ? d.activities : []),
      )
      .catch(() => {});
  }, [projectId]);

  const isConnected = (types: string[]) =>
    types.some((t) => channels.some((c) => c.type === t && c.connected));

  // 露出先ごとの 累計 / 今月 / 今日 と、その合計を算出
  const { statsByKey, grand } = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
    });
    const monthKey = todayKey.slice(0, 7);

    // Hub: 記事DBから（累計はAPIのtotal、今月/今日は取得済み記事の日付から）
    const hubBucket = bucket(
      articles.map((a) => a.published_at || a.publishedAt || ""),
      todayKey,
      monthKey,
    );
    const hub: Counts = {
      total: articlesTotal ?? hubBucket.total,
      month: hubBucket.month,
      today: hubBucket.today,
    };

    // 外部チャネル: method 別に集計
    const byMethod: Record<string, string[]> = {};
    for (const d of distributions) {
      const m = d.method;
      if (!m) continue;
      (byMethod[m] ??= []).push(d.completedAt || d.startedAt || "");
    }

    const statsByKey: Record<string, Counts> = {};
    for (const dest of DESTINATIONS) {
      if (dest.alwaysOn) {
        statsByKey[dest.key] = hub;
      } else if (dest.method) {
        statsByKey[dest.key] = bucket(
          byMethod[dest.method] ?? [],
          todayKey,
          monthKey,
        );
      } else {
        statsByKey[dest.key] = EMPTY;
      }
    }

    // 合計 = 全露出先の単純合算（露出回数の合計）
    const grand = Object.values(statsByKey).reduce<Counts>(
      (acc, s) => ({
        total: acc.total + s.total,
        month: acc.month + s.month,
        today: acc.today + s.today,
      }),
      { ...EMPTY },
    );

    return { statsByKey, grand };
  }, [articles, articlesTotal, distributions]);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          露出先サマリー（どこに公開されているか）
        </h3>
        <div className="flex items-center gap-3 text-xs sm:gap-4">
          <span className="text-muted-foreground">合計</span>
          <span>
            累計 <span className="text-lg font-bold text-foreground">{grand.total}</span> 件
          </span>
          <span>
            今月 <span className="text-lg font-bold text-foreground">{grand.month}</span> 件
          </span>
          <span>
            今日 <span className="text-lg font-bold text-blue-400">{grand.today}</span> 件
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {DESTINATIONS.map((d) => {
          const connected = d.alwaysOn || isConnected(d.types);
          const Icon = d.icon;
          const s = statsByKey[d.key] ?? EMPTY;
          const inner = (
            <div
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                connected
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-border/50 bg-background/40 hover:border-blue-500/40"
              }`}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  connected ? "bg-emerald-500/15" : "bg-muted"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${connected ? "text-emerald-500" : "text-muted-foreground"}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{d.name}</span>
                  {connected ? (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                      <Check className="h-2.5 w-2.5" />
                      {d.alwaysOn ? "常時有効" : "連携済み"}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      未連携
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{d.desc}</div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    累計{" "}
                    <span className="font-semibold text-foreground">{s.total}</span>
                  </span>
                  <span className="text-border">/</span>
                  <span>
                    今月{" "}
                    <span className="font-semibold text-foreground">{s.month}</span>
                  </span>
                  <span className="text-border">/</span>
                  <span>
                    今日{" "}
                    <span
                      className={`font-semibold ${s.today > 0 ? "text-blue-400" : "text-foreground"}`}
                    >
                      {s.today}
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-0.5 shrink-0 text-right text-xs">
                {d.alwaysOn ? (
                  <span className="inline-flex items-center gap-0.5 text-blue-400">
                    開く <ExternalLink className="h-3 w-3" />
                  </span>
                ) : connected ? (
                  <span className="text-emerald-500">公開中</span>
                ) : (
                  <span className="inline-flex items-center text-muted-foreground">
                    連携 <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          );

          if (d.alwaysOn) {
            return (
              <a
                key={d.key}
                href={`/companies/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            );
          }
          return (
            <Link key={d.key} href={`/projects/${projectId}/channels`}>
              {inner}
            </Link>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        ※ 自社Hub以外（WordPress・GBP・技術コミュニティ）の記事は、連携先のプラットフォーム上で公開・閲覧されます。連携はチャネル画面から。
      </p>
    </div>
  );
}
