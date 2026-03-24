"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useStore, availableCountries, countryLanguageMap, expandPresenceCountries } from "@/lib/store";
import type { TaskExecution, ExecutionArtifact, ReportConfig, PresenceGoal, PresenceMethod, TargetAudience, CmsConfig } from "@/lib/store";
import { useEngineActivities } from "@/lib/hooks/use-engine";
import { useTranslation, useLabels } from "@/lib/hooks/use-translation";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/components/ui";
import { TaskDetailModal } from "@/components/wizard/task-detail-modal";
import { ProjectDetailSkeleton } from "@/components/dashboard";
import {
  ArrowLeft, Globe, Building2, Target, BarChart3, Clock, TrendingUp, FileText,
  Pause, Play, Mail, Repeat, ChevronRight, ChevronDown, Activity, CheckCircle2, AlertTriangle,
  History, Plus, X, Pencil, Image, Code2, Database, Eye, FolderOpen, Radio,
  Search, Swords, Users, Wrench, Settings, Maximize2, ExternalLink, Cpu, Upload, CircleDot, Loader2, Link2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types for API data
// ---------------------------------------------------------------------------
interface DbProject {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  locale: string;
  status: string;
  workspaceId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  entities: Array<{ id: string; name: string; type: string; description: string | null }>;
  competitors: Array<{ id: string; name: string; domain: string | null }>;
  _count: {
    topics: number;
    contentAssets: number;
    contentBriefs: number;
    reports: number;
  };
}

const statusBg: Record<string, string> = {
  running: "bg-green-500", waiting: "bg-yellow-500", completed: "bg-blue-500", error: "bg-red-500",
};

const artifactIcons: Record<string, typeof Image> = {
  screenshot: Image, link: Globe, content: FileText, code: Code2, data: Database,
};
const artifactColors: Record<string, string> = {
  screenshot: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  link: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  content: "text-green-500 bg-green-500/10 border-green-500/20",
  code: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  data: "text-purple-500 bg-purple-500/10 border-purple-500/20",
};

type TabId = "overview" | "work" | "timeline";

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

// ---------------------------------------------------------------------------
// Inline artifact display (for task accordion)
// ---------------------------------------------------------------------------
function ArtifactInline({ artifact: art }: { artifact: { type?: string; title?: string; content?: string; url?: string } }) {
  const [expanded, setExpanded] = useState(false);

  // Link type or has URL → show clickable link
  if (art.url) {
    return (
      <div className="rounded-md border bg-muted/20 p-2">
        <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1.5">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{art.title || art.url}</span>
        </a>
      </div>
    );
  }

  // Content-bearing artifact
  if (art.content) {
    const formatted = formatArtifactContent(art.content);
    const isLong = formatted.length > 150;
    const preview = isLong ? formatted.slice(0, 150) + "…" : formatted;

    return (
      <div className="rounded-md border bg-muted/20 overflow-hidden">
        <button
          onClick={() => isLong && setExpanded(!expanded)}
          className={cn("w-full text-left p-2", isLong && "hover:bg-muted/40 cursor-pointer")}
        >
          <p className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {art.title}
            {isLong && (
              <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", expanded && "rotate-180")} />
            )}
          </p>
          {!expanded && (
            <p className="text-xs text-foreground/80 whitespace-pre-wrap break-all leading-relaxed">
              <Linkify text={preview} />
            </p>
          )}
        </button>
        {expanded && (
          <div className="border-t p-2">
            <pre className="text-xs whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto bg-muted/30 rounded p-2">
              <Linkify text={formatted} />
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Fallback: title only
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span>{art.title}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Artifact full card (for gallery view)
// ---------------------------------------------------------------------------
function ArtifactCard({ artifact, taskTitle, region, completedAt }: {
  artifact: ExecutionArtifact; taskTitle: string; region: string; completedAt: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const Icon = artifactIcons[artifact.type] ?? FileText;
  const cc = availableCountries.find((c) => c.code === region);
  const langInfo = countryLanguageMap[region];
  const { t } = useTranslation();
  const { artifactTypeLabels } = useLabels();

  return (
    <>
    <div className={cn("rounded-lg border overflow-hidden transition-all", artifactColors[artifact.type])}>
      {/* Context bar — どこで・何語で・何をしたか */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-b text-[10px]">
        <span>{cc?.flag}</span>
        <span className="font-medium">{cc?.name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{langInfo?.langName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground truncate">{taskTitle}</span>
      </div>

      {/* Thumbnail / Preview header */}
      {artifact.type === "screenshot" && artifact.thumbnailUrl && (
        <button
          onClick={() => setImageOpen(true)}
          className="w-full bg-black/10 relative group"
        >
          <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full h-36 object-cover transition-opacity group-hover:opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/70 text-white rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3" /> {t("project.showFullText")}
            </div>
          </div>
        </button>
      )}
      {artifact.type === "code" && artifact.content && (
        <div className="bg-gray-900 p-3 max-h-32 overflow-hidden relative">
          <pre className="text-[10px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{formatArtifactContent(artifact.content).slice(0, 300)}</pre>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
        </div>
      )}
      {(artifact.type === "content" || artifact.type === "data") && artifact.content && !expanded && (
        <div className="bg-muted/30 p-3 max-h-28 overflow-hidden relative">
          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap"><Linkify text={formatArtifactContent(artifact.content).slice(0, 250)} /></p>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/80 to-transparent" />
        </div>
      )}

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded", artifactColors[artifact.type])}>
            <Icon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">{artifact.title}</p>
            {artifact.description && <p className="text-[10px] text-muted-foreground mt-0.5">{artifact.description}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{artifactTypeLabels[artifact.type]}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {completedAt.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Source / Destination / Status */}
        {(artifact.source || artifact.destination) && (
          <div className="rounded bg-muted/50 p-2 space-y-1 text-[10px]">
            {artifact.source && (
              <div className="flex items-start gap-1.5">
                <Cpu className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div><span className="text-muted-foreground">{t("project.artifactSource")}: </span><span>{artifact.source}</span></div>
              </div>
            )}
            {artifact.destination && (
              <div className="flex items-start gap-1.5">
                <Upload className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div><span className="text-muted-foreground">{t("project.artifactDest")}: </span><span>{artifact.destination}</span></div>
              </div>
            )}
            {artifact.publishStatus && (
              <div className="flex items-center gap-1.5">
                <CircleDot className="h-3 w-3 shrink-0" style={{ color: artifact.publishStatus === "published" ? "#22c55e" : artifact.publishStatus === "verified" ? "#3b82f6" : artifact.publishStatus === "error" ? "#ef4444" : "#f59e0b" }} />
                <span className={cn("font-medium", artifact.publishStatus === "published" ? "text-green-500" : artifact.publishStatus === "verified" ? "text-blue-500" : artifact.publishStatus === "error" ? "text-red-500" : "text-yellow-500")}>
                  {artifact.publishStatus === "published" ? t("project.statusPublished") : artifact.publishStatus === "verified" ? t("project.statusVerified") : artifact.publishStatus === "draft" ? t("project.statusDraft") : t("project.statusError")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          {(artifact.content && (artifact.type === "content" || artifact.type === "data" || artifact.type === "code")) && (
            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
              <Eye className="h-3 w-3" /> {expanded ? t("project.close") : t("project.showFullText")}
            </button>
          )}
          {artifact.type === "screenshot" && artifact.url && (
            <a href={artifact.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> {t("taskDetail.fullSizeView")}
            </a>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && artifact.content && (
        <div className="border-t p-3">
          <pre className={cn(
            "text-xs leading-relaxed whitespace-pre-wrap rounded-lg p-3 max-h-80 overflow-y-auto",
            artifact.type === "code" ? "bg-gray-900 text-gray-100 font-mono" : "bg-muted/50",
          )}>
            <Linkify text={formatArtifactContent(artifact.content)} />
          </pre>
        </div>
      )}
    </div>

    {/* Screenshot lightbox */}
    {imageOpen && artifact.type === "screenshot" && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setImageOpen(false)}>
        <button onClick={() => setImageOpen(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
          <X className="h-6 w-6" />
        </button>
        <div className="max-w-4xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
          <img src={artifact.url || artifact.thumbnailUrl} alt={artifact.title} className="w-full rounded-lg" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">{artifact.title}</p>
            <p className="text-gray-400 text-xs">{cc?.flag} {cc?.name} · {langInfo?.langName} · {taskTitle}</p>
            {artifact.description && <p className="text-gray-400 text-xs mt-0.5">{artifact.description}</p>}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared ToggleChip for editing
// ---------------------------------------------------------------------------
function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

// ---------------------------------------------------------------------------
// Editable tag input (keywords, competitors)
// ---------------------------------------------------------------------------
function TagInput({ tags, onUpdate, placeholder, variant = "info" }: {
  tags: string[]; onUpdate: (tags: string[]) => void; placeholder: string; variant?: "info" | "secondary";
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onUpdate([...tags, v]); setInput(""); }
  };
  return (
    <div className="space-y-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <Badge key={t} variant={variant} className="gap-1 text-xs py-0.5 px-2">
              {t}
              <button onClick={() => onUpdate(tags.filter((x) => x !== t))} className="ml-0.5 hover:text-red-500 transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="h-7 text-xs flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-7 text-xs px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project settings card (editable)
// ---------------------------------------------------------------------------
function ProjectSettingsCard({ project, onUpdate }: {
  project: { id: string; keywords: string[]; competitors: string[]; brandName: string;
    goals: PresenceGoal[]; businessCountries: string[]; presenceCountries: string[];
    audiences: TargetAudience[]; methods: PresenceMethod[]; duration: string; additionalNotes: string;
    cmsConfig?: CmsConfig };
  onUpdate: (settings: Partial<Pick<import("@/lib/store").Project,
    'goals' | 'businessCountries' | 'presenceCountries' | 'audiences' |
    'methods' | 'duration' | 'additionalNotes' | 'keywords' | 'competitors' | 'brandName' | 'cmsConfig'
  >>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cmsTesting, setCmsTesting] = useState(false);
  const [cmsTestResult, setCmsTestResult] = useState<"success" | "error" | null>(null);
  const { t } = useTranslation();
  const { goalLabels, methodLabels, audienceLabels, durationLabels } = useLabels();

  const handleTestConnection = async () => {
    if (!project.cmsConfig?.siteUrl) return;
    setCmsTesting(true);
    setCmsTestResult(null);
    try {
      const res = await fetch(`/api/cms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project.cmsConfig),
      });
      setCmsTestResult(res.ok ? "success" : "error");
    } catch {
      setCmsTestResult("error");
    } finally {
      setCmsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> {t("project.projectSettings")}</CardTitle>
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Pencil className="h-3 w-3" /> {editing ? t("project.complete") : t("project.edit")}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brand name */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> {t("project.brandName")}</p>
          {editing ? (
            <Input value={project.brandName} onChange={(e) => onUpdate({ brandName: e.target.value })} className="h-8 text-sm" />
          ) : (
            <p className="text-sm font-medium">{project.brandName}</p>
          )}
        </div>

        {/* Keywords */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Search className="h-3 w-3" /> {t("project.keywords")}</p>
          {editing ? (
            <TagInput tags={project.keywords} onUpdate={(keywords) => onUpdate({ keywords })} placeholder={t("wizard.addKeyword")} />
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.keywords.length > 0
                ? project.keywords.map((kw) => <Badge key={kw} variant="info" className="text-xs">{kw}</Badge>)
                : <p className="text-xs text-muted-foreground">{t("project.notSet")}</p>}
            </div>
          )}
        </div>

        {/* Competitors */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Swords className="h-3 w-3" /> {t("project.competitors")}</p>
          {editing ? (
            <TagInput tags={project.competitors} onUpdate={(competitors) => onUpdate({ competitors })} placeholder="https://competitor.com" variant="secondary" />
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.competitors.length > 0
                ? project.competitors.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)
                : <p className="text-xs text-muted-foreground">{t("project.notSet")}</p>}
            </div>
          )}
        </div>

        {/* Goals */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> {t("project.goals")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {(Object.entries(goalLabels) as [PresenceGoal, string][]).map(([k, v]) => (
                <ToggleChip key={k} label={v} selected={project.goals.includes(k)} onClick={() => onUpdate({ goals: toggle(project.goals, k) })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.goals.map((g) => <Badge key={g} variant="info" className="text-xs">{goalLabels[g]}</Badge>)}
            </div>
          )}
        </div>

        {/* Methods */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wrench className="h-3 w-3" /> {t("project.methods")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {(Object.entries(methodLabels) as [PresenceMethod, string][]).map(([k, v]) => (
                <ToggleChip key={k} label={v} selected={project.methods.includes(k)} onClick={() => onUpdate({ methods: toggle(project.methods, k) })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.methods.map((m) => <Badge key={m} variant="outline" className="text-xs">{methodLabels[m]}</Badge>)}
            </div>
          )}
        </div>

        {/* Business countries */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> {t("project.businessTarget")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {availableCountries.filter((c) => c.code !== "GLOBAL").map((c) => (
                <ToggleChip key={c.code} label={`${c.flag} ${c.name}`} selected={project.businessCountries.includes(c.code)} onClick={() => onUpdate({ businessCountries: toggle(project.businessCountries, c.code) })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.businessCountries.map((c) => { const cc = availableCountries.find((x) => x.code === c); return <Badge key={c} variant="secondary" className="text-xs">{cc?.flag} {cc?.name}</Badge>; })}
            </div>
          )}
        </div>

        {/* Presence countries */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> {t("project.presenceCountries")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {availableCountries.map((c) => (
                <ToggleChip key={c.code} label={`${c.flag} ${c.name}`} selected={project.presenceCountries.includes(c.code)} onClick={() => onUpdate({ presenceCountries: toggle(project.presenceCountries, c.code) })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.presenceCountries.map((c) => { const cc = availableCountries.find((x) => x.code === c); return <Badge key={c} variant="info" className="text-xs">{cc?.flag} {cc?.name}</Badge>; })}
            </div>
          )}
        </div>

        {/* Audiences */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> {t("project.targetAudience")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {(Object.entries(audienceLabels) as [TargetAudience, string][]).map(([k, v]) => (
                <ToggleChip key={k} label={v} selected={project.audiences.includes(k)} onClick={() => onUpdate({ audiences: toggle(project.audiences, k) })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {project.audiences.length > 0
                ? project.audiences.map((a) => <Badge key={a} variant="outline" className="text-xs">{audienceLabels[a]}</Badge>)
                : <p className="text-xs text-muted-foreground">{t("project.notSet")}</p>}
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {t("project.implementationPeriod")}</p>
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {(Object.entries(durationLabels) as [string, string][]).map(([k, v]) => (
                <ToggleChip key={k} label={v} selected={project.duration === k} onClick={() => onUpdate({ duration: k })} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium">{durationLabels[project.duration] ?? project.duration}</p>
          )}
        </div>

        {/* CMS settings */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Link2 className="h-3 w-3" /> {t("project.cmsSettings")}</p>
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs opacity-60">WordPress</Badge>
              </div>
              <Input
                value={project.cmsConfig?.siteUrl ?? ""}
                onChange={(e) => onUpdate({ cmsConfig: { type: "wordpress", siteUrl: e.target.value, username: project.cmsConfig?.username ?? "", applicationPassword: project.cmsConfig?.applicationPassword ?? "", defaultStatus: project.cmsConfig?.defaultStatus ?? "draft" } })}
                placeholder={t("project.cmsSiteUrl")}
                className="h-8 text-sm"
              />
              <Input
                value={project.cmsConfig?.username ?? ""}
                onChange={(e) => onUpdate({ cmsConfig: { type: "wordpress", siteUrl: project.cmsConfig?.siteUrl ?? "", username: e.target.value, applicationPassword: project.cmsConfig?.applicationPassword ?? "", defaultStatus: project.cmsConfig?.defaultStatus ?? "draft" } })}
                placeholder={t("project.cmsUsername")}
                className="h-8 text-sm"
              />
              <Input
                type="password"
                value={project.cmsConfig?.applicationPassword ?? ""}
                onChange={(e) => onUpdate({ cmsConfig: { type: "wordpress", siteUrl: project.cmsConfig?.siteUrl ?? "", username: project.cmsConfig?.username ?? "", applicationPassword: e.target.value, defaultStatus: project.cmsConfig?.defaultStatus ?? "draft" } })}
                placeholder={t("project.cmsPassword")}
                className="h-8 text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("project.cmsStatus")}:</span>
                <button
                  type="button"
                  onClick={() => onUpdate({ cmsConfig: { type: "wordpress", siteUrl: project.cmsConfig?.siteUrl ?? "", username: project.cmsConfig?.username ?? "", applicationPassword: project.cmsConfig?.applicationPassword ?? "", defaultStatus: project.cmsConfig?.defaultStatus === "publish" ? "draft" : "publish" } })}
                  className="text-xs"
                >
                  <Badge variant={project.cmsConfig?.defaultStatus === "publish" ? "info" : "secondary"} className="text-xs cursor-pointer">
                    {project.cmsConfig?.defaultStatus === "publish" ? t("project.cmsStatusPublish") : t("project.cmsStatusDraft")}
                  </Badge>
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={cmsTesting || !project.cmsConfig?.siteUrl}
                className="h-7 text-xs gap-1"
              >
                {cmsTesting ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> {t("project.cmsTesting")}</>
                ) : (
                  t("project.cmsTestConnection")
                )}
              </Button>
              {cmsTestResult === "success" && (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t("project.cmsConnected")}</p>
              )}
              {cmsTestResult === "error" && (
                <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {t("project.cmsFailed")}</p>
              )}
            </div>
          ) : (
            project.cmsConfig?.siteUrl ? (
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t("project.cmsConfigured")}: {project.cmsConfig.siteUrl}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("project.cmsNotConfigured")}</p>
            )
          )}
        </div>

        {/* Additional notes */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("project.additionalRequests")}</p>
          {editing ? (
            <Textarea value={project.additionalNotes} onChange={(e) => onUpdate({ additionalNotes: e.target.value })} rows={3} className="text-xs" />
          ) : (
            <p className="text-xs text-muted-foreground">{project.additionalNotes || t("project.none")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Channel management
// ---------------------------------------------------------------------------

const CHANNELS = [
  { type: "twitter", name: "X (Twitter)", category: "social" as const, icon: "\ud835\udd4f", regions: ["GLOBAL"] },
  { type: "linkedin", name: "LinkedIn", category: "social" as const, icon: "in", regions: ["GLOBAL"] },
  { type: "medium", name: "Medium", category: "blog" as const, icon: "M", regions: ["GLOBAL"] },
  { type: "note_com", name: "note.com", category: "blog" as const, icon: "\ud83d\udcdd", regions: ["JP"] },
  { type: "dev_to", name: "dev.to", category: "blog" as const, icon: "DEV", regions: ["GLOBAL"] },
  { type: "qiita", name: "Qiita", category: "blog" as const, icon: "Q", regions: ["JP"] },
  { type: "hashnode", name: "Hashnode", category: "blog" as const, icon: "#", regions: ["GLOBAL"] },
  { type: "reddit", name: "Reddit", category: "qa" as const, icon: "R", regions: ["US", "GB", "AU", "CA"] },
  { type: "quora", name: "Quora", category: "qa" as const, icon: "Q", regions: ["US", "GB", "IN"] },
  { type: "yahoo_chiebukuro", name: "Yahoo!\u77e5\u6075\u888b", category: "qa" as const, icon: "Y", regions: ["JP"] },
  { type: "zhihu", name: "\u77e5\u4e4e (Zhihu)", category: "qa" as const, icon: "\u77e5", regions: ["CN"] },
  { type: "naver_blog", name: "Naver Blog", category: "blog" as const, icon: "N", regions: ["KR"] },
  { type: "tistory", name: "Tistory", category: "blog" as const, icon: "T", regions: ["KR"] },
  { type: "csdn", name: "CSDN", category: "blog" as const, icon: "C", regions: ["CN"] },
  { type: "xing", name: "Xing", category: "social" as const, icon: "X", regions: ["DE"] },
];

type ChannelCategory = "social" | "blog" | "qa" | "directory";

const CATEGORY_ORDER: ChannelCategory[] = ["social", "blog", "qa", "directory"];

const CATEGORY_LABEL_KEYS: Record<ChannelCategory, string> = {
  social: "project.channelSocial",
  blog: "project.channelBlog",
  qa: "project.channelQA",
  directory: "project.channelDirectory",
};

function regionFlags(regions: string[]): string {
  return regions.map((r) => {
    const c = availableCountries.find((x) => x.code === r);
    return c?.flag ?? r;
  }).join(" ");
}

function ChannelManagementCard({ project, onUpdate }: {
  project: {
    enabledChannels?: string[];
    channelCredentials?: Record<string, { username?: string; password?: string }>;
  };
  onUpdate: (settings: Partial<Pick<import("@/lib/store").Project, 'enabledChannels' | 'channelCredentials'>>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expandedCred, setExpandedCred] = useState<string | null>(null);
  const { t } = useTranslation();

  const enabled = project.enabledChannels ?? [];
  const credentials = project.channelCredentials ?? {};

  const toggleChannel = (type: string) => {
    const next = enabled.includes(type) ? enabled.filter((c) => c !== type) : [...enabled, type];
    onUpdate({ enabledChannels: next });
  };

  const updateCredential = (type: string, field: "username" | "password", value: string) => {
    const cur = credentials[type] ?? {};
    onUpdate({ channelCredentials: { ...credentials, [type]: { ...cur, [field]: value } } });
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    channels: CHANNELS.filter((ch) => ch.category === cat),
  })).filter((g) => g.channels.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Radio className="h-4 w-4" /> {t("project.channelManagement")}</CardTitle>
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Pencil className="h-3 w-3" /> {editing ? t("project.complete") : t("project.edit")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t("project.channelManagementDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" className="text-xs">{enabled.length} {t("project.channelsCount")}</Badge>
          </div>
        )}

        {grouped.map(({ category, channels }) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t(CATEGORY_LABEL_KEYS[category])}</p>
            <div className={editing ? "space-y-2" : "flex flex-wrap gap-1"}>
              {channels.map((ch) => {
                const isEnabled = enabled.includes(ch.type);
                if (editing) {
                  return (
                    <div key={ch.type} className="rounded-lg border p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono w-8 text-center shrink-0">{ch.icon}</span>
                          <span className="text-sm font-medium">{ch.name}</span>
                          <span className="text-xs text-muted-foreground">{regionFlags(ch.regions)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleChannel(ch.type)}
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border transition-colors",
                              isEnabled ? "bg-green-500/10 border-green-500/30 text-green-600" : "bg-muted border-border text-muted-foreground"
                            )}
                          >
                            {isEnabled ? t("project.channelEnabled") : t("project.channelDisabled")}
                          </button>
                          {isEnabled && (
                            <button
                              onClick={() => setExpandedCred(expandedCred === ch.type ? null : ch.type)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {expandedCred === ch.type ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                      {isEnabled && expandedCred === ch.type && (
                        <div className="pl-10 space-y-1 pt-1">
                          <p className="text-xs text-muted-foreground">{t("project.channelCredentials")}</p>
                          <Input
                            value={credentials[ch.type]?.username ?? ""}
                            onChange={(e) => updateCredential(ch.type, "username", e.target.value)}
                            placeholder={t("project.channelUsername")}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="password"
                            value={credentials[ch.type]?.password ?? ""}
                            onChange={(e) => updateCredential(ch.type, "password", e.target.value)}
                            placeholder={t("project.channelPassword")}
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  );
                }
                // View mode: only show enabled channels as compact badges
                if (!isEnabled) return null;
                return (
                  <Badge key={ch.type} variant="outline" className="text-xs gap-1">
                    <span className="font-mono">{ch.icon}</span> {ch.name} <span className="text-muted-foreground">{regionFlags(ch.regions)}</span>
                  </Badge>
                );
              })}
              {!editing && channels.every((ch) => !enabled.includes(ch.type)) && (
                <p className="text-xs text-muted-foreground">{t("project.none")}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Report config editor
// ---------------------------------------------------------------------------
function ReportConfigCard({ config, onUpdate }: { config: ReportConfig; onUpdate: (c: Partial<ReportConfig>) => void }) {
  const [editing, setEditing] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const { t } = useTranslation();

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !config.emailAddresses.includes(email)) {
      onUpdate({ emailAddresses: [...config.emailAddresses, email] });
      setEmailInput("");
    }
  };
  const removeEmail = (email: string) => {
    onUpdate({ emailAddresses: config.emailAddresses.filter((e) => e !== email) });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addEmail(); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> {t("project.reportSettings")}</CardTitle>
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Pencil className="h-3 w-3" /> {editing ? t("project.complete") : t("project.edit")}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{t("project.recipients")}</p>
          <div className="flex flex-wrap gap-1.5">
            {config.emailAddresses.map((email) => (
              <Badge key={email} variant="secondary" className="text-xs py-1 px-2 gap-1">
                {email}
                {editing && (
                  <button onClick={() => removeEmail(email)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                )}
              </Badge>
            ))}
            {config.emailAddresses.length === 0 && <p className="text-xs text-muted-foreground">{t("project.notSet")}</p>}
          </div>
          {editing && (
            <div className="flex gap-2 mt-2">
              <Input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="email@example.com" className="h-8 text-xs flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={addEmail} className="h-8 gap-1 text-xs px-2"><Plus className="h-3 w-3" /> {t("project.add")}</Button>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{t("project.sendTime")}</p>
          {editing ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t("project.morning")}</label>
                <Input type="time" value={config.morningTime} onChange={(e) => onUpdate({ morningTime: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t("project.evening")}</label>
                <Input type="time" value={config.eveningTime} onChange={(e) => onUpdate({ eveningTime: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
          ) : (
            <p className="text-sm">{config.morningTime}({t("project.morning")}) / {config.eveningTime}({t("project.evening")})</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects, updateProjectStatus, updateProjectReportConfig, updateProjectSettings, selectTask } = useStore();
  const storeProject = projects.find((p) => p.id === id);
  const { t } = useTranslation();
  const { statusLabels, taskStatusLabels, methodLabels, durationLabels, artifactTypeLabels } = useLabels();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [workFilter, setWorkFilter] = useState<string>("all");

  // Fetch real project data from the database
  const [dbProject, setDbProject] = useState<DbProject | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Edit mode state for DB-only projects
  const [dbEditing, setDbEditing] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSaveStatus, setDbSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editCompetitors, setEditCompetitors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProject() {
      try {
        setDbError(null);
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDbProject(data);
        } else if (res.status === 404) {
          setDbError("not_found");
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
      } finally {
        setDbLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const startDbEditing = () => {
    if (!dbProject) return;
    setEditName(dbProject.name);
    setEditUrl(dbProject.url ?? "");
    setEditDescription(dbProject.description ?? "");
    const meta = dbProject.metadata as Record<string, unknown> | null;
    setEditKeywords((meta?.keywords as string[]) ?? []);
    setEditCompetitors(dbProject.competitors.map((c) => c.name));
    setDbEditing(true);
    setDbSaveStatus("idle");
  };

  const cancelDbEditing = () => {
    setDbEditing(false);
    setDbSaveStatus("idle");
  };

  const saveDbProject = async () => {
    if (!dbProject) return;
    setDbSaving(true);
    setDbSaveStatus("idle");
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          url: editUrl || null,
          description: editDescription || null,
          keywords: editKeywords,
          competitors: editCompetitors,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setDbProject(updated);
      setDbEditing(false);
      setDbSaveStatus("saved");
      setTimeout(() => setDbSaveStatus("idle"), 3000);
    } catch {
      setDbSaveStatus("error");
    } finally {
      setDbSaving(false);
    }
  };

  // Use DB data for the project or fall back to store data
  const project = storeProject;
  const projectName = dbProject?.name ?? storeProject?.name;
  const projectStatus = dbProject?.status ?? storeProject?.status ?? "active";
  const projectDescription = dbProject?.description ?? storeProject?.url;

  const engine = useEngineActivities(id, projectStatus === "active");

  // Auto-register project with the engine when we have DB data
  const [engineRegistered, setEngineRegistered] = useState(false);
  const [expandedActivityIdx, setExpandedActivityIdx] = useState<number | null>(null);
  useEffect(() => {
    if (!dbProject || engineRegistered || engine.isLive) return;
    // Register project with engine (non-blocking)
    fetch(`/api/projects/${id}/engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: dbProject.name,
        url: dbProject.description || "",
        keywords: [],
        targetCountries: ["JP"],
        methods: ["SEO"],
      }),
    })
      .then((res) => {
        if (res.ok) setEngineRegistered(true);
      })
      .catch(() => {
        // Engine may be unreachable — not critical
      });
  }, [dbProject, id, engineRegistered, engine.isLive]);

  // Show loading while fetching DB data and no store fallback
  if (dbLoading && !storeProject) {
    return <ProjectDetailSkeleton />;
  }

  if (!storeProject && dbError === "not_found" && !dbProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold mb-2">{t("project.notFound")}</p>
        <Link href="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> {t("project.backToList")}</Button></Link>
      </div>
    );
  }

  // DB-only project (no store data): render a simplified detail view
  if (!storeProject && dbProject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link href="/dashboard" className="mt-1"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-xl font-bold">{dbProject.name}</h2>
                <Badge variant={dbProject.status === "active" ? "success" : dbProject.status === "paused" ? "secondary" : "info"}>
                  {statusLabels[dbProject.status] ?? dbProject.status}
                </Badge>
                {engine.isLive ? (
                  <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30 gap-1">
                    <Radio className="h-3 w-3 animate-pulse" /> LIVE
                  </Badge>
                ) : engine.connectionStatus === "connecting" ? (
                  <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30 gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t("project.engineConnecting")}
                  </Badge>
                ) : engineRegistered ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
                    <Activity className="h-3 w-3" /> {t("project.engineWaiting")}
                  </Badge>
                ) : null}
              </div>
              {dbProject.url && <p className="text-sm text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> {dbProject.url}</p>}
              {dbProject.description && <p className="text-sm text-muted-foreground">{dbProject.description}</p>}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {dbSaveStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t("project.saved")}</span>
            )}
            {dbSaveStatus === "error" && (
              <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {t("project.saveFailed")}</span>
            )}
            {!dbEditing && (
              <Button variant="outline" size="sm" onClick={startDbEditing} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> {t("project.edit")}
              </Button>
            )}
            {dbEditing && (
              <>
                <Button variant="ghost" size="sm" onClick={cancelDbEditing} className="gap-1.5">
                  {t("project.cancel")}
                </Button>
                <Button size="sm" onClick={saveDbProject} disabled={dbSaving} className="gap-1.5">
                  {dbSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("project.saving")}</> : <>{t("project.save")}</>}
                </Button>
              </>
            )}
            {dbProject.status === "active" && (
              <Button variant="outline" size="sm" onClick={async () => {
                await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paused" }) });
                setDbProject((p) => p ? { ...p, status: "paused" } : p);
              }} className="gap-1.5"><Pause className="h-3.5 w-3.5" /> {t("project.pause")}</Button>
            )}
            {dbProject.status === "paused" && (
              <Button size="sm" onClick={async () => {
                await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
                setDbProject((p) => p ? { ...p, status: "active" } : p);
              }} className="gap-1.5"><Play className="h-3.5 w-3.5" /> {t("project.resume")}</Button>
            )}
          </div>
        </div>

        {/* Inline edit form */}
        {dbEditing && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4" /> {t("project.editProject")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brand name */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> {t("project.brandName")}</p>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
              </div>

              {/* Site URL */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> {t("project.siteUrl")}</p>
                <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://example.com" className="h-8 text-sm" />
              </div>

              {/* Description / Goals */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileText className="h-3 w-3" /> {t("project.descriptionGoals")}</p>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="text-sm" />
              </div>

              {/* Keywords */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Search className="h-3 w-3" /> {t("project.keywords")}</p>
                <TagInput tags={editKeywords} onUpdate={setEditKeywords} placeholder={t("project.addKeyword")} />
              </div>

              {/* Competitors */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Swords className="h-3 w-3" /> {t("project.competitors")}</p>
                <TagInput tags={editCompetitors} onUpdate={setEditCompetitors} placeholder={t("project.addCompetitor")} variant="secondary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats from DB */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, label: t("dashboard.entities"), value: String(dbProject.entities.length), color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" },
            { icon: Target, label: t("dashboard.topics"), value: String(dbProject._count.topics), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950" },
            { icon: FileText, label: t("dashboard.contentAssets"), value: String(dbProject._count.contentAssets), color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950" },
            { icon: BarChart3, label: t("dashboard.reports"), value: String(dbProject._count.reports), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
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

        {/* Keywords & Competitors (view mode) */}
        {!dbEditing && ((() => {
          const meta = dbProject.metadata as Record<string, unknown> | null;
          const kw = (meta?.keywords as string[]) ?? [];
          return (kw.length > 0 || dbProject.competitors.length > 0) ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {kw.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Search className="h-4 w-4" /> {t("project.keywords")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {kw.map((k) => <Badge key={k} variant="info" className="text-xs">{k}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              )}
              {dbProject.competitors.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Swords className="h-4 w-4" /> {t("project.competitors")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {dbProject.competitors.map((c) => <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null;
        })())}

        {/* Entities list */}
        {dbProject.entities.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {t("dashboard.entities")} ({dbProject.entities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {dbProject.entities.map((entity) => (
                <div key={entity.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entity.name}</p>
                    <p className="text-xs text-muted-foreground">{entity.type}{entity.description ? ` - ${entity.description}` : ""}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Competitors list */}
        {dbProject.competitors.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Swords className="h-4 w-4" /> {t("project.competitors")} ({dbProject.competitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {dbProject.competitors.map((comp) => (
                <div key={comp.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{comp.name}</p>
                    {comp.domain && <p className="text-xs text-muted-foreground">{comp.domain}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Engine activities (real-time data from VPS) */}
        {engine.isLive && engine.activities.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" /> {t("project.taskList")}
                {engine.stats && (
                  <Badge variant="success" className="text-xs">
                    {engine.stats.completed} / {engine.stats.total}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {engine.activities.slice(0, 20).map((activity, i) => {
                const isExpanded = expandedActivityIdx === i;
                const durationSec = activity.durationMs ? (activity.durationMs / 1000).toFixed(1) : null;
                const hasArtifacts = activity.artifacts && activity.artifacts.length > 0;
                const hasDetails = activity.error || hasArtifacts || durationSec || activity.status;
                return (
                  <div key={i} className="rounded-lg border overflow-hidden">
                    <button
                      onClick={() => setExpandedActivityIdx(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        activity.type === "success" ? "bg-green-500" : activity.type === "error" ? "bg-red-500" : "bg-blue-500",
                        activity.type === "info" && "animate-pulse",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleString("ja-JP", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {hasDetails && (
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-180")} />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3 space-y-2 text-sm">
                        {/* Status */}
                        {activity.status && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{t("project.statusLabel")}</span>
                            <Badge variant={activity.status === "completed" ? "success" : activity.status === "failed" ? "destructive" : activity.status === "running" ? "info" : "secondary"} className="text-xs">
                              {activity.status === "completed" ? t("project.statusCompleted") : activity.status === "failed" ? t("project.statusFailed") : activity.status === "running" ? t("project.statusRunning") : activity.status}
                            </Badge>
                          </div>
                        )}
                        {/* Duration */}
                        {durationSec && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{t("project.durationLabel")}</span>
                            <span className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> {durationSec}s</span>
                          </div>
                        )}
                        {/* Error */}
                        {activity.error && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{t("project.errorLabel")}</span>
                            <p className="text-xs text-red-500 break-all">{activity.error}</p>
                          </div>
                        )}
                        {/* Artifacts */}
                        {hasArtifacts && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{t("project.artifactsLabel")}</span>
                            <div className="space-y-2 flex-1 min-w-0">
                              {activity.artifacts!.map((art, j) => (
                                <ArtifactInline key={j} artifact={art} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {dbProject.entities.length === 0 && dbProject._count.topics === 0 && !engine.isLive && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-8">
            <Globe className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">{t("project.reportsAutoGenerated")}</p>
          </div>
        )}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold mb-2">{t("project.notFound")}</p>
        <Link href="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> {t("project.backToList")}</Button></Link>
      </div>
    );
  }

  const runningTasks = project.plan.tasks.filter((t) => t.status === "running").length;
  const totalCycles = project.plan.tasks.reduce((s, t) => s + t.cycleCount, 0);
  const selectedTask = project.selectedTaskId ? project.plan.tasks.find((t) => t.id === project.selectedTaskId) ?? null : null;
  const getCountry = (code: string) => availableCountries.find((c) => c.code === code);

  // Collect all executions
  const allExecutions: (TaskExecution & { taskTitle: string; taskMethod: string })[] = [];
  if (engine.isLive && engine.executions.length > 0) {
    for (const exec of engine.executions) {
      allExecutions.push({ ...exec, taskTitle: exec.actions[0] ?? "Engine Task", taskMethod: "Engine" });
    }
  } else {
    for (const task of project.plan.tasks) {
      for (const exec of task.executions) {
        allExecutions.push({ ...exec, taskTitle: task.title, taskMethod: methodLabels[task.method] });
      }
    }
  }
  allExecutions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const timelineToShow = showFullTimeline ? allExecutions : allExecutions.slice(0, 20);

  // Collect ALL artifacts across all executions for the gallery
  const allArtifacts: { artifact: ExecutionArtifact; taskTitle: string; region: string; completedAt: Date }[] = [];
  for (const exec of allExecutions) {
    for (const art of exec.artifacts) {
      allArtifacts.push({ artifact: art, taskTitle: exec.taskTitle, region: exec.targetRegion, completedAt: exec.completedAt });
    }
  }
  const filteredArtifacts = workFilter === "all" ? allArtifacts : allArtifacts.filter((a) => a.artifact.type === workFilter);

  // Region coverage
  const expandedRegions = expandPresenceCountries(project.presenceCountries);
  const regionExecCounts = new Map<string, number>();
  for (const exec of allExecutions) {
    regionExecCounts.set(exec.targetRegion, (regionExecCounts.get(exec.targetRegion) ?? 0) + 1);
  }

  // Artifact type counts
  const artifactTypeCounts = new Map<string, number>();
  for (const a of allArtifacts) {
    artifactTypeCounts.set(a.artifact.type, (artifactTypeCounts.get(a.artifact.type) ?? 0) + 1);
  }

  const tabs: { id: TabId; label: string; icon: typeof Activity }[] = [
    { id: "overview", label: t("project.overview"), icon: Activity },
    { id: "work", label: `${t("project.allWork")} (${allArtifacts.length})`, icon: FolderOpen },
    { id: "timeline", label: `${t("project.timeline")} (${allExecutions.length})`, icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="mt-1"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              {project.siteInfo.favicon && <img src={project.siteInfo.favicon} alt="" className="h-5 w-5 rounded" />}
              <h2 className="text-xl font-bold">{dbProject?.name ?? project.name}</h2>
              <Badge variant={project.status === "active" ? "success" : project.status === "paused" ? "secondary" : "info"}>
                {statusLabels[project.status]}
              </Badge>
              {engine.isLive ? (
                <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30 gap-1">
                  <Radio className="h-3 w-3 animate-pulse" /> LIVE
                </Badge>
              ) : engine.connectionStatus === "connecting" ? (
                <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30 gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> {t("project.engineConnecting")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
                  <Activity className="h-3 w-3" /> {t("project.engineWaiting")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{project.url}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {project.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => updateProjectStatus(project.id, "paused")} className="gap-1.5"><Pause className="h-3.5 w-3.5" /> {t("project.pause")}</Button>
          )}
          {project.status === "paused" && (
            <Button size="sm" onClick={() => updateProjectStatus(project.id, "active")} className="gap-1.5"><Play className="h-3.5 w-3.5" /> {t("project.resume")}</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Activity, label: t("project.activeTasks"),
            value: engine.isLive && engine.stats ? `${engine.stats.running}/${engine.stats.total}` : `${runningTasks}/${project.plan.tasks.length}`,
            color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950",
          },
          {
            icon: Repeat, label: t("project.totalExecutions"),
            value: engine.isLive && engine.stats ? String(engine.stats.completed) : String(totalCycles),
            color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950",
          },
          { icon: FolderOpen, label: t("project.artifacts"), value: String(allArtifacts.length), color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950" },
          { icon: Clock, label: t("project.period"), value: durationLabels[project.duration] ?? project.duration, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
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

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ TAB: Overview ============ */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            {/* Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" /> {t("project.taskList")}
                  <Badge variant="success" className="text-xs">{t("project.simultaneousExecution")}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("project.clickForDetails")}</p>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {project.plan.tasks.map((task) => {
                  const taskArtifactCount = task.executions.reduce((s, e) => s + e.artifacts.length, 0);
                  return (
                    <button
                      key={task.id}
                      onClick={() => selectTask(project.id, task.id)}
                      className="w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50 hover:border-foreground/20"
                    >
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusBg[task.status], task.status === "running" && "animate-pulse")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{taskStatusLabels[task.status]}</span>
                          <span className="text-xs text-muted-foreground">{task.cycleCount}{t("project.executed")}</span>
                          <span className="text-xs text-muted-foreground">{taskArtifactCount}{t("project.artifactCount")}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{methodLabels[task.method]}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Latest work preview (top 6 artifacts) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" /> {t("project.latestArtifacts")}
                  </CardTitle>
                  <button onClick={() => setActiveTab("work")} className="text-xs text-blue-500 hover:underline">
                    {t("project.showAll")} ({allArtifacts.length}{t("project.items")})
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allArtifacts.slice(0, 6).map((a, i) => (
                    <ArtifactCard key={`${a.artifact.id}-${i}`} artifact={a.artifact} taskTitle={a.taskTitle} region={a.region} completedAt={a.completedAt} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <ProjectSettingsCard
              project={project}
              onUpdate={(settings) => updateProjectSettings(project.id, settings)}
            />

            <ChannelManagementCard
              project={project}
              onUpdate={(settings) => updateProjectSettings(project.id, settings)}
            />

            <ReportConfigCard config={project.reportConfig} onUpdate={(config) => updateProjectReportConfig(project.id, config)} />

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> {t("project.recentReports")}</CardTitle></CardHeader>
              <CardContent>
                {project.reports.length > 0 ? (
                  <div className="space-y-3">
                    {project.reports.slice(0, 2).map((r) => (
                      <div key={r.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{r.title}</p>
                          <Badge variant={r.type === "morning" ? "info" : "secondary"} className="text-xs">{r.type === "morning" ? t("project.morning") : t("project.evening")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.summary}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div className="text-center rounded bg-muted/50 p-1">
                            <div className="flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3 text-blue-500" /><p className="text-sm font-bold">{r.metrics.visibilityScore}</p></div>
                            <p className="text-xs text-muted-foreground">{t("project.visibility")}</p>
                          </div>
                          <div className="text-center rounded bg-muted/50 p-1"><p className="text-sm font-bold">{r.metrics.contentGenerated}</p><p className="text-xs text-muted-foreground">{t("project.generated")}</p></div>
                          <div className="text-center rounded bg-muted/50 p-1"><p className="text-sm font-bold">{r.metrics.llmCitations}</p><p className="text-xs text-muted-foreground">{t("project.llmCitations")}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("project.reportsAutoGenerated")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> {t("project.estimatedImpact")}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{project.plan.estimatedImpact}</p></CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============ TAB: All Work (Gallery) ============ */}
      {activeTab === "work" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setWorkFilter("all")}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                workFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted")}
            >
              {t("project.all")} ({allArtifacts.length})
            </button>
            {Array.from(artifactTypeCounts.entries()).map(([type, count]) => {
              const Icon = artifactIcons[type] ?? FileText;
              return (
                <button
                  key={type}
                  onClick={() => setWorkFilter(type)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                    workFilter === type ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted")}
                >
                  <Icon className="h-3 w-3" /> {artifactTypeLabels[type]} ({count})
                </button>
              );
            })}
          </div>

          {/* Region coverage */}
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-cyan-500" />
              {t("project.regionCoverage")} ({expandedRegions.length}{t("project.regions")})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {expandedRegions.map((region) => {
                const cc = getCountry(region);
                const count = regionExecCounts.get(region) ?? 0;
                const langInfo = countryLanguageMap[region];
                return (
                  <Badge key={region} variant={count > 0 ? "info" : "outline"} className={cn("text-xs gap-1", count === 0 && "opacity-50")}>
                    {cc?.flag} {cc?.name} <span className="text-muted-foreground">{langInfo?.langName} {count}{t("taskDetail.times")}</span>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Gallery grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArtifacts.map((a, i) => (
              <ArtifactCard key={`${a.artifact.id}-${i}`} artifact={a.artifact} taskTitle={a.taskTitle} region={a.region} completedAt={a.completedAt} />
            ))}
          </div>

          {filteredArtifacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t("project.noMatchingArtifacts")}</p>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: Timeline ============ */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-cyan-500" /> {t("project.regionCoverage")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {expandedRegions.map((region) => {
                const cc = getCountry(region);
                const count = regionExecCounts.get(region) ?? 0;
                const langInfo = countryLanguageMap[region];
                return (
                  <Badge key={region} variant={count > 0 ? "info" : "outline"} className={cn("text-xs gap-1", count === 0 && "opacity-50")}>
                    {cc?.flag} {cc?.name} <span className="text-muted-foreground">{langInfo?.langName} {count}{t("taskDetail.times")}</span>
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{allExecutions.length}{t("project.executions")}</p>
            {allExecutions.length > 20 && (
              <button onClick={() => setShowFullTimeline(!showFullTimeline)} className="text-xs text-blue-500 hover:underline">
                {showFullTimeline ? t("project.latestOnly") : `${t("project.showAllExec")} (${allExecutions.length}${t("project.items")})`}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {timelineToShow.map((exec, i) => {
              const cc = getCountry(exec.targetRegion);
              const langInfo = countryLanguageMap[exec.targetRegion];
              return (
                <div key={`${exec.id}-${i}`} className="flex items-start gap-2.5 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  {exec.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{exec.taskTitle}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{exec.taskMethod}</Badge>
                      {exec.artifacts.length > 0 && (
                        <Badge variant="info" className="text-[10px] px-1.5 py-0 gap-0.5"><FolderOpen className="h-2.5 w-2.5" /> {exec.artifacts.length}{t("project.items")}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs">{cc?.flag} {cc?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{langInfo?.langName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{exec.results[0]}</p>
                    {/* Inline artifact previews */}
                    {exec.artifacts.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {exec.artifacts.map((art) => {
                          const Icon = artifactIcons[art.type] ?? FileText;
                          return (
                            <div key={art.id} className={cn("flex items-center gap-1 rounded px-2 py-1 text-[10px] border", artifactColors[art.type])}>
                              <Icon className="h-3 w-3" /> {art.title}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {exec.completedAt.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => selectTask(project.id, null)}
      />
    </div>
  );
}
