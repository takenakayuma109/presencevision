"use client";

import { Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n";

const mockFlags = [
  { id: "1", content: "デジタルプレゼンスガイド", type: "正確性", severity: "medium", message: "エンティティの主張に引用が必要", resolved: false },
  { id: "2", content: "AEO vs SEO", type: "コンプライアンス", severity: "low", message: "軽微な表現の修正提案", resolved: true },
  { id: "3", content: "エンティティスキーマガイド", type: "正確性", severity: "high", message: "スキーマ例が古い", resolved: false },
  { id: "4", content: "GEOベストプラクティス", type: "法務", severity: "low", message: "商標使用OK", resolved: true },
  { id: "5", content: "FAQアップデート", type: "正確性", severity: "medium", message: "ファクトチェックが必要", resolved: false },
];

const severityVariant: Record<string, "info" | "warning" | "destructive"> = {
  low: "info",
  medium: "warning",
  high: "destructive",
};

const severityLabel: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export default function CompliancePage() {
  const t = useT();
  const openCount = mockFlags.filter((f) => !f.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("compliance.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("compliance.subtitle")}</p>
        </div>
        <Badge variant="warning" className="text-sm px-3 py-1">
          <Shield className="h-3 w-3 mr-1" />
          {openCount}{t("compliance.openFlags")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("compliance.riskFlags")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("compliance.content")}</TableHead>
                <TableHead>{t("compliance.type")}</TableHead>
                <TableHead>{t("compliance.severity")}</TableHead>
                <TableHead>{t("compliance.message")}</TableHead>
                <TableHead>{t("compliance.resolved")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFlags.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.content}</TableCell>
                  <TableCell>{f.type}</TableCell>
                  <TableCell><Badge variant={severityVariant[f.severity]}>{severityLabel[f.severity]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{f.message}</TableCell>
                  <TableCell>{f.resolved ? <Badge variant="success">{t("common.yes")}</Badge> : <Badge variant="secondary">{t("common.no")}</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
