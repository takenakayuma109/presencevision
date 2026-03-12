"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

const mockTopics = [
  { id: "1", title: "デジタルプレゼンスとは？", intent: "情報提供", priority: "高", status: "completed", cluster: "コア" },
  { id: "2", title: "AEO vs SEO 比較", intent: "比較", priority: "中", status: "in_progress", cluster: "戦略" },
  { id: "3", title: "GEO最適化の方法", intent: "ハウツー", priority: "中", status: "backlog", cluster: "戦術" },
  { id: "4", title: "エンティティベースのコンテンツ戦略", intent: "情報提供", priority: "高", status: "completed", cluster: "コア" },
  { id: "5", title: "LLM引用のベストプラクティス", intent: "ハウツー", priority: "低", status: "backlog", cluster: "戦術" },
];

const statusVariant: Record<string, "secondary" | "warning" | "success"> = {
  backlog: "secondary",
  in_progress: "warning",
  completed: "success",
};

const statusLabel: Record<string, Record<string, string>> = {
  backlog: { ja: "バックログ", en: "backlog" },
  in_progress: { ja: "進行中", en: "in progress" },
  completed: { ja: "完了", en: "completed" },
};

export default function TopicsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("topics.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("topics.subtitle")}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("topics.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("topics.all")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("topics.titleCol")}</TableHead>
                <TableHead>{t("topics.intent")}</TableHead>
                <TableHead>{t("topics.priority")}</TableHead>
                <TableHead>{t("topics.status")}</TableHead>
                <TableHead>{t("topics.cluster")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.title}</TableCell>
                  <TableCell>{topic.intent}</TableCell>
                  <TableCell>{topic.priority}</TableCell>
                  <TableCell><Badge variant={statusVariant[topic.status]}>{statusLabel[topic.status]?.ja ?? topic.status}</Badge></TableCell>
                  <TableCell>{topic.cluster}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
