"use client";

import { Dialog, Badge } from "@/components/ui";
import { availableCountries, countryLanguageMap } from "@/lib/store";
import type { PlanTask, TaskExecution, ExecutionArtifact } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Activity, Repeat, Clock, FileOutput, Cog, Info, Globe,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Image, ExternalLink, FileText, Code2, Database, Eye,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation, useLabels } from "@/lib/hooks/use-translation";

/** URLを検出してリンク化する */
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s"',}\]]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** JSONを人間が読みやすい形式にフォーマット */
function formatArtifactContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}

const statusColor: Record<string, string> = {
  running: "bg-green-500",
  waiting: "bg-yellow-500",
  completed: "bg-blue-500",
  error: "bg-red-500",
};

const activityTypeColor: Record<string, string> = {
  info: "bg-blue-400",
  success: "bg-green-400",
  warning: "bg-yellow-400",
  error: "bg-red-400",
};

const artifactIcons: Record<string, typeof Image> = {
  screenshot: Image,
  link: ExternalLink,
  content: FileText,
  code: Code2,
  data: Database,
};

const artifactColors: Record<string, string> = {
  screenshot: "text-pink-500 bg-pink-50 dark:bg-pink-950",
  link: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  content: "text-green-500 bg-green-50 dark:bg-green-950",
  code: "text-amber-500 bg-amber-50 dark:bg-amber-950",
  data: "text-purple-500 bg-purple-50 dark:bg-purple-950",
};

