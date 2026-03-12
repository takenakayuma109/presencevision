"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BarChart3, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockReports = [
  { id: "1", title: "週間サマリー - 3月10日", type: "weekly", date: new Date(Date.now() - 86400000) },
  { id: "2", title: "デイリーダイジェスト - 3月11日", type: "daily", date: new Date(Date.now() - 3600000) },
  { id: "3", title: "月間概要 - 2025年2月", type: "monthly", date: new Date(Date.now() - 2592000000) },
  { id: "4", title: "週間サマリー - 3月3日", type: "weekly", date: new Date(Date.now() - 604800000) },
  { id: "5", title: "デイリーダイジェスト - 3月9日", type: "daily", date: new Date(Date.now() - 172800000) },
];

const typeVariant: Record<string, "secondary" | "info" | "default"> = {
  daily: "secondary",
  weekly: "info",
  monthly: "default",
};

const typeLabel: Record<string, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
};

const mockWeeklySummary = {
  articlesPublished: 5,
  topicsResearched: 12,
  entitiesUpdated: 3,
  visibilityScore: 72,
  topContent: ["デジタルプレゼンスガイド", "AEO vs SEO", "エンティティスキーマ"],
};

export default function ReportsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("reports.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
        </div>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          {t("reports.generate")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> {t("reports.weeklySummary")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("reports.weeklySummaryDesc")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.articlesPublished")}</p>
              <p className="text-2xl font-semibold">{mockWeeklySummary.articlesPublished}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.topicsResearched")}</p>
              <p className="text-2xl font-semibold">{mockWeeklySummary.topicsResearched}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.entitiesUpdated")}</p>
              <p className="text-2xl font-semibold">{mockWeeklySummary.entitiesUpdated}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.visibilityScore")}</p>
              <p className="text-2xl font-semibold">{mockWeeklySummary.visibilityScore}/100</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">{t("reports.topContent")}</p>
            <div className="flex flex-wrap gap-2">
              {mockWeeklySummary.topContent.map((c) => (
                <Badge key={c} variant="outline">{c}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockReports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Badge variant={typeVariant[r.type]}>{typeLabel[r.type] ?? r.type}</Badge>
              </div>
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{formatDate(r.date)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
