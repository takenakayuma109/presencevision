"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Zap } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockJobs = [
  { id: "1", type: "リサーチ", project: "デジタルプレゼンスガイド", status: "completed", created: new Date(Date.now() - 3600000), completed: new Date(Date.now() - 3500000) },
  { id: "2", type: "エンティティ同期", project: "ブランドナレッジベース", status: "processing", created: new Date(Date.now() - 1800000), completed: null },
  { id: "3", type: "モニタリング", project: "全体", status: "queued", created: new Date(Date.now() - 900000), completed: null },
  { id: "4", type: "レポート生成", project: "AEO戦略", status: "completed", created: new Date(Date.now() - 86400000), completed: new Date(Date.now() - 86350000) },
  { id: "5", type: "コンテンツインデックス", project: "デジタルプレゼンスガイド", status: "failed", created: new Date(Date.now() - 172800000), completed: null },
];

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  queued: "secondary",
  processing: "warning",
  completed: "success",
  failed: "destructive",
};

const statusLabel: Record<string, string> = {
  queued: "キュー中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};

export default function JobsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("jobs.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("jobs.subtitle")}</p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          {t("jobs.enqueue")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("jobs.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("jobs.type")}</TableHead>
                <TableHead>{t("jobs.project")}</TableHead>
                <TableHead>{t("jobs.status")}</TableHead>
                <TableHead>{t("jobs.created")}</TableHead>
                <TableHead>{t("jobs.completed")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.type}</TableCell>
                  <TableCell>{j.project}</TableCell>
                  <TableCell><Badge variant={statusVariant[j.status]}>{statusLabel[j.status]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(j.created)}</TableCell>
                  <TableCell className="text-muted-foreground">{j.completed ? formatDateTime(j.completed) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
