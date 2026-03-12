"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockLogs = [
  { id: "1", action: "content.published", resource: "デジタルプレゼンスガイド", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 3600000) },
  { id: "2", action: "entity.updated", resource: "PresenceVision", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 7200000) },
  { id: "3", action: "brief.created", resource: "AEO vs SEO", user: "writer@presencevision.dev", timestamp: new Date(Date.now() - 86400000) },
  { id: "4", action: "approval.approved", resource: "エンティティスキーマガイド", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 172800000) },
  { id: "5", action: "research.completed", resource: "デジタルプレゼンスガイド", user: "system", timestamp: new Date(Date.now() - 259200000) },
];

export default function AuditLogsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("auditLogs.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("auditLogs.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("auditLogs.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("auditLogs.action")}</TableHead>
                <TableHead>{t("auditLogs.resource")}</TableHead>
                <TableHead>{t("auditLogs.user")}</TableHead>
                <TableHead>{t("auditLogs.timestamp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
