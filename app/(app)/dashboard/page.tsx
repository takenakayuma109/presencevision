"use client";

import { useStore } from "@/lib/store";
import { Button, Dialog } from "@/components/ui";
import { ProjectWizard } from "@/components/wizard";
import { ProjectCard, DashboardSkeleton } from "@/components/dashboard";
import type { ProjectCardData } from "@/components/dashboard";
import { Plus, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/hooks/use-translation";

export default function DashboardPage() {
  const { openWizard } = useStore();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(t("dashboard.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
      );
    } catch (err) {
      console.error("Failed to update project status:", err);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Button onClick={openWizard} className="gap-2">
          <Plus className="h-4 w-4" /> {t("dashboard.addNew")}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProjects} className="ml-auto">
            {t("dashboard.retry")}
          </Button>
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Globe className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("dashboard.noProjects")}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{t("dashboard.noProjectsDesc")}</p>
          <Button onClick={openWizard} className="gap-2">
            <Plus className="h-4 w-4" /> {t("dashboard.createFirst")}
          </Button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(id) => setConfirmDeleteId(id)}
              onToggleStatus={handleToggleStatus}
            />
          ))}

          <button
            onClick={openWizard}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">{t("dashboard.newProject")}</span>
          </button>
        </div>
      )}

      <ProjectWizard />

      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title={t("dashboard.deleteProject")}
      >
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.deleteConfirm")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirmDeleteId) handleDelete(confirmDeleteId);
            }}
          >
            {t("common.deleteAction")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