function formatTime(d: Date | null) {
  if (!d) return "\u2014";
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDateTime(d: Date) {
  return d.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getCountryFlag(code: string) {
  const c = availableCountries.find((x) => x.code === code);
  return c ? c.flag : "\ud83c\udf10";
}

function getCountryName(code: string) {
  const c = availableCountries.find((x) => x.code === code);
  return c ? c.name : code;
}

function ArtifactPreview({ artifact }: { artifact: ExecutionArtifact }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = artifactIcons[artifact.type] ?? FileText;
  const colorClass = artifactColors[artifact.type] ?? "text-gray-500 bg-gray-50 dark:bg-gray-950";
  const { t } = useTranslation();
  const { artifactTypeLabels } = useLabels();

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{artifact.title}</p>
          {artifact.description && (
            <p className="text-[10px] text-muted-foreground truncate">{artifact.description}</p>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">{artifactTypeLabels[artifact.type]}</Badge>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t bg-muted/10">
          {/* Screenshot preview */}
          {artifact.type === "screenshot" && artifact.thumbnailUrl && (
            <div className="p-3 space-y-2">
              <div className="rounded-lg overflow-hidden border bg-black/5">
                <img
                  src={artifact.thumbnailUrl}
                  alt={artifact.title}
                  className="w-full h-auto object-cover max-h-48"
                />
              </div>
              {artifact.url && (
                <p className="text-[10px] text-blue-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {t("taskDetail.fullSizeView")}
                </p>
              )}
            </div>
          )}

          {/* Content/Code preview */}
          {(artifact.type === "content" || artifact.type === "code" || artifact.type === "data") && artifact.content && (
            <div className="p-3">
              <pre className={cn(
                "text-xs leading-relaxed whitespace-pre-wrap rounded-lg p-3 max-h-60 overflow-y-auto",
                artifact.type === "code"
                  ? "bg-gray-900 text-gray-100 font-mono"
                  : "bg-muted/50 text-foreground",
              )}>
                <Linkify text={formatArtifactContent(artifact.content)} />
              </pre>
              {artifact.language && (
                <p className="text-[10px] text-muted-foreground mt-1.5">{t("taskDetail.language")}: {artifact.language}</p>
              )}
            </div>
          )}

          {/* Link */}
          {artifact.type === "link" && artifact.url && (
            <div className="p-3">
              <a href={artifact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> {artifact.url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExecutionItem({ exec }: { exec: TaskExecution }) {
  const [expanded, setExpanded] = useState(false);
  const langInfo = countryLanguageMap[exec.targetRegion];
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        {exec.status === "success" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
        )}
        <span className="text-sm shrink-0">{getCountryFlag(exec.targetRegion)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{getCountryName(exec.targetRegion)}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{langInfo?.langName ?? exec.targetLanguage}</Badge>
            <span className="text-[10px] text-muted-foreground">Cycle #{exec.cycleNumber}</span>
            {exec.artifacts.length > 0 && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0 gap-0.5">
                <FileText className="h-2.5 w-2.5" /> {exec.artifacts.length}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{exec.results[0]}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(exec.completedAt)}</span>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t bg-muted/20 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("taskDetail.executionActions")}</p>
            {exec.actions.map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-0.5">
                <span className="text-blue-500 shrink-0 mt-0.5">{"\u25b8"}</span> {a}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("taskDetail.results")}</p>
            {exec.results.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-0.5">
                <span className="text-green-500 shrink-0 mt-0.5">{"\u2713"}</span> {r}
              </p>
            ))}
          </div>

          {/* Artifacts */}
          {exec.artifacts.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">{t("taskDetail.artifactsEvidence")}</p>
              <div className="space-y-1.5">
                {exec.artifacts.map((artifact) => (
                  <ArtifactPreview key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </div>
          )}

          {exec.metrics && (
            <div className="flex gap-3 pt-1">
              <div className="text-center rounded bg-muted/50 px-2 py-1">
                <p className="text-xs font-bold">{exec.metrics.itemsProcessed}</p>
                <p className="text-[10px] text-muted-foreground">{t("taskDetail.processed")}</p>
              </div>
              <div className="text-center rounded bg-muted/50 px-2 py-1">
                <p className="text-xs font-bold">{exec.metrics.itemsGenerated}</p>
                <p className="text-[10px] text-muted-foreground">{t("taskDetail.generated")}</p>
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {formatDateTime(exec.startedAt)} {"\u2192"} {formatDateTime(exec.completedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

export function TaskDetailModal({ task, open, onClose }: { task: PlanTask | null; open: boolean; onClose: () => void }) {
  const [showAllExecutions, setShowAllExecutions] = useState(false);
  const { t } = useTranslation();
  const { taskStatusLabels, methodLabels, artifactTypeLabels } = useLabels();

  if (!task) return null;

  const displayedExecutions = showAllExecutions ? task.executions : task.executions.slice(0, 10);

  // Aggregate region stats
  const regionStats = new Map<string, { count: number; lang: string }>();
  for (const exec of task.executions) {
    const existing = regionStats.get(exec.targetRegion);
    if (existing) {
      existing.count++;
    } else {
      regionStats.set(exec.targetRegion, { count: 1, lang: exec.targetLanguage });
    }
  }

  // Aggregate artifact stats
  const totalArtifacts = task.executions.reduce((s, e) => s + e.artifacts.length, 0);
  const artifactTypeCounts = new Map<string, number>();
  for (const exec of task.executions) {
    for (const art of exec.artifacts) {
      artifactTypeCounts.set(art.type, (artifactTypeCounts.get(art.type) ?? 0) + 1);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={task.title}>
      <div className="space-y-5">
        {/* Status bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", statusColor[task.status], task.status === "running" && "animate-pulse")} />
            <span className="text-sm font-medium">{taskStatusLabels[task.status]}</span>
          </div>
          <Badge variant="outline">{methodLabels[task.method]}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat className="h-3 w-3" />
            <span>{task.cycleCount}{t("taskDetail.executedTimes")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t("taskDetail.lastRun")}: {formatTime(task.lastRunAt)}</span>
          </div>
        </div>

        {/* Region coverage */}
        {regionStats.size > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-500" />
              <h4 className="text-sm font-semibold">{t("taskDetail.targetRegions")}</h4>
              <Badge variant="info" className="text-[10px]">{regionStats.size}{t("taskDetail.regionCount")}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(regionStats.entries()).map(([region, stats]) => (
                <Badge key={region} variant="outline" className="text-xs gap-1">
                  {getCountryFlag(region)} {getCountryName(region)}
                  <span className="text-muted-foreground">({stats.count}{t("taskDetail.times")})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Artifact summary */}
        {totalArtifacts > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileOutput className="h-4 w-4 text-orange-500" />
              <h4 className="text-sm font-semibold">{t("taskDetail.generatedArtifacts")}</h4>
              <Badge variant="secondary" className="text-[10px]">{totalArtifacts}{t("project.items")}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(artifactTypeCounts.entries()).map(([type, count]) => {
                const Icon = artifactIcons[type] ?? FileText;
                return (
                  <div key={type} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs", artifactColors[type])}>
                    <Icon className="h-3 w-3" />
                    <span>{artifactTypeLabels[type]} {count}{t("project.items")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* What it does */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold">{t("taskDetail.whatItDoes")}</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{task.whatItDoes}</p>
        </div>

        {/* How it works */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-semibold">{t("taskDetail.howItWorks")}</h4>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{task.howItWorks}</div>
        </div>

        {/* Expected output */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileOutput className="h-4 w-4 text-green-500" />
            <h4 className="text-sm font-semibold">{t("taskDetail.expectedOutput")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{task.expectedOutput}</p>
        </div>

        {/* Execution history */}
        {task.executions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-semibold">{t("taskDetail.executionHistory")}</h4>
                <Badge variant="secondary" className="text-[10px]">{task.executions.length}{t("project.items")}</Badge>
              </div>
              {task.executions.length > 10 && (
                <button
                  onClick={() => setShowAllExecutions(!showAllExecutions)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {showAllExecutions ? t("taskDetail.showLatest") : `${t("taskDetail.showAll")} (${task.executions.length}${t("project.items")})`}
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {displayedExecutions.map((exec) => (
                <ExecutionItem key={exec.id} exec={exec} />
              ))}
            </div>
          </div>
        )}

        {/* Activity log */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">{t("taskDetail.systemLog")}</h4>
          </div>
          <div className="rounded-lg border divide-y max-h-32 overflow-y-auto">
            {task.activities.slice().reverse().map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2">
                <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", activityTypeColor[a.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(a.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next run */}
        {task.nextRunAt && task.status === "running" && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("taskDetail.nextExecution")}</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{formatTime(task.nextRunAt)}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
