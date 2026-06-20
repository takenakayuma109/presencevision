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
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";

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

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16",
];

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

function ScheduleTimeline({
  selectedHour,
  onSelectHour,
  activities,
}: {
  selectedHour: number;
  onSelectHour: (h: number) => void;
  activities: ActivityItem[];
}) {
  const now = new Date();
  const currentHour = now.getHours();

  // Compute which hours have activity
  const hoursWithActivity = useMemo(() => {
    const set = new Set<number>();
    const today = new Date().toISOString().slice(0, 10);
    for (const a of activities) {
      const d = new Date(a.startedAt);
      if (d.toISOString().slice(0, 10) === today) {
        set.add(d.getHours());
      }
    }
    return set;
  }, [activities]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          本日のスケジュール
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            1時間サイクル
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Timeline blocks */}
        <div className="relative">
          <div className="flex gap-px">
            {hours.map((h) => {
              const isPast = h < currentHour;
              const isCurrent = h === currentHour;
              const isFuture = h > currentHour;
              const isSelected = h === selectedHour;
              const hasActivity = hoursWithActivity.has(h);

              return (
                <button
                  key={h}
                  onClick={() => onSelectHour(h)}
                  className="flex-1 group relative focus:outline-none"
                  aria-label={`${String(h).padStart(2, "0")}:00`}
                >
                  <div
                    className={cn(
                      "h-9 rounded-sm transition-all cursor-pointer",
                      isPast && "bg-emerald-500/30 border border-emerald-500/40",
                      isCurrent && "bg-amber-500/40 border border-amber-400/60 animate-pulse",
                      isFuture && "bg-zinc-800 border border-zinc-700/50",
                      isSelected && "ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-950",
                      !isSelected && "hover:brightness-125",
                    )}
                  >
                    {/* Dot indicator for hours with tasks */}
                    {hasActivity && isPast && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {String(h).padStart(2, "0")}:00 — {isPast ? "完了" : isCurrent ? "実行中" : "予定"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hour labels */}
          <div className="flex mt-2 relative h-4">
            {[0, 6, 12, 18, 23].map((h) => (
              <div
                key={h}
                className="text-[10px] text-muted-foreground absolute"
                style={{
                  left: `${(h / 23) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
            完了
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/40 border border-amber-400/60" />
            実行中
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-800 border border-zinc-700/50" />
            予定
          </div>
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
}: {
  selectedHour: number;
  activities: ActivityItem[];
  loading: boolean;
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
          {filtered.length}件のタスク
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">このサイクルのタスクはありません</p>
            <p className="text-xs mt-1">エンジンが実行されるとここにタスクが表示されます</p>
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
// SERP Chart
// ---------------------------------------------------------------------------

function SerpChart({ data }: { data: AnalyticsData }) {
  const serpKeywords = Object.keys(data.serpTrend);
  if (serpKeywords.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-blue-400" />
            SERP順位推移
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
            <Search className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">まだSERPデータがありません</p>
            <p className="text-xs mt-1">SERP確認タスクが実行されるとデータが表示されます</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const serpDates = new Set<string>();
  for (const kw of serpKeywords) {
    for (const pt of data.serpTrend[kw]) serpDates.add(pt.date);
  }
  const chartData = Array.from(serpDates).sort().map((date) => {
    const row: Record<string, unknown> = { date: date.slice(5) };
    for (const kw of serpKeywords) {
      const pt = data.serpTrend[kw].find((p) => p.date === date);
      if (pt) row[kw] = pt.position;
    }
    return row;
  });

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-blue-400" />
          SERP順位推移
          <span className="text-xs text-muted-foreground font-normal">（低いほど良い）</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="8%">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              stroke="#27272a"
            />
            <YAxis
              reversed
              domain={[1, "auto"]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              stroke="#27272a"
              label={{ value: "順位", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#a1a1aa" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: 12,
                color: "#fafafa",
              }}
              formatter={(value) => [`${value}位`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {serpKeywords.slice(0, 8).map((kw, i) => (
              <Bar
                key={kw}
                dataKey={kw}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[2, 2, 0, 0]}
                opacity={0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LLM Chart
// ---------------------------------------------------------------------------

function LlmChart({ data }: { data: AnalyticsData }) {
  const llmPlatforms = Object.keys(data.llmTrend);

  // Build chart data even if platforms exist
  const llmDates = new Set<string>();
  for (const p of llmPlatforms) {
    for (const pt of data.llmTrend[p]) llmDates.add(pt.date);
  }
  const chartData = Array.from(llmDates).sort().map((date) => {
    const row: Record<string, unknown> = { date: date.slice(5) };
    for (const p of llmPlatforms) {
      const pt = data.llmTrend[p].find((x) => x.date === date);
      if (pt && pt.total > 0) {
        row[p] = Math.round((pt.mentioned / pt.total) * 100);
      } else {
        row[p] = 0;
      }
    }
    return row;
  });

  const allZero =
    llmPlatforms.length === 0 ||
    chartData.length === 0 ||
    chartData.every((row) => llmPlatforms.every((p) => (row[p] as number) === 0));

  if (allZero) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            LLM引用推移
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">まだ引用データがありません</p>
            <p className="text-xs mt-1">LLM引用チェックが実行されるとデータが表示されます</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-400" />
          LLM引用推移
          <span className="text-xs text-muted-foreground font-normal">（言及率 %）</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="8%">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              stroke="#27272a"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              stroke="#27272a"
              label={{ value: "%", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#a1a1aa" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: 12,
                color: "#fafafa",
              }}
              formatter={(value) => [`${value}%`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {llmPlatforms.slice(0, 8).map((p, i) => (
              <Bar
                key={p}
                dataKey={p}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

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

  // Initial load only — manual refresh via button
  useEffect(() => {
    fetchAnalytics();
    fetchActivities();
    setLastRefresh(new Date());
  }, [fetchAnalytics, fetchActivities]);

  const handleRefresh = () => {
    fetchAnalytics();
    fetchActivities();
    setLastRefresh(new Date());
  };

  // Count failed tasks for alert
  const failedActivities = useMemo(
    () => activities.filter((a) => a.status === "failed"),
    [activities],
  );

  return (
    <div className="space-y-6">
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
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            更新
          </button>
        </div>
      </div>

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
              <div className="space-y-2 flex-1 min-w-0">
                <p className="text-sm font-medium text-red-400">
                  {failedActivities.length}件のタスクが失敗しました
                </p>
                {failedActivities.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-xs text-red-300/80 truncate">
                    <span className="text-red-400/60 mr-2">
                      {new Date(a.startedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {a.description}
                    {a.error && <span className="text-red-500/60 ml-2">— {a.error}</span>}
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
        selectedHour={selectedHour}
        onSelectHour={setSelectedHour}
        activities={activities}
      />

      {/* 4. Selected Hour's Tasks */}
      <HourTaskPanel
        selectedHour={selectedHour}
        activities={activities}
        loading={activitiesLoading}
      />

      {/* 5. Charts Side by Side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {analytics && <SerpChart data={analytics} />}
        {analytics && <LlmChart data={analytics} />}
        {!analytics && !analyticsLoading && (
          <>
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <TrendingDown className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">まだトレンドデータがありません</p>
                <p className="text-xs mt-1">エンジンを稼働させるとトレンドが表示されます</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">まだ引用データがありません</p>
                <p className="text-xs mt-1">LLM引用チェックが実行されるとデータが表示されます</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 6. Content Generation Stats */}
      <ContentStats data={analytics} loading={analyticsLoading} />
    </div>
  );
}
