"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockBriefs = [
  { id: "1", title: "デジタルプレゼンスガイド - イントロ", topic: "デジタルプレゼンスとは？", status: "READY", created: new Date(Date.now() - 86400000) },
  { id: "2", title: "AEO vs SEO 比較", topic: "AEO vs SEO", status: "IN_PROGRESS", created: new Date(Date.now() - 172800000) },
  { id: "3", title: "エンティティスキーマのベストプラクティス", topic: "エンティティスキーマ", status: "DRAFT", created: new Date(Date.now() - 259200000) },
  { id: "4", title: "GEO最適化のコツ", topic: "GEOハウツー", status: "COMPLETED", created: new Date(Date.now() - 345600000) },
  { id: "5", title: "LLM引用ガイド", topic: "LLM引用", status: "DRAFT", created: new Date(Date.now() - 432000000) },
];

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info"> = {
  DRAFT: "secondary",
  READY: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
};

const statusLabel: Record<string, string> = {
  DRAFT: "下書き",
  READY: "準備完了",
  IN_PROGRESS: "進行中",
  COMPLETED: "完了",
};

export default function BriefsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("briefs.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("briefs.subtitle")}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("briefs.new")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("briefs.all")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("briefs.titleCol")}</TableHead>
                <TableHead>{t("briefs.topic")}</TableHead>
                <TableHead>{t("briefs.status")}</TableHead>
                <TableHead>{t("briefs.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBriefs.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.topic}</TableCell>
                  <TableCell><Badge variant={statusVariant[b.status]}>{statusLabel[b.status] ?? b.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(b.created)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
