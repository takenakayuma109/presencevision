"use client";

import { useStore, availableCountries } from "@/lib/store";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { ProjectWizard } from "@/components/wizard";
import { Dialog } from "@/components/ui";
import { Plus, Globe, ArrowRight, Trash2, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation, useLabels } from "@/lib/hooks/use-translation";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function DashboardPage() {
  const { projects, openWizard, removeProject } = useStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const getCountry = (code: string) => availableCountries.find((c) => c.code === code);
  const { t } = useTranslation();
  const { statusLabels } = useLabels();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Button onClick={openWizard} className="gap-2"><Plus className="h-4 w-4" /> {t("dashboard.addNew")}</Button>
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Globe className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("dashboard.noProjects")}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{t("dashboard.noProjectsDesc")}</p>
          <Button onClick={openWizard} className="gap-2"><Plus className="h-4 w-4" /> {t("dashboard.createFirst")}</Button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const running = project.plan.tasks.filter((t) => t.status === "running").length;
            return (
              <div key={project.id} className="group relative">
                <Link href={`/projects/${project.id}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-foreground/20">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {project.siteInfo.favicon && <img src={project.siteInfo.favicon} alt="" className="h-5 w-5 rounded" />}
                          <div>
                            <p className="text-sm font-semibold">{project.name}</p>
                            <p className="text-xs text-muted-foreground break-all">{project.url}</p>
                          </div>
                        </div>
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[project.status])}>
                          {statusLabels[project.status]}
                        </span>
                      </div>

                      {/* Running indicator */}
                      {project.status === "active" && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-green-700 dark:text-green-300 font-medium">{running}{t("dashboard.tasksRunning")}</span>
                        </div>
                      )}

                      {/* Countries */}
                      <div className="flex gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">{t("dashboard.business")}: </span>
                          {project.businessCountries.map((c) => getCountry(c)?.flag).join(" ")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("dashboard.presence")}: </span>
                          {project.presenceCountries.slice(0, 4).map((c) => getCountry(c)?.flag).join(" ")}
                          {project.presenceCountries.length > 4 && <span> +{project.presenceCountries.length - 4}</span>}
                        </div>
                      </div>

                      {/* Methods */}
                      <div className="flex flex-wrap gap-1">
                        {project.methods.slice(0, 3).map((m) => (
                          <Badge key={m} variant="secondary" className="text-xs">{m.toUpperCase()}</Badge>
                        ))}
                        {project.methods.length > 3 && <Badge variant="outline" className="text-xs">+{project.methods.length - 3}</Badge>}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-muted-foreground">{project.plan.tasks.length}{t("dashboard.tasks")} · {project.plan.duration}</p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); setConfirmDeleteId(project.id); }}
                  className="absolute top-3 right-3 hidden group-hover:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          <button onClick={openWizard} className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">{t("dashboard.newProject")}</span>
          </button>
        </div>
      )}

      <ProjectWizard />

      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title={t("dashboard.deleteProject")}>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.deleteConfirm")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={() => { if (confirmDeleteId) { removeProject(confirmDeleteId); setConfirmDeleteId(null); } }}>{t("common.deleteAction")}</Button>
        </div>
      </Dialog>
    </div>
  );
}
