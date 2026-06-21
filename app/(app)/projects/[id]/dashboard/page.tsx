"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText, Globe,
  MessageSquare, PenTool, Search, TrendingDown, TrendingUp,
  ChevronDown, ChevronRight, RefreshCw, Shield, Zap, Rss, XCircle,
  Loader2,
} from "lucide-react";
import { ExposureSummary } from "@/components/dashboard/exposure-summary";
import { PresenceTrends } from "@/components/dashboard/presence-trends";
import { EngineAgenda } from "@/components/dashboard/engine-agenda";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  summary: {
    articlesGenerated: number;
    avgPosition: number | null;
    llmMentionRate: number | null;
    llmMentionedCount: number;
    llmTotalChecks: number;
    activeChannels: number;
  };
  serpTrend: Record<string, { date: string; position: number }[]>;
  llmTrend: Record<string, { date: string; mentioned: number; total: number; mentionCount: number }[]>;
  contentTrend: { date: string; count: number; totalWords: number }[];
}

interface ActivityItem {
  id: string;
  projectId: string;
  taskId: string;
  type: string;
  status: "running" | "completed" | "failed" | "skipped";
  country: string;
  language: string;
  method: string;
  description: string;
  details?: Record<string, unknown>;
  artifacts: {
    type: "screenshot" | "html" | "json" | "text" | "url" | "code";
    title: string;
    content: string;
    mimeType?: string;
  }[];
  metrics?: Record<string, number>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_ICONS: Record<string, typeof Search> = {
  SEO: Search,
  AEO: MessageSquare,
  GEO: Globe,
  "Schema.org": Shield,
  ContentMarketing: PenTool,
  FAQ: MessageSquare,
  KnowledgeGraph: Zap,
  Multilingual: Globe,
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  SEO: { bg: "bg-blue-500/15", text: "text-blue-400" },
  AEO: { bg: "bg-purple-500/15", text: "text-purple-400" },
  GEO: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  "Schema.org": { bg: "bg-amber-500/15", text: "text-amber-400" },
  ContentMarketing: { bg: "bg-green-500/15", text: "text-green-400" },
  FAQ: { bg: "bg-violet-500/15", text: "text-violet-400" },
  KnowledgeGraph: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  Multilingual: { bg: "bg-teal-500/15", text: "text-teal-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "完了" },
  running: { bg: "bg-amber-500/20", text: "text-amber-400", label: "実行中" },
  failed: { bg: "bg-red-500/20", text: "text-red-400", label: "失敗" },
  skipped: { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "スキップ" },
};

/** Determine which metrics a task type contributes to */
function getTaskTags(type: string): ("SERP" | "LLM")[] {
  const t = type.toLowerCase();
  if (t.includes("serp")) return ["SERP"];
  if (t.includes("llm")) return ["LLM"];
  if (t.includes("content") || t.includes("article") || t.includes("generation"))
    return ["SERP", "LLM"];
  return [];
}

// ---------------------------------------------------------------------------
// Hero Metric Cards
// ---------------------------------------------------------------------------

function HeroMetrics({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  const avgPos = data?.summary.avgPosition;
  const mentionRate = data?.summary.llmMentionRate;
  const mentionedCount = data?.summary.llmMentionedCount ?? 0;
  const totalChecks = data?.summary.llmTotalChecks ?? 0;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {/* Card A: SERP */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">
                SERP順位追跡
              </p>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                ) : (
                  <span className="text-5xl font-bold text-blue-50 tracking-tight">
                    {avgPos != null ? `${avgPos}` : "---"}
                  </span>
                )}
                {avgPos != null && (
                  <span className="text-2xl font-semibold text-blue-300">位</span>
                )}
              </div>
              <p className="text-sm text-blue-300/70 mt-1">平均検索順位</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-blue-200/50">
                Google検索（SERP＝検索結果ページ）で自社ページが平均で何番目に出るか。数字が小さい＝上位で良い。「---」はまだ順位が付く前の状態です。
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
              <TrendingDown className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card B: LLM */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">
                LLM引用モニタリング
              </p>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                ) : (
                  <span className="text-5xl font-bold text-purple-50 tracking-tight">
                    {mentionRate != null ? `${mentionRate}` : "0"}
                  </span>
                )}
                <span className="text-2xl font-semibold text-purple-300">%</span>
              </div>
              <p className="text-sm text-purple-300/70 mt-1">
                AI引用率
                {totalChecks > 0 && (
                  <span className="ml-2 text-xs text-purple-400/50">
                    ({mentionedCount}/{totalChecks}件)
                  </span>
                )}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-purple-200/50">
                ChatGPTなどのAI（LLM＝大規模言語モデル）が回答の中で自社を引用した割合。新しいブランドは0%から始まり、記事が増えるにつれて上がっていきます。
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15">
              <MessageSquare className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 24-Hour Schedule Timeline (Interactive)
// ---------------------------------------------------------------------------

interface HourBucket {
  hour: number;
  total: number;
  byType: Record<string, number>;
}

const CONTENT_TYPES = ["content_generation", "schema_generation", "multilingual_expansion", "faq_generation"];
const CHECK_TYPES = ["serp_check", "llm_check", "ranking_monitor", "keyword_research", "site_analysis", "strategy_adjustment"];

function sumTypes(byType: Record<string, number>, types: string[]): number {
  return types.reduce((n, t) => n + (byType[t] ?? 0), 0);
}

function hourSummary(b: HourBucket): string {
  const parts: string[] = [];
  const c = sumTypes(b.byType, CONTENT_TYPES);
  const ch = sumTypes(b.byType, CHECK_TYPES);
  const dist = b.byType["content_distribution"] ?? 0;
  const r = b.byType["report_generation"] ?? 0;
  if (c) parts.push(`記事生成 ${c}`);
  if (ch) parts.push(`順位・AI引用チェック ${ch}`);
  if (dist) parts.push(`配信 ${dist}`);
  if (r) parts.push(`巡回・レポート ${r}`);
  return parts.join("・") || "タスクなし";
}

/** 現在のJST時刻 {hour, minute} を返す（ブラウザのTZに依存しない） */
function jstNowHM(): { hour: number; minute: number } {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const [h, m] = s.split(":").map(Number);
  return { hour: h % 24, minute: m };
}

/** エンジンの生エラー文字列をユーザー向けの平易な日本語に変換（長いJSONは出さない） */
function friendlyError(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("credit balance is too low") || s.includes("plans & billing"))
    return "AI APIのクレジット残高不足（補充後に自動再試行）";
  if (s.includes("rate_limit") || s.includes("rate limit") || s.includes("429"))
    return "AI APIのレート制限（時間をおいて自動再試行）";
  if (s.includes("overloaded") || s.includes("529")) return "AI APIが混雑中（自動再試行）";
  if (s.includes("authentication") || s.includes("invalid x-api-key") || s.includes("invalid api key"))
    return "AI APIキーの認証エラー";
  if (s.includes("timeout") || s.includes("etimedout") || s.includes("econnreset"))
    return "接続タイムアウト（自動再試行）";
  if (s.includes("invalid_request")) return "AIリクエストエラー（自動再試行）";
  const clean = raw.replace(/\s+/g, " ").trim();
  return clean.length > 100 ? `${clean.slice(0, 100)}…` : clean;
}

