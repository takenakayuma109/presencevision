"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockPublishTargets = [
  { id: "1", content: "デジタルプレゼンスガイド", channel: "ブログ", status: "公開済", scheduled: null, url: "https://example.com/blog/digital-presence" },
  { id: "2", content: "AEO vs SEO", channel: "ブログ", status: "予定", scheduled: new Date(Date.now() + 86400000), url: null },
  { id: "3", content: "エンティティスキーマガイド", channel: "ドキュメント", status: "下書き", scheduled: null, url: null },
  { id: "4", content: "GEOベストプラクティス", channel: "ブログ", status: "公開済", scheduled: null, url: "https://example.com/blog/geo" },
  { id: "5", content: "FAQアップデート", channel: "ヘルプセンター", status: "キュー中", scheduled: new Date(Date.now() + 172800000), url: null },
];

export default function PublishPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("publish.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("publish.subtitle")}</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          {t("publish.schedule")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("publish.targets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("publish.content")}</TableHead>
                <TableHead>{t("publish.channel")}</TableHead>
                <TableHead>{t("publish.status")}</TableHead>
                <TableHead>{t("publish.scheduled")}</TableHead>
                <TableHead>{t("publish.publishedUrl")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPublishTargets.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.content}</TableCell>
                  <TableCell>{p.channel}</TableCell>
                  <TableCell><Badge variant={p.status === "公開済" ? "success" : p.status === "予定" ? "info" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.scheduled ? formatDateTime(p.scheduled) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.url ? <a href={p.url} className="text-primary hover:underline truncate block max-w-[200px]">{p.url}</a> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
