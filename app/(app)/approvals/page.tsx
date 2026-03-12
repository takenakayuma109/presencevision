"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockApprovals = [
  { id: "1", contentTitle: "AEO vs SEO 比較", requester: "admin@presencevision.dev", status: "PENDING", created: new Date(Date.now() - 3600000) },
  { id: "2", contentTitle: "エンティティスキーマガイド", requester: "writer@presencevision.dev", status: "PENDING", created: new Date(Date.now() - 7200000) },
  { id: "3", contentTitle: "デジタルプレゼンス入門", requester: "admin@presencevision.dev", status: "APPROVED", created: new Date(Date.now() - 86400000) },
  { id: "4", contentTitle: "GEOベストプラクティス", requester: "writer@presencevision.dev", status: "NEEDS_REVISION", created: new Date(Date.now() - 172800000) },
  { id: "5", contentTitle: "レガシーFAQアップデート", requester: "admin@presencevision.dev", status: "REJECTED", created: new Date(Date.now() - 259200000) },
];

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  NEEDS_REVISION: "info",
};

const statusLabel: Record<string, string> = {
  PENDING: "保留中",
  APPROVED: "承認済",
  REJECTED: "却下",
  NEEDS_REVISION: "修正必要",
};

export default function ApprovalsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("approvals.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("approvals.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("approvals.pendingRecent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("approvals.contentTitle")}</TableHead>
                <TableHead>{t("approvals.requester")}</TableHead>
                <TableHead>{t("approvals.status")}</TableHead>
                <TableHead>{t("approvals.created")}</TableHead>
                <TableHead className="w-[120px]">{t("approvals.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApprovals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.contentTitle}</TableCell>
                  <TableCell>{a.requester}</TableCell>
                  <TableCell><Badge variant={statusVariant[a.status]}>{statusLabel[a.status] ?? a.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(a.created)}</TableCell>
                  <TableCell>
                    {a.status === "PENDING" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default"><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="destructive"><X className="h-3 w-3" /></Button>
                      </div>
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
