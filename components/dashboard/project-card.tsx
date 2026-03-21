"use client";

import { Card, CardContent, Badge } from "@/components/ui";
import { ArrowRight, Trash2, Pause, Play, Globe, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation, useLabels } from "@/lib/hooks/use-translation";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export interface ProjectCardData {
  id: string;
  name: string;
  description: string | null;
  locale: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    entities: number;
    topics: number;
    contentAssets: number;
  };
}

interface ProjectCardProps {
  project: ProjectCardData;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
}

export function ProjectCard({ project, onDelete, onToggleStatus }: ProjectCardProps) {
  const { t } = useTranslation();
  const { statusLabels } = useLabels();

  const updatedDate = new Date(project.updatedAt);
  const relativeTime = getRelativeTime(updatedDate);
  const totalItems = project._count.entities + project._count.topics + project._count.contentAssets;

  return (
    <div className="group relative">
      <Link href={`/projects/${project.id}`}>
        <Card className="h-full transition-all hover:shadow-md hover:border-foreground/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                  )}
                </div>
              </div>
              <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[project.status] ?? statusStyles.active)}>
                {statusLabels[project.status] ?? project.status}
              </span>
            </div>

            {/* Active indicator */}
            {project.status === "active" && (
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  {t("labels.status.active")}
                </span>
              </div>
            )}

            {/* Counts */}
            <div className="flex gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">{t("dashboard.entities")}: </span>
                <span className="font-medium">{project._count.entities}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.topics")}: </span>
                <span className="font-medium">{project._count.topics}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.contentAssets")}: </span>
                <span className="font-medium">{project._count.contentAssets}</span>
              </div>
            </div>

            {/* Locale badge */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">{project.locale.toUpperCase()}</Badge>
              {totalItems > 0 && (
                <Badge variant="outline" className="text-xs">{totalItems} {t("dashboard.totalItems")}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {relativeTime}
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Quick actions */}
      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleStatus(project.id, project.status === "active" ? "paused" : "active");
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={project.status === "active" ? t("project.pause") : t("project.resume")}
        >
          {project.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
