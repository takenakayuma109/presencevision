"use client";

import { StatCard, PipelineChart, ActivityFeed } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import {
  Eye,
  Box,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { DashboardData } from "@/types";
import { useT } from "@/lib/i18n";

const mockData: DashboardData = {
  visibilityOverview: { score: 72, trend: 5 },
  entityCoverage: { total: 3, covered: 1 },
  contentPipeline: { draft: 3, review: 2, approved: 1, published: 5 },
  pendingApprovals: 2,
  riskAlerts: 1,
  recentActivity: [
    { id: "1", action: "Published", resource: "デジタルプレゼンスとは？完全ガイド", timestamp: new Date() },
    { id: "2", action: "Created brief", resource: "AEO入門", timestamp: new Date(Date.now() - 3600000) },
    { id: "3", action: "Research completed", resource: "GEO vs SEO", timestamp: new Date(Date.now() - 7200000) },
    { id: "4", action: "Entity added", resource: "PresenceVision", timestamp: new Date(Date.now() - 86400000) },
  ],
  weeklySummary: { articlesPublished: 5, topicsResearched: 12, entitiesUpdated: 3 },
};

export default function DashboardPage() {
  const data = mockData;
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("dashboard.overview")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Badge variant="info">{t("common.demoMode")}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.visibilityScore")}
          value={data.visibilityOverview.score}
          subtitle="/ 100"
          icon={TrendingUp}
          trend={data.visibilityOverview.trend}
        />
        <StatCard
          title={t("dashboard.entityCoverage")}
          value={`${data.entityCoverage.covered}/${data.entityCoverage.total}`}
          icon={Box}
        />
        <StatCard
          title={t("dashboard.pendingApprovals")}
          value={data.pendingApprovals}
          icon={CheckCircle2}
        />
        <StatCard
          title={t("dashboard.riskAlerts")}
          value={data.riskAlerts}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PipelineChart data={data.contentPipeline} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed items={data.recentActivity} />
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
                <span className="font-medium">{data.weeklySummary.articlesPublished}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.topicsResearched")}</span>
                <span className="font-medium">{data.weeklySummary.topicsResearched}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.entitiesUpdated")}</span>
                <span className="font-medium">{data.weeklySummary.entitiesUpdated}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" /> {t("dashboard.presenceLayers")}
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
