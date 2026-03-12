"use client";

import { useMemo } from "react";
import { StatCard, PipelineChart, ActivityFeed } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge, TechTerm } from "@/components/ui";
import {
  Eye,
  Box,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { ActivityItem } from "@/types";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const t = useT();
  const { contentItems, approvals, complianceFlags, entities, auditLogs } = useStore();

  const pipelineCounts = useMemo(() => ({
    draft: contentItems.filter((c) => c.status === "DRAFT").length,
    review: contentItems.filter((c) => c.status === "REVIEW").length,
    approved: contentItems.filter((c) => c.status === "APPROVED").length,
    published: contentItems.filter((c) => c.status === "PUBLISHED").length,
  }), [contentItems]);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === "PENDING").length,
    [approvals],
  );

  const unresolvedFlags = useMemo(
    () => complianceFlags.filter((f) => !f.resolved).length,
    [complianceFlags],
  );

  const entityCount = entities.length;

  const recentActivity: ActivityItem[] = useMemo(
    () =>
      auditLogs.slice(0, 4).map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
      })),
    [auditLogs],
  );

  const entityCovered = useMemo(
    () => entities.filter((e) => e.contentCount > 0).length,
    [entities],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("dashboard.overview")}</h2>
          <p className="text-sm text-muted-foreground">
            <TechTerm term="デジタルプレゼンス">{t("dashboard.subtitle")}</TechTerm>
          </p>
        </div>
        <Badge variant="info">{t("common.demoMode")}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.visibilityScore")}
          value={72}
          subtitle="/ 100"
          icon={TrendingUp}
          trend={5}
        />
        <StatCard
          title={t("dashboard.entityCoverage")}
          value={`${entityCovered}/${entityCount}`}
          icon={Box}
        />
        <StatCard
          title={t("dashboard.pendingApprovals")}
          value={pendingApprovals}
          icon={CheckCircle2}
        />
        <StatCard
          title={t("dashboard.riskAlerts")}
          value={unresolvedFlags}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PipelineChart data={pipelineCounts} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed items={recentActivity} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> {t("dashboard.weeklySummary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.articlesPublished")}</span>
                <span className="font-medium">{pipelineCounts.published}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.topicsResearched")}</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.entitiesUpdated")}</span>
                <span className="font-medium">{entityCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" /> <TechTerm term="プレゼンスレイヤー">{t("dashboard.presenceLayers")}</TechTerm>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: t("dashboard.globalKnowledge"), pct: 45 },
                { label: t("dashboard.localMarket"), pct: 68 },
                { label: t("dashboard.structuredKnowledge"), pct: 32 },
                { label: t("dashboard.llmCitation"), pct: 18 },
              ].map((layer) => (
                <div key={layer.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{layer.label}</span>
                    <span className="font-medium">{layer.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-all"
                      style={{ width: `${layer.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Box className="h-4 w-4" /> {t("dashboard.entityStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "PresenceVision", status: t("dashboard.active"), badge: "success" as const },
                { name: "Digital Presence", status: t("dashboard.needsContent"), badge: "warning" as const },
                { name: "AEO", status: t("dashboard.new"), badge: "info" as const },
              ].map((entity) => (
                <div key={entity.name} className="flex items-center justify-between">
                  <span className="text-sm">{entity.name}</span>
                  <Badge variant={entity.badge}>{entity.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
