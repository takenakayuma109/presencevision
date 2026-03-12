"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useT } from "@/lib/i18n";

interface PipelineChartProps {
  data: { draft: number; review: number; approved: number; published: number };
}

export function PipelineChart({ data }: PipelineChartProps) {
  const t = useT();
  const total = data.draft + data.review + data.approved + data.published;
  const segments = [
    { label: t("pipeline.draft"), value: data.draft, color: "bg-muted-foreground/30" },
    { label: t("pipeline.review"), value: data.review, color: "bg-warning" },
    { label: t("pipeline.approved"), value: data.approved, color: "bg-info" },
    { label: t("pipeline.published"), value: data.published, color: "bg-success" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("dashboard.contentPipeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {segments.map((seg) =>
                seg.value > 0 ? (
                  <div
                    key={seg.label}
                    className={`${seg.color} transition-all`}
                    style={{ width: `${(seg.value / total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {segments.map((seg) => (
                <div key={seg.label} className="text-center">
                  <p className="text-lg font-bold">{seg.value}</p>
                  <p className="text-xs text-muted-foreground">{seg.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("common.noContent")}</p>
        )}
      </CardContent>
    </Card>
  );
}
