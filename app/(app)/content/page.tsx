"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Select } from "@/components/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { cn, formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockContent = [
  { id: "1", title: "デジタルプレゼンスガイド", type: "記事", status: "PUBLISHED", entity: "Digital Presence", updated: new Date(Date.now() - 3600000) },
  { id: "2", title: "AEO vs SEO", type: "記事", status: "REVIEW", entity: "AEO", updated: new Date(Date.now() - 86400000) },
  { id: "3", title: "エンティティスキーマガイド", type: "ガイド", status: "DRAFT", entity: "PresenceVision", updated: new Date(Date.now() - 172800000) },
  { id: "4", title: "GEOベストプラクティス", type: "記事", status: "APPROVED", entity: "GEO", updated: new Date(Date.now() - 259200000) },
  { id: "5", title: "レガシーFAQページ", type: "FAQ", status: "ARCHIVED", entity: "PresenceVision", updated: new Date(Date.now() - 432000000) },
];

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info" | "outline"> = {
  DRAFT: "secondary",
  REVIEW: "warning",
  APPROVED: "info",
  PUBLISHED: "success",
  ARCHIVED: "outline",
};

const statusLabel: Record<string, string> = {
  DRAFT: "下書き",
  REVIEW: "レビュー",
  APPROVED: "承認済",
  PUBLISHED: "公開済",
  ARCHIVED: "アーカイブ",
};

export default function ContentPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const t = useT();

  const filtered = mockContent.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("content.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("content.subtitle")}</p>
        </div>
        <Link href="/content" className={cn(buttonVariants(), "inline-flex")}>
          <Plus className="h-4 w-4 mr-2" />
          {t("content.new")}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base">{t("content.all")}</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">{t("content.allStatus")}</option>
                <option value="DRAFT">{statusLabel.DRAFT}</option>
                <option value="REVIEW">{statusLabel.REVIEW}</option>
                <option value="APPROVED">{statusLabel.APPROVED}</option>
                <option value="PUBLISHED">{statusLabel.PUBLISHED}</option>
                <option value="ARCHIVED">{statusLabel.ARCHIVED}</option>
              </Select>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">{t("content.allType")}</option>
                <option value="記事">記事</option>
                <option value="ガイド">ガイド</option>
                <option value="FAQ">FAQ</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("content.titleCol")}</TableHead>
                <TableHead>{t("content.type")}</TableHead>
                <TableHead>{t("content.status")}</TableHead>
                <TableHead>{t("content.entity")}</TableHead>
                <TableHead>{t("content.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/content/${c.id}`} className="hover:underline">{c.title}</Link>
                  </TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell><Badge variant={statusVariant[c.status]}>{statusLabel[c.status] ?? c.status}</Badge></TableCell>
                  <TableCell>{c.entity}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(c.updated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
