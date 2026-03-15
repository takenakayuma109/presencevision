"use client";

import { useStore, statusLabels, methodLabels, durationLabels, availableCountries } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import {
  BarChart3, TrendingUp, FileText, Eye, Zap, Activity, ChevronRight,
  Globe, Clock, Repeat,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusBg: Record<string, string> = {
  active: "bg-green-500", paused: "bg-yellow-500", completed: "bg-blue-500",
};

export default function ReportsPage() {
  const { projects } = useStore();

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
        <h2 className="text-2xl font-bold">レポート</h2>
        <p className="text-sm text-muted-foreground mt-1">全プロジェクトの現状サマリーとレポート一覧</p>
      </div>

      {/* Global stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Activity, label: "稼働中プロジェクト", value: `${activeProjects}/${projects.length}`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" },
          { icon: Repeat, label: "総実行数", value: String(totalExecutions), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950" },
          { icon: BarChart3, label: "タスク数", value: String(totalTasks), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
          { icon: FileText, label: "レポート数", value: String(totalReports), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
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

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">プロジェクトはまだありません</h3>
          <p className="text-sm text-muted-foreground">プロジェクトを作成すると、ここにサマリーが表示されます。</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">プロジェクト一覧</h3>
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
                          <p className="text-[10px] text-muted-foreground">稼働タスク</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-3.5 w-3.5 text-purple-500" />
                        <div>
                          <p className="text-sm font-bold">{projectExecutions}</p>
                          <p className="text-[10px] text-muted-foreground">実行回数</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <div>
                          <p className="text-sm font-bold">{durationLabels[project.duration] ?? project.duration}</p>
                          <p className="text-[10px] text-muted-foreground">期間</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <div>
                          <p className="text-sm font-bold">{project.reports.length}</p>
                          <p className="text-[10px] text-muted-foreground">レポート</p>
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
                            {latestReport.type === "morning" ? "朝" : "夕"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{latestReport.summary}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3 text-blue-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.visibilityScore}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">可視性</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">{latestReport.metrics.contentGenerated}</p>
                            <p className="text-[10px] text-muted-foreground">生成数</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-3 w-3 text-purple-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.mentionsFound}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">言及</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              <p className="text-sm font-bold">{latestReport.metrics.llmCitations}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">LLM引用</p>
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
