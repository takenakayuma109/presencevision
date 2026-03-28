"use client";

import { useStore, availableCountries } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import {
  BarChart3, TrendingUp, FileText, Eye, Zap, Activity, ChevronRight,
  Globe, Clock, Repeat, TrendingDown, MessageSquare, PenTool,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation, useLabels } from "@/lib/hooks/use-translation";
import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Analytics types
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

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16",
];

// ---------------------------------------------------------------------------
// Analytics Dashboard Component
// ---------------------------------------------------------------------------
function AnalyticsDashboard({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/engine/analytics?projectId=${projectId}&days=${days}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [projectId, days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">アナリティクスを読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">データ取得エラー: {error}</p>
          <p className="text-xs mt-1">エンジンサーバーが起動しているか確認してください</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, serpTrend, llmTrend, contentTrend } = data;

  // Build SERP chart data: merge all keywords by date
  const serpKeywords = Object.keys(serpTrend);
  const serpDates = new Set<string>();
  for (const kw of serpKeywords) {
    for (const pt of serpTrend[kw]) serpDates.add(pt.date);
  }
  const serpChartData = Array.from(serpDates).sort().map((date) => {
    const row: Record<string, unknown> = { date: date.slice(5) }; // MM-DD format
    for (const kw of serpKeywords) {
      const pt = serpTrend[kw].find((p) => p.date === date);
      if (pt) row[kw] = pt.position;
    }
    return row;
  });

  // Build LLM chart data: mention rate per date per platform
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

  // Content chart data
  const contentChartData = contentTrend.map((pt) => ({
    date: pt.date.slice(5),
    count: pt.count,
    words: pt.totalWords,
  }));

  const hasData = serpChartData.length > 0 || llmChartData.length > 0 || contentChartData.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{projectName}</h3>
        <div className="flex gap-1">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md transition-colors",
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {d}日
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {summary.avgPosition != null ? `${summary.avgPosition}位` : "---"}
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
                {summary.llmMentionRate != null ? `${summary.llmMentionRate}%` : "---"}
              </p>
              <p className="text-xs text-muted-foreground">LLM言及率</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
              <PenTool className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{summary.articlesGenerated}</p>
              <p className="text-xs text-muted-foreground">記事生成数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{summary.activeChannels}</p>
              <p className="text-xs text-muted-foreground">アクティブチャネル</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">まだデータがありません</p>
            <p className="text-xs mt-1">エンジンを稼働させるとここにトレンドが表示されます</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* SERP Position Trend */}
          {serpChartData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                  検索順位トレンド
                  <span className="text-xs text-muted-foreground font-normal">（低いほど良い）</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={serpChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      reversed
                      domain={[1, "auto"]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                      label={{ value: "順位", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value) => [`${value}位`, ""]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    {serpKeywords.slice(0, 8).map((kw, i) => (
                      <Line
                        key={kw}
                        type="monotone"
                        dataKey={kw}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* LLM Mention Rate */}
          {llmChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  LLM言及率
                  <span className="text-xs text-muted-foreground font-normal">（%）</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={llmChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                      label={{ value: "%", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--foreground))",
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
          )}

          {/* Content Generation */}
          {contentChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-green-500" />
                  コンテンツ生成数
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={contentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value, name) => [
                        value,
                        name === "count" ? "記事数" : "文字数",
                      ]}
                    />
                    <Bar dataKey="count" fill="#10b981" name="記事数" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Reports Page
// ---------------------------------------------------------------------------

const statusBg: Record<string, string> = {
  active: "bg-green-500", paused: "bg-yellow-500", completed: "bg-blue-500",
};

export default function ReportsPage() {
  const { projects } = useStore();
  const { t } = useTranslation();
  const { statusLabels, methodLabels, durationLabels } = useLabels();

  // Aggregate stats across all projects
  const totalTasks = projects.reduce((s, p) => s + p.plan.tasks.length, 0);
  const totalExecutions = projects.reduce(
    (s, p) => s + p.plan.tasks.reduce((s2, t) => s2 + t.executions.length, 0),
    0,
  );
  const totalReports = projects.reduce((s, p) => s + p.reports.length, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("reports.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("reports.subtitle")}</p>
      </div>

      {/* Global stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Activity, label: t("reports.activeProjects"), value: `${activeProjects}/${projects.length}`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" },
          { icon: Repeat, label: t("reports.totalExecutions"), value: String(totalExecutions), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950" },
          { icon: BarChart3, label: t("reports.taskCount"), value: String(totalTasks), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
          { icon: FileText, label: t("reports.reportCount"), value: String(totalReports), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Dashboard per project */}
      {projects.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            アナリティクス
          </h3>
          {projects.map((project) => (
            <AnalyticsDashboard
              key={project.id}
              projectId={project.id}
              projectName={project.name}
            />
          ))}
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">{t("reports.noProjects")}</h3>
          <p className="text-sm text-muted-foreground">{t("reports.noProjectsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("reports.projectList")}</h3>
          {projects.map((project) => {
            const runningTasks = project.plan.tasks.filter((t) => t.status === "running").length;
            const totalCycles = project.plan.tasks.reduce((s, t) => s + t.cycleCount, 0);
            const projectExecutions = project.plan.tasks.reduce((s, t) => s + t.executions.length, 0);
            const latestReport = project.reports[0] ?? null;
            const getCountry = (code: string) => availableCountries.find((c) => c.code === code);

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer">
                  <CardContent className="p-5 space-y-4">
                    {/* Project header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {project.siteInfo.favicon && (
                          <img src={project.siteInfo.favicon} alt="" className="h-6 w-6 rounded" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold">{project.name}</h4>
                            <Badge variant={project.status === "active" ? "success" : project.status === "paused" ? "secondary" : "info"}>
                              {statusLabels[project.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{project.url}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-green-500" />
                        <div>
                          <p className="text-sm font-bold">{runningTasks}/{project.plan.tasks.length}</p>
                          <p className="text-[10px] text-muted-foreground">{t("reports.activeTasks")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-3.5 w-3.5 text-purple-500" />
                        <div>
                          <p className="text-sm font-bold">{projectExecutions}</p>
                          <p className="text-[10px] text-muted-foreground">{t("reports.executionCount")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <div>
                          <p className="text-sm font-bold">{durationLabels[project.duration] ?? project.duration}</p>
                          <p className="text-[10px] text-muted-foreground">{t("reports.period")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <div>
                          <p className="text-sm font-bold">{project.reports.length}</p>
                          <p className="text-[10px] text-muted-foreground">{t("reports.report")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Methods & Countries */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.methods.map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px]">{methodLabels[m]}</Badge>
                      ))}
                      <span className="text-muted-foreground mx-1">|</span>
                      {project.presenceCountries.map((c) => {
                        const cc = getCountry(c);
                        return (
                          <Badge key={c} variant="info" className="text-[10px] gap-0.5">
                            {cc?.flag} {cc?.name}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Latest report preview */}
                    {latestReport && (
                      <div className="rounded-lg bg-muted/30 border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{latestReport.title}</p>
                          <Badge variant={latestReport.type === "morning" ? "info" : "secondary"} className="text-[10px]">
                            {latestReport.type === "morning" ? t("reports.morning") : t("reports.evening")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{latestReport.summary}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3 text-blue-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.visibilityScore}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("reports.visibility")}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">{latestReport.metrics.contentGenerated}</p>
                            <p className="text-[10px] text-muted-foreground">{t("reports.generated")}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-3 w-3 text-purple-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.mentionsFound}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("reports.mentions")}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.llmCitations}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("reports.llmCitations")}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{latestReport.date.toLocaleString("ja-JP")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
