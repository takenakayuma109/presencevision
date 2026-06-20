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

const DESTINATIONS = [
  {
    key: "hub",
    name: "自社ナレッジHub",
    desc: "PVが自動で作成・公開（常時有効・接続不要）",
    icon: BookOpen,
    types: [] as string[],
    alwaysOn: true,
  },
  {
    key: "cms",
    name: "あなたのサイト / WordPress",
    desc: "連携すると、あなたの既存サイトにも自動投稿",
    icon: Globe,
    types: ["wordpress"],
    alwaysOn: false,
  },
  {
    key: "gbp",
    name: "Googleビジネスプロフィール",
    desc: "Google検索・マップに最新投稿を自動掲載",
    icon: Search,
    types: ["google_business"],
    alwaysOn: false,
  },
  {
    key: "community",
    name: "技術コミュニティ",
    desc: "dev.to / Qiita / Hashnode（公式API）",
    icon: FileText,
    types: ["devto", "qiita", "hashnode"],
    alwaysOn: false,
  },
];

export function ExposureSummary({ projectId }: { projectId: string }) {
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [channels, setChannels] = useState<ChannelLite[]>([]);

  useEffect(() => {
    fetch(`/api/engine/articles?projectId=${projectId}&limit=300`)
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((d) => setArticles(Array.isArray(d.articles) ? d.articles : []))
      .catch(() => {});
    fetch(`/api/channels?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [projectId]);

  const today = new Date().toISOString().slice(0, 10);
  const total = articles.length;
  const todayCount = useMemo(
    () =>
      articles.filter(
        (a) => (a.published_at || a.publishedAt || "").slice(0, 10) === today,
      ).length,
    [articles, today],
  );
  const isConnected = (types: string[]) =>
    types.some((t) => channels.some((c) => c.type === t && c.connected));

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          露出先サマリー（どこに公開されているか）
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span>
            累計 <span className="text-lg font-bold text-foreground">{total}</span> 件
          </span>
          <span>
            本日 <span className="text-lg font-bold text-blue-400">{todayCount}</span> 件
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {DESTINATIONS.map((d) => {
          const connected = d.alwaysOn || isConnected(d.types);
          const Icon = d.icon;
          const inner = (
            <div
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                connected
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-border/50 bg-background/40 hover:border-blue-500/40"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
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
              </div>
              <div className="shrink-0 text-right text-xs">
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
