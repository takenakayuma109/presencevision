"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Dialog,
  TechTerm,
} from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

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
  const t = useT();
  const { contentItems, addContentItem, removeContentItem } = useStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("記事");
  const [entity, setEntity] = useState("");

  const filtered = contentItems.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addContentItem({
      title: title.trim(),
      type,
      status: "DRAFT",
      entity: entity.trim(),
      updated: new Date(),
    });
    setTitle("");
    setType("記事");
    setEntity("");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeContentItem(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            <TechTerm term="コンテンツパイプライン">{t("content.title")}</TechTerm>
          </h2>
          <p className="text-sm text-muted-foreground">{t("content.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("content.new")}
        </Button>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-medium">
                    <Link href={`/content/${c.id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>
                      {statusLabel[c.status] ?? c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.entity}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(c.updated)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setConfirmId(c.id)}
                      className="hidden group-hover:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Creation dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("content.new")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("content.titleCol")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="コンテンツタイトル" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("content.type")}</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="記事">記事</option>
              <option value="ガイド">ガイド</option>
              <option value="FAQ">FAQ</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("content.entity")}</label>
            <Input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="関連エンティティ" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)} title="削除の確認">
        <p className="text-sm text-muted-foreground mb-4">このコンテンツを削除しますか？この操作は取り消せません。</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmId(null)}>
            {t("common.no")}
          </Button>
          <Button variant="destructive" onClick={() => confirmId && handleDelete(confirmId)}>
            {t("common.yes")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
