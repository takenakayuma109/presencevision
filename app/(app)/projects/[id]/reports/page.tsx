"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import {
  BarChart3, TrendingDown, MessageSquare, PenTool, Globe, Activity,
  FileText, Download, ChevronLeft, Clock, CheckCircle2, AlertTriangle,
  ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";

// Hardcoded dark-theme colors for Recharts SSR compatibility
const DARK = {
  border: "#27272a",
  card: "#18181b",
  foreground: "#fafafa",
  mutedForeground: "#a1a1aa",
  grid: "#27272a",
} as const;

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

interface EngineActivity {
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
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16",
];

type SortField = "startedAt" | "type" | "status" | "durationMs";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(ms?: number): string {
  if (ms == null) return "---";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const statusIcon: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  failed: AlertTriangle,
  running: Activity,
  skipped: Clock,
};
const statusColor: Record<string, string> = {
  completed: "text-green-500",
  failed: "text-red-500",
  running: "text-blue-500 animate-spin",
  skipped: "text-muted-foreground",
};
const statusLabel: Record<string, string> = {
  completed: "完了",
  failed: "失敗",
  running: "実行中",
  skipped: "スキップ",
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ProjectReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  // Fetch project name from API (not from store which may be empty)
  const [projectName, setProjectName] = useState<string>("");
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.name) setProjectName(data.name); })
      .catch(() => {});
  }, [projectId]);

  // Period state
  const [days, setDays] = useState(30);
  const [customRange, setCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activities, setActivities] = useState<EngineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table sort/pagination
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Print ref
  const reportRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Fetch analytics
  // -------------------------------------------------------------------------
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/engine/analytics?projectId=${projectId}&days=${days}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setAnalytics(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [projectId, days]);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/engine/activities?projectId=${projectId}&limit=500`);
      if (res.ok) {
        const json = await res.json();
        setActivities(json.activities ?? json ?? []);
      }
    } catch {
      // Activities are optional — engine may be offline
    } finally {
      setActivitiesLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // -------------------------------------------------------------------------
  // Chart data
  // -------------------------------------------------------------------------
  const { serpChartData, serpKeywords, llmChartData, llmPlatforms, contentChartData, llmAllZero } = useMemo(() => {
    if (!analytics) return { serpChartData: [], serpKeywords: [] as string[], llmChartData: [], llmPlatforms: [] as string[], contentChartData: [], llmAllZero: true };

    const { serpTrend, llmTrend, contentTrend } = analytics;

    // SERP
    const serpKeywords = Object.keys(serpTrend);
    const serpDates = new Set<string>();
    for (const kw of serpKeywords) {
      for (const pt of serpTrend[kw]) serpDates.add(pt.date);
    }
    const serpChartData = Array.from(serpDates).sort().map((date) => {
      const row: Record<string, unknown> = { date: date.slice(5) };
      for (const kw of serpKeywords) {
        const pt = serpTrend[kw].find((p) => p.date === date);
        if (pt) row[kw] = pt.position;
      }
      return row;
    });

    // LLM
    const llmPlatforms = Object.keys(llmTrend);
    const llmDates = new Set<string>();
    for (const p of llmPlatforms) {
      for (const pt of llmTrend[p]) llmDates.add(pt.date);
    }
    const llmChartData = Array.from(llmDates).sort().map((date) => {
      const row: Record<string, unknown> = { date: date.slice(5) };
      for (const p of llmPlatforms) {
        const pt = llmTrend[p].find((x) => x.date === date);
        if (pt && pt.total > 0) {
          row[p] = Math.round((pt.mentioned / pt.total) * 100);
        } else {
          row[p] = 0;
        }
      }
      return row;
    });

    // Content
    const contentChartData = contentTrend.map((pt) => ({
      date: pt.date.slice(5),
      count: pt.count,
      words: pt.totalWords,
    }));

    // Check if all LLM values are 0
    const llmAllZero = llmChartData.every((row) =>
      llmPlatforms.every((p) => (row[p] as number) === 0),
    );

    return { serpChartData, serpKeywords, llmChartData, llmPlatforms, contentChartData, llmAllZero };
  }, [analytics]);

  // -------------------------------------------------------------------------
  // Sorted / paginated activities
  // -------------------------------------------------------------------------
  const sortedActivities = useMemo(() => {
    const sorted = [...activities].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "startedAt":
          cmp = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "durationMs":
          cmp = (a.durationMs ?? 0) - (b.durationMs ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [activities, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedActivities.length / ITEMS_PER_PAGE));
  const pagedActivities = sortedActivities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  // -------------------------------------------------------------------------
  // Period summary text
  // -------------------------------------------------------------------------
  const periodSummary = useMemo(() => {
    if (!analytics) return null;
    const { summary } = analytics;
    const lines: string[] = [];
    lines.push(`この期間で${summary.articlesGenerated}件の記事を生成しました。`);
    if (summary.avgPosition != null) {
      lines.push(`平均検索順位は${summary.avgPosition}位です。`);
    }
    if (summary.llmMentionRate != null) {
      lines.push(`LLM引用率は${summary.llmMentionRate}%です（${summary.llmMentionedCount}/${summary.llmTotalChecks}件）。`);
    }
    lines.push(`アクティブチャネル数: ${summary.activeChannels}チャネル`);

    const completed = activities.filter((a) => a.status === "completed").length;
    const failed = activities.filter((a) => a.status === "failed").length;
    if (activities.length > 0) {
      lines.push(`エンジン実行: ${activities.length}件（成功: ${completed}件, 失敗: ${failed}件）`);
    }

    return lines;
  }, [analytics, activities]);

  // -------------------------------------------------------------------------
  // PDF Export
  // -------------------------------------------------------------------------
  const handleExportPdf = () => {
    window.print();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const displayName = projectName || "レポート";

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #report-printable, #report-printable * { visibility: visible; }
          #report-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 1cm; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <Link href={`/projects/${projectId}`}>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              プロジェクトへ戻る
            </button>
          </Link>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDFとしてエクスポート
          </button>
        </div>

        <div id="report-printable" ref={reportRef} className="space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold">{displayName} レポート</h2>
            <p className="text-sm text-muted-foreground mt-1">
              パフォーマンスレポートと期間分析
            </p>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => { setDays(d); setCustomRange(false); }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  !customRange && days === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                {d}日
              </button>
            ))}
            <button
              onClick={() => setCustomRange(!customRange)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                customRange
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              カスタム
            </button>
            {customRange && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-sm rounded-md border bg-background"
                />
                <span className="text-muted-foreground text-sm">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-sm rounded-md border bg-background"
                />
              </div>
            )}
          </div>

          {/* Period badge for print */}
          <div className="hidden print:block text-sm text-muted-foreground">
            期間: 過去{days}日間 | 生成日: {new Date().toLocaleDateString("ja-JP")}
          </div>

          {/* Loading */}
          {loading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">レポートを読み込み中...</p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && !loading && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="text-sm">データ取得エラー: {error}</p>
                <p className="text-xs mt-1">エンジンサーバーが起動しているか確認してください</p>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          {!loading && analytics && (
            <>
              {/* Summary KPI Cards */}
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                      <PenTool className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{analytics.summary.articlesGenerated}</p>
                      <p className="text-xs text-muted-foreground">総記事生成数</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {analytics.summary.avgPosition != null ? `${analytics.summary.avgPosition}位` : "---"}
                      </p>
                      <p className="text-xs text-muted-foreground">平均検索順位</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {analytics.summary.llmMentionRate != null ? `${analytics.summary.llmMentionRate}%` : "---"}
                      </p>
                      <p className="text-xs text-muted-foreground">LLM言及率</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                      <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{analytics.summary.activeChannels}</p>
                      <p className="text-xs text-muted-foreground">アクティブチャネル数</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {(serpChartData.length > 0 || llmChartData.length > 0 || contentChartData.length > 0) ? (
                <div className="grid gap-4">
                  {/* SERP Position Trend — 株価風バーチャート */}
                  {serpChartData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-blue-500" />
                          SERP順位追跡
                          <span className="text-xs text-muted-foreground font-normal">(低いほど良い — 1位が最高)</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={serpChartData} barCategoryGap="8%">
                            <CartesianGrid strokeDasharray="3 3" stroke={DARK.grid} />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                              stroke={DARK.border}
                            />
                            <YAxis
                              reversed
                              domain={[1, "auto"]}
                              tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                              stroke={DARK.border}
                              label={{ value: "順位", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: DARK.mutedForeground } }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: DARK.card,
                                border: `1px solid ${DARK.border}`,
                                borderRadius: "8px",
                                fontSize: 12,
                                color: DARK.foreground,
                              }}
                              formatter={(value) => [`${value}位`, ""]}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, color: DARK.mutedForeground }} />
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
                  )}

                  {/* LLM Citation Monitoring — 株価風バーチャート */}
                  {llmChartData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-500" />
                          LLM引用モニタリング
                          <span className="text-xs text-muted-foreground font-normal">(言及率 %)</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {llmAllZero ? (
                          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
                            <p className="text-sm font-medium">まだデータがありません</p>
                            <p className="text-xs mt-1">LLMモニタリングが実行されると結果が表示されます</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={llmChartData} barCategoryGap="8%">
                              <CartesianGrid strokeDasharray="3 3" stroke={DARK.grid} />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                                stroke={DARK.border}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                                stroke={DARK.border}
                                label={{ value: "%", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: DARK.mutedForeground } }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: DARK.card,
                                  border: `1px solid ${DARK.border}`,
                                  borderRadius: "8px",
                                  fontSize: 12,
                                  color: DARK.foreground,
                                }}
                                formatter={(value) => [`${value}%`, ""]}
                              />
                              <Legend wrapperStyle={{ fontSize: 11, color: DARK.mutedForeground }} />
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
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Content Generation History */}
                  {contentChartData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <PenTool className="h-4 w-4 text-emerald-500" />
                          コンテンツ生成履歴
                          <span className="text-xs text-muted-foreground font-normal">(日別)</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={contentChartData}>
                            <defs>
                              <linearGradient id="contentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={DARK.grid} />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                              stroke={DARK.border}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: DARK.mutedForeground }}
                              stroke={DARK.border}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: DARK.card,
                                border: `1px solid ${DARK.border}`,
                                borderRadius: "8px",
                                fontSize: 12,
                                color: DARK.foreground,
                              }}
                              formatter={(value, name) => [
                                value,
                                name === "count" ? "記事数" : "文字数",
                              ]}
                            />
                            <Bar dataKey="count" fill="url(#contentGradient)" name="記事数" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-10 text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">まだチャートデータがありません</p>
                    <p className="text-xs mt-1">エンジンを稼働させるとここにトレンドが表示されます</p>
                  </CardContent>
                </Card>
              )}

              {/* Period Summary Report */}
              {periodSummary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      期間サマリー
                      <Badge variant="outline" className="text-[10px] font-normal">
                        過去{days}日間
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="rounded-lg bg-muted/30 border p-4 space-y-1.5">
                      {periodSummary.map((line, i) => (
                        <p key={i} className="text-sm text-foreground/90">{line}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Activity Log Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                アクティビティログ
                {activities.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {activities.length}件
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {activitiesLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Activity className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-xs">読み込み中...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">アクティビティがありません</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 pr-4">
                            <button
                              onClick={() => toggleSort("startedAt")}
                              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              日時
                              {sortField === "startedAt" ? (
                                sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </button>
                          </th>
                          <th className="pb-2 pr-4">
                            <button
                              onClick={() => toggleSort("type")}
                              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              タイプ
                              {sortField === "type" ? (
                                sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </button>
                          </th>
                          <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">説明</th>
                          <th className="pb-2 pr-4">
                            <button
                              onClick={() => toggleSort("status")}
                              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              ステータス
                              {sortField === "status" ? (
                                sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </button>
                          </th>
                          <th className="pb-2">
                            <button
                              onClick={() => toggleSort("durationMs")}
                              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              所要時間
                              {sortField === "durationMs" ? (
                                sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedActivities.map((act) => {
                          const Icon = statusIcon[act.status] ?? Activity;
                          return (
                            <tr key={act.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(act.startedAt)}
                              </td>
                              <td className="py-2 pr-4">
                                <Badge variant="outline" className="text-[10px]">{act.type}</Badge>
                              </td>
                              <td className="py-2 pr-4 text-xs max-w-[300px] truncate" title={act.description}>
                                {act.description}
                              </td>
                              <td className="py-2 pr-4">
                                <span className={cn("flex items-center gap-1 text-xs", statusColor[act.status])}>
                                  <Icon className="h-3 w-3" />
                                  {statusLabel[act.status] ?? act.status}
                                </span>
                              </td>
                              <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                                {formatDuration(act.durationMs)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 no-print">
                      <p className="text-xs text-muted-foreground">
                        {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, sortedActivities.length)} / {sortedActivities.length}件
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-2.5 py-1 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-40"
                        >
                          前へ
                        </button>
                        <span className="px-2.5 py-1 text-xs text-muted-foreground">
                          {page} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-2.5 py-1 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-40"
                        >
                          次へ
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