function isCreditError(raw?: string): boolean {
  if (!raw) return false;
  const s = raw.toLowerCase();
  return s.includes("credit balance is too low") || s.includes("plans & billing");
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-3 w-3 rounded-sm", className)} />
      {label}
    </div>
  );
}

function ScheduleTimeline({
  hours,
  selectedHour,
  onSelectHour,
  loading,
}: {
  hours: HourBucket[];
  selectedHour: number;
  onSelectHour: (h: number) => void;
  loading: boolean;
}) {
  const { hour: currentHour, minute: currentMin } = jstNowHM();
  const nowFrac = ((currentHour + currentMin / 60) / 24) * 100;

  const data =
    hours.length === 24
      ? hours
      : Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0, byType: {} }));

  const totalToday = data.reduce((n, b) => n + b.total, 0);
  const activeHours = data.filter((b) => b.hour <= currentHour && b.total > 0).length;
  const lastActive = [...data].reverse().find((b) => b.hour <= currentHour && b.total > 0)?.hour;
  const maxTotal = Math.max(1, ...data.filter((b) => b.hour <= currentHour).map((b) => b.total));
  const TRACK_PX = 104;
  const MIN_BAR_PX = 12;
  const MIN_SEG_PX = 10; // 各タスク種別の最低表示高（巡回など少数でも視認できるように）

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          本日の稼働タイムライン
          <span className="text-xs text-muted-foreground font-normal ml-auto">1時間ごとに自動稼働</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Summary chips */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            本日の実行タスク <span className="font-bold text-foreground">{totalToday}</span> 件
          </span>
          <span className="text-muted-foreground">
            稼働した時間帯 <span className="font-bold text-foreground">{activeHours}</span> / {currentHour + 1}
          </span>
          {lastActive != null && (
            <span className="text-muted-foreground">
              直近の稼働 <span className="font-bold text-foreground">{String(lastActive).padStart(2, "0")}:00台</span>
            </span>
          )}
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          エンジンは毎時、自動で巡回・レポートを実行し、記事生成（1日数回）と検索順位・AI引用チェック（1日1回）を集中して行います。各バーは内訳の積み上げ（緑＝記事生成・紫＝順位/AI引用チェック・水色＝巡回）、高さ＝作業量、数字＝実行件数。バーをクリックすると下にその時間帯の内容が出ます。
        </p>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">読み込み中…</div>
        ) : (
          <div className="relative pt-5">
            {/* Now badge — placed in its own top band so it never overlaps bar numbers */}
            <div
              className="pointer-events-none absolute top-0 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-amber-500 px-1.5 py-px text-[9px] font-bold text-black"
              style={{ left: `${Math.min(96, nowFrac)}%` }}
            >
              今 {String(currentHour).padStart(2, "0")}:{String(currentMin).padStart(2, "0")}
            </div>

            <div className="relative flex h-[124px] items-end gap-px">
              {data.map((b) => {
                const h = b.hour;
                const isFuture = h > currentHour;
                const isCurrent = h === currentHour;
                const isSelected = h === selectedHour;
                const content = sumTypes(b.byType, CONTENT_TYPES);
                const check = sumTypes(b.byType, CHECK_TYPES);
                const patrol = Math.max(0, b.total - content - check);
                const barPx =
                  b.total > 0
                    ? Math.round(MIN_BAR_PX + (TRACK_PX - MIN_BAR_PX) * (Math.sqrt(b.total) / Math.sqrt(maxTotal)))
                    : 0;
                // 各種別が存在すれば最低 MIN_SEG_PX を確保し、残りを件数比で配分（巡回も必ず見える）
                const segParts = [
                  { key: "content", count: content, cls: "bg-emerald-500/80" },
                  { key: "check", count: check, cls: "bg-violet-500/70" },
                  { key: "patrol", count: patrol, cls: "bg-cyan-500/70" },
                ].filter((s) => s.count > 0);
                const extra = Math.max(0, barPx - segParts.length * MIN_SEG_PX);
                const countSum = segParts.reduce((n, s) => n + s.count, 0) || 1;
                const segs = segParts.map((s) => ({
                  key: s.key,
                  cls: s.cls,
                  px: MIN_SEG_PX + Math.round((extra * s.count) / countSum),
                }));
                const barTotalPx = segs.reduce((n, s) => n + s.px, 0);
                return (
                  <button
                    key={h}
                    onClick={() => onSelectHour(h)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end focus:outline-none"
                    aria-label={`${String(h).padStart(2, "0")}:00`}
                  >
                    {!isFuture && b.total > 3 && (
                      <span className="mb-0.5 text-[8px] font-semibold leading-none text-foreground/60">{b.total}</span>
                    )}
                    {isFuture ? (
                      <div className="h-1.5 w-full rounded-sm border border-dashed border-zinc-700/60 bg-zinc-800/30" />
                    ) : (
                      <div
                        className={cn(
                          "flex w-full flex-col overflow-hidden rounded-sm transition-all",
                          isCurrent && "ring-2 ring-amber-400/80",
                          isSelected && !isCurrent && "ring-2 ring-blue-400",
                          !isSelected && !isCurrent && "hover:brightness-125",
                        )}
                        style={{ height: Math.max(3, barTotalPx) }}
                      >
                        {segs.map((s) => (
                          <div key={s.key} className={s.cls} style={{ height: s.px }} />
                        ))}
                      </div>
                    )}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                      {String(h).padStart(2, "0")}:00 — {isFuture ? "予定" : isCurrent ? "実行中" : hourSummary(b)}
                    </div>
                  </button>
                );
              })}
              {/* Now line (within bars only) */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-amber-400/60"
                style={{ left: `${nowFrac}%` }}
              />
            </div>

            {/* Hour axis */}
            <div className="relative mt-1.5 h-4">
              {[0, 6, 12, 18, 23].map((h) => (
                <div
                  key={h}
                  className="absolute text-[10px] text-muted-foreground"
                  style={{ left: `${(h / 23) * 100}%`, transform: "translateX(-50%)" }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
          <LegendDot className="bg-emerald-500/80" label="記事生成" />
          <LegendDot className="bg-violet-500/70" label="順位・AI引用チェック" />
          <LegendDot className="bg-cyan-500/70" label="巡回・レポート（毎時）" />
          <LegendDot className="bg-amber-400/80" label="現在" />
          <LegendDot className="border border-dashed border-zinc-600 bg-transparent" label="これから" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Task Card (for selected hour)
// ---------------------------------------------------------------------------

function TaskCard({ activity }: { activity: ActivityItem }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[activity.status] ?? STATUS_STYLES.completed;
  const Icon = METHOD_ICONS[activity.method] ?? Activity;
  const colors = METHOD_COLORS[activity.method] ?? { bg: "bg-zinc-500/15", text: "text-zinc-400" };
  const tags = getTaskTags(activity.type);

  const duration = activity.durationMs
    ? activity.durationMs > 60000
      ? `${Math.round(activity.durationMs / 60000)}分`
      : `${Math.round(activity.durationMs / 1000)}秒`
    : null;

  const time = new Date(activity.startedAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Card className="border-zinc-800 hover:border-zinc-700/80 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", colors.bg)}>
            <Icon className={cn("h-4.5 w-4.5", colors.text)} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{activity.description}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  activity.status === "completed" ? "success"
                    : activity.status === "failed" ? "destructive"
                      : activity.status === "running" ? "warning"
                        : "outline"
                }
                className="text-[10px] px-1.5 py-0"
              >
                {style.label}
              </Badge>
              {duration && (
                <span className="text-[10px] text-muted-foreground">{duration}</span>
              )}
              {activity.method && (
                <span className="text-[10px] text-muted-foreground">{activity.method}</span>
              )}
            </div>
          </div>

          {/* Tags + time */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{time}</span>
            <div className="flex gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "text-[9px] font-semibold px-1.5 py-0.5 rounded",
                    tag === "SERP"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-purple-500/15 text-purple-400",
                  )}
                >
                  {tag} ↑
                </span>
              ))}
            </div>
          </div>

          {/* Expand */}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-zinc-800/50 mt-0">
          {/* Error */}
          {activity.error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-md p-2.5 border border-red-500/20 mt-3">
              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{activity.error}</span>
            </div>
          )}

          {/* Metrics */}
          {activity.metrics && Object.keys(activity.metrics).length > 0 && (
            <div className="flex gap-3 flex-wrap mt-3">
              {Object.entries(activity.metrics).map(([key, value]) => (
                <div key={key} className="text-xs bg-zinc-800/50 rounded-md px-2.5 py-1 border border-zinc-700/50">
                  <span className="text-muted-foreground">{key}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Artifacts */}
          {activity.artifacts.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                生成コンテンツ
              </p>
              {activity.artifacts.map((art, i) => (
                <div
                  key={i}
                  className="rounded-md border border-zinc-700/50 bg-zinc-900/50 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30 border-b border-zinc-700/50">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{art.title}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">
                      {art.type}
                    </Badge>
                  </div>
                  <div className="p-3 max-h-48 overflow-auto">
                    {art.type === "screenshot" ? (
                      <img
                        src={`data:image/png;base64,${art.content}`}
                        alt={art.title}
                        className="max-w-full h-auto rounded"
                      />
                    ) : art.type === "url" ? (
                      <a
                        href={art.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline break-all"
                      >
                        {art.content}
                      </a>
                    ) : (
                      <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                        {art.content.length > 2000
                          ? art.content.slice(0, 2000) + "\n... (truncated)"
                          : art.content}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          {activity.details && Object.keys(activity.details).length > 0 && (
            <details className="group mt-3">
              <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-zinc-300 transition-colors">
                詳細データを表示
              </summary>
              <pre className="mt-2 text-[10px] text-zinc-400 bg-zinc-900/50 rounded-md p-2.5 border border-zinc-700/50 overflow-auto max-h-40">
                {JSON.stringify(activity.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 6 Core Phases — map engine activity types to the 6 features
// ---------------------------------------------------------------------------

interface Phase {
  id: string;
  name: string;
  icon: typeof Search;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  matchType: (type: string, method: string) => boolean;
  metricTag?: "SERP" | "LLM" | "BOTH";
}

const PHASES: Phase[] = [
  {
    id: "keyword",
    name: "キーワード自動発掘",
    icon: Search,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    description: "Google検索からキーワードを自動収集",
    matchType: (t) => t.includes("keyword") || t.includes("trend") || t.includes("topic"),
    metricTag: "SERP",
  },
  {
    id: "content",
    name: "コンテンツ自動生成",
    icon: PenTool,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description: "SEO記事・FAQ・Schema.orgを自動生成",
    matchType: (t) => t.includes("content") || t.includes("schema"),
    metricTag: "BOTH",
  },
  {
    id: "distribution",
    name: "分散型プレゼンス配信",
    icon: Rss,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    description: "25+チャネルへ自動配信",
    matchType: (t) => t.includes("distribut") || t.includes("publish"),
    metricTag: "BOTH",
  },
  {
    id: "llm",
    name: "LLM引用モニタリング",
    icon: MessageSquare,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    description: "ChatGPT・Gemini等でのブランド引用を追跡",
    matchType: (t) => t.includes("llm"),
    metricTag: "LLM",
  },
  {
    id: "serp",
    name: "SERP順位追跡 & 戦略調整",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    description: "検索順位を追跡し、AIが戦略を自動調整",
    matchType: (t) => t.includes("serp") || t.includes("strateg"),
    metricTag: "SERP",
  },
  {
    id: "report",
    name: "レポート & 分析",
    icon: FileText,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    description: "実行結果の集計とレポート生成",
    matchType: (t) => t.includes("report") || t.includes("monitor"),
  },
];

function classifyActivity(a: ActivityItem): string {
  const t = a.type.toLowerCase();
  const m = a.method.toLowerCase();
  for (const phase of PHASES) {
    if (phase.matchType(t, m)) return phase.id;
  }
  // Fallback: content_generation → content
  if (t.includes("generation")) return "content";
  return "content"; // default
}

// ---------------------------------------------------------------------------
// Selected Hour's Task Panel — grouped by 6 phases
// ---------------------------------------------------------------------------

function HourTaskPanel({
  selectedHour,
  activities,
  loading,
  hourBucket,
}: {
  selectedHour: number;
  activities: ActivityItem[];
  loading: boolean;
  hourBucket?: HourBucket;
}) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(PHASES.map((p) => p.id)));

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activities.filter((a) => {
      const d = new Date(a.startedAt);
      return d.toISOString().slice(0, 10) === today && d.getHours() === selectedHour;
    });
  }, [activities, selectedHour]);

  // Group by phase
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const phase of PHASES) map.set(phase.id, []);
    for (const a of filtered) {
      const phaseId = classifyActivity(a);
      const list = map.get(phaseId);
      if (list) list.push(a);
    }
    return map;
  }, [filtered]);

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hourStr = String(selectedHour).padStart(2, "0");

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-medium">
          {hourStr}:00 〜 {hourStr}:59 のサイクル
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {hourBucket?.total ?? filtered.length}件のタスク
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
            {hourBucket && hourBucket.total > 0 ? (
              <>
                <p className="text-sm text-foreground">
                  この時間帯は <span className="font-semibold">{hourBucket.total}</span> 件のタスクを実行しました
                </p>
                <p className="mt-1 text-xs">{hourSummary(hourBucket)}</p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed opacity-80">
                  個別タスクの詳細ログは直近の時間帯のみ表示されます。過去の集計はこの件数でご確認ください。
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">この時間帯はまだ実行されていません</p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed">
                  エンジンは毎時、巡回・レポートを自動実行し、記事生成（1日数回）と順位・AI引用チェック（1日1回）を集中実行します。上のタイムラインで稼働済みの時間帯を選ぶと内容を確認できます。
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {PHASES.map((phase, idx) => {
            const phaseTasks = grouped.get(phase.id) ?? [];
            const completed = phaseTasks.filter((t) => t.status === "completed").length;
            const failed = phaseTasks.filter((t) => t.status === "failed").length;
            const isExpanded = expandedPhases.has(phase.id);
            const Icon = phase.icon;

            return (
              <Card
                key={phase.id}
                className={cn(
                  "border transition-all",
                  phaseTasks.length > 0 ? phase.borderColor : "border-zinc-800/50 opacity-50",
                )}
              >
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-800/30 transition-colors rounded-t-lg"
                >
                  {/* Step number */}
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    phaseTasks.length > 0 ? phase.bgColor : "bg-zinc-800",
                    phaseTasks.length > 0 ? phase.color : "text-zinc-500",
                  )}>
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <Icon className={cn("h-4 w-4 shrink-0", phaseTasks.length > 0 ? phase.color : "text-zinc-600")} />

                  {/* Name & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", phaseTasks.length > 0 ? "text-zinc-100" : "text-zinc-500")}>
                        {phase.name}
                      </span>
                      {phase.metricTag && phaseTasks.length > 0 && (
                        <>
                          {(phase.metricTag === "SERP" || phase.metricTag === "BOTH") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">SERP ↑</span>
                          )}
                          {(phase.metricTag === "LLM" || phase.metricTag === "BOTH") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">LLM ↑</span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">{phase.description}</p>
                  </div>

                  {/* Status summary */}
                  <div className="flex items-center gap-2 shrink-0">
                    {phaseTasks.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        {completed > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />{completed}
                          </span>
                        )}
                        {failed > 0 && (
                          <span className="flex items-center gap-0.5 text-red-400">
                            <XCircle className="h-3 w-3" />{failed}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-600">—</span>
                    )}
                    {phaseTasks.length > 0 && (
                      isExpanded
                        ? <ChevronDown className="h-4 w-4 text-zinc-500" />
                        : <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Expanded task list */}
                {isExpanded && phaseTasks.length > 0 && (
                  <div className="border-t border-zinc-800/50">
                    {phaseTasks.map((a) => (
                      <TaskCard key={a.id} activity={a} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Content Generation Stats (Compact)
// ---------------------------------------------------------------------------

function ContentStats({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  const count = data?.summary.articlesGenerated ?? 0;

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-950">
          <PenTool className="h-4 w-4 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">本日のコンテンツ生成</p>
          <p className="text-xl font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : `${count}件`}
          </p>
        </div>
        {data && data.contentTrend.length > 0 && (
          <div className="text-xs text-muted-foreground text-right">
            <span className="text-green-400 font-medium">
              {data.contentTrend.reduce((s, d) => s + d.totalWords, 0).toLocaleString()}
            </span>
            <span className="ml-1">語 生成済み</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [hourly, setHourly] = useState<HourBucket[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(() => jstNowHM().hour);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(`/api/engine/analytics?projectId=${projectId}&days=7`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setAnalytics(await res.json());
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [projectId]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await fetch(`/api/engine/activities?projectId=${projectId}&limit=200`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setActivities(json.activities ?? []);
    } catch (err) {
      setActivitiesError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setActivitiesLoading(false);
    }
  }, [projectId]);

  // Fetch full-day hourly schedule (DB-backed → 1日分すべての時間帯を正確に取得)
  const fetchHourly = useCallback(async () => {
    setHourlyLoading(true);
    try {
      const res = await fetch(`/api/engine/activities/hourly?projectId=${projectId}`);
      const json = res.ok ? await res.json() : null;
      setHourly(Array.isArray(json?.hours) ? json.hours : []);
    } catch {
      setHourly([]);
    } finally {
      setHourlyLoading(false);
    }
  }, [projectId]);

  // Initial load only — manual refresh via button
  useEffect(() => {
    fetchAnalytics();
    fetchActivities();
    fetchHourly();
    setLastRefresh(new Date());
  }, [fetchAnalytics, fetchActivities, fetchHourly]);

  // プロジェクトをエンジンに自動登録（未起動なら起動＝即サイクル実行・冪等）。
  // ダッシュボードを開いた瞬間にエンジンが動き出すようにする。
  useEffect(() => {
    fetch(`/api/projects/${projectId}/engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
  }, [projectId]);

  const handleRefresh = () => {
    fetchAnalytics();
    fetchActivities();
    fetchHourly();
    setLastRefresh(new Date());
  };

  // Count failed tasks for alert
  const failedActivities = useMemo(
    () => activities.filter((a) => a.status === "failed"),
    [activities],
  );
  const hasCreditError = useMemo(
    () => failedActivities.some((a) => isCreditError(a.error)),
    [failedActivities],
  );

  return (
    <div className="min-w-0 space-y-6">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ダッシュボード</h2>
          <p className="text-sm text-muted-foreground mt-1">
            リアルタイムのエンジン稼働状況
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-muted-foreground">
              最終更新: {lastRefresh.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <a
            href={`/companies/${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 transition-opacity"
          >
            <Globe className="h-3 w-3" />
            公開Hubを見る
          </a>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            更新
          </button>
        </div>
      </div>

      {/* Exposure destinations summary (Hub / WordPress / GBP / communities + counts) */}
      <ExposureSummary projectId={projectId} />

      {/* Error alerts */}
      {analyticsError && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>アナリティクス取得エラー: {analyticsError}</span>
            <span className="text-xs text-amber-500/60 ml-auto">エンジンサーバーが起動しているか確認してください</span>
          </CardContent>
        </Card>
      )}

      {failedActivities.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-red-400">
                  {failedActivities.length}件のタスクが失敗しました
                </p>
                {hasCreditError && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-300">
                    <span className="font-semibold">AI（Anthropic）のクレジット残高が不足しています。</span>
                    AnthropicのコンソールでPro/従量課金のクレジットを補充すると、記事生成や分析タスクが再開します（補充後は自動で再試行されます）。
                  </div>
                )}
                {failedActivities.slice(0, 3).map((a) => (
                  <div key={a.id} className="min-w-0 break-words text-xs text-red-300/80">
                    <span className="mr-2 text-red-400/60">
                      {new Date(a.startedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {a.description}
                    {a.error && (
                      <span className="ml-2 text-red-500/70">— {friendlyError(a.error)}</span>
                    )}
                  </div>
                ))}
                {failedActivities.length > 3 && (
                  <p className="text-[10px] text-red-400/50">他 {failedActivities.length - 3}件</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Hero Metric Cards */}
      <HeroMetrics data={analytics} loading={analyticsLoading} />

      {/* 3. 24-Hour Schedule Timeline */}
      <ScheduleTimeline
        hours={hourly}
        selectedHour={selectedHour}
        onSelectHour={setSelectedHour}
        loading={hourlyLoading}
      />

      {/* 3b. Past log + recurring TODO agenda (+ tracked SERP keywords) */}
      <EngineAgenda projectId={projectId} hours={hourly} />

      {/* 4. Selected Hour's Tasks */}
      <HourTaskPanel
        selectedHour={selectedHour}
        activities={activities}
        loading={activitiesLoading}
        hourBucket={hourly[selectedHour]}
      />

      {/* 5. Presence trends — stock-chart style (day/month/year + slider) */}
      <PresenceTrends projectId={projectId} />

      {/* 6. Content Generation Stats */}
      <ContentStats data={analytics} loading={analyticsLoading} />
    </div>
  );
}
