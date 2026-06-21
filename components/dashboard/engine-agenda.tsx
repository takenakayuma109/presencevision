"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  CheckCircle2,
  Clock,
  PenTool,
  Search,
  MessageSquare,
  Globe,
  RefreshCw,
  Repeat,
} from "lucide-react";

interface HourBucket {
  hour: number;
  total: number;
  byType: Record<string, number>;
}
interface SerpKeyword {
  keyword: string;
  position: number | null;
  country: string | null;
}

const CONTENT_TYPES = ["content_generation", "schema_generation", "multilingual_expansion", "faq_generation"];
const CHECK_TYPES = ["serp_check", "llm_check", "ranking_monitor", "keyword_research", "site_analysis", "strategy_adjustment"];

function sum(byType: Record<string, number>, types: string[]): number {
  return types.reduce((n, t) => n + (byType[t] ?? 0), 0);
}

function summarize(b: HourBucket): string {
  const parts: string[] = [];
  const c = sum(b.byType, CONTENT_TYPES);
  const ch = sum(b.byType, CHECK_TYPES);
  const dist = b.byType["content_distribution"] ?? 0;
  const r = b.byType["report_generation"] ?? 0;
  if (c) parts.push(`記事生成 ${c}`);
  if (ch) parts.push(`順位・AI引用チェック ${ch}`);
  if (dist) parts.push(`配信 ${dist}`);
  if (r) parts.push(`巡回・レポート ${r}`);
  return parts.join("・") || "稼働";
}

function jstHour(): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(s) % 24;
}

export function EngineAgenda({
  projectId,
  hours,
}: {
  projectId: string;
  hours: HourBucket[];
}) {
  const [keywords, setKeywords] = useState<SerpKeyword[]>([]);

  useEffect(() => {
    fetch(`/api/engine/analytics/serp-keywords?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setKeywords(Array.isArray(d?.keywords) ? d.keywords : []))
      .catch(() => {});
  }, [projectId]);

  const currentHour = jstHour();
  const nextHour = (currentHour + 1) % 24;

  // 本日の実行ログ（稼働した時間帯、新しい順）
  const doneLog = useMemo(() => {
    return (hours.length === 24 ? hours : [])
      .filter((b) => b.hour <= currentHour && b.total > 0)
      .sort((a, b) => b.hour - a.hour);
  }, [hours, currentHour]);

  const articlesToday = useMemo(
    () => (hours.length === 24 ? hours : []).reduce((n, b) => n + sum(b.byType, ["content_generation"]), 0),
    [hours],
  );

  const fmtRank = (p: number | null) =>
    p == null ? "圏外" : `${p}位`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Repeat className="h-4 w-4 text-blue-400" />
          稼働スケジュール（実行済み・これからの予定）
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pb-4 lg:grid-cols-2">
        {/* これまで（実行済み） */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            ✅ 本日の実行ログ（{doneLog.length}時間帯で稼働）
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {doneLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">まだ稼働記録がありません。</p>
            ) : (
              doneLog.map((b) => {
                const heavy = sum(b.byType, CONTENT_TYPES) + sum(b.byType, CHECK_TYPES) > 0;
                return (
                  <div
                    key={b.hour}
                    className="flex items-start gap-2 rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${heavy ? "text-emerald-400" : "text-cyan-500/70"}`}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground">
                        {String(b.hour).padStart(2, "0")}:00
                      </span>
                      <span className="ml-2 text-[11px] text-muted-foreground">{summarize(b)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* これから（自動で繰り返す予定 = TODO） */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            🔁 これからの自動予定（毎日くり返し実行）
          </p>
          <div className="space-y-1.5">
            <AgendaItem
              icon={Clock}
              color="text-cyan-400"
              title="自動巡回・モニタリング＆レポート"
              meta={`毎時 — 次回 ${String(nextHour).padStart(2, "0")}:00`}
            />
            <AgendaItem
              icon={PenTool}
              color="text-emerald-400"
              title="記事の自動生成・公開"
              meta={`1日に数回 — 本日 ${articlesToday}件 実行済み`}
            />
            <AgendaItem
              icon={Search}
              color="text-blue-400"
              title="検索順位チェック（SERP）"
              meta="1日1回"
            >
              <div className="mt-1.5">
                <p className="mb-1 text-[10px] text-muted-foreground">
                  追跡中の検索キーワード（この語で順位を計測）:
                </p>
                {keywords.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/70">
                    まだ順位チェックの記録がありません（稼働後に表示）。
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {keywords.slice(0, 18).map((k) => (
                      <span
                        key={k.keyword}
                        className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px]"
                      >
                        <span className="max-w-[150px] truncate text-foreground">{k.keyword}</span>
                        <span className={k.position == null ? "text-muted-foreground/60" : "text-emerald-400"}>
                          {fmtRank(k.position)}
                        </span>
                      </span>
                    ))}
                    {keywords.length > 18 && (
                      <span className="text-[10px] text-muted-foreground/60">他 {keywords.length - 18}件</span>
                    )}
                  </div>
                )}
              </div>
            </AgendaItem>
            <AgendaItem
              icon={MessageSquare}
              color="text-purple-400"
              title="AI引用チェック（ChatGPT等が自社を引用するか）"
              meta="1日1回"
            />
            <AgendaItem
              icon={Globe}
              color="text-pink-400"
              title="多言語展開・構造化データ(Schema)生成"
              meta="記事生成と同時"
            />
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              翌日以降も自動でくり返し実行されます。
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaItem({
  icon: Icon,
  color,
  title,
  meta,
  children,
}: {
  icon: typeof Clock;
  color: string;
  title: string;
  meta: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-2.5 py-2">
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground">{meta}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
