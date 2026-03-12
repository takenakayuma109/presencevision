"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent, TechTerm } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

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
  const { complianceFlags, updateComplianceFlag } = useStore();
  const openCount = complianceFlags.filter((f) => !f.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            <TechTerm term="コンプライアンス">{t("compliance.title")}</TechTerm>
          </h2>
          <p className="text-sm text-muted-foreground">{t("compliance.subtitle")}</p>
        </div>
        <Badge variant="warning" className="text-sm px-3 py-1">
          <Shield className="h-3 w-3 mr-1" />
          {openCount}{t("compliance.openFlags")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <TechTerm term="リスクフラグ">{t("compliance.riskFlags")}</TechTerm>
          </CardTitle>
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
              {complianceFlags.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.content}</TableCell>
                  <TableCell>{f.type}</TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[f.severity]}>{severityLabel[f.severity]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.message}</TableCell>
                  <TableCell>
                    {f.resolved ? (
                      <Badge variant="success">{t("common.yes")}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateComplianceFlag(f.id, { resolved: true })}
                      >
                        解決
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
