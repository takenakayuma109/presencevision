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
  Dialog,
  TechTerm,
} from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

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
  const { briefs, addBrief, removeBrief } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addBrief({
      title: title.trim(),
      topic: topic.trim(),
      status: "DRAFT",
      created: new Date(),
    });
    setTitle("");
    setTopic("");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeBrief(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            <TechTerm term="ブリーフ">{t("briefs.title")}</TechTerm>
          </h2>
          <p className="text-sm text-muted-foreground">{t("briefs.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {briefs.map((b) => (
                <TableRow key={b.id} className="group">
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.topic}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[b.status]}>
                      {statusLabel[b.status] ?? b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(b.created)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setConfirmId(b.id)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("briefs.new")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("briefs.titleCol")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ブリーフタイトル" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("briefs.topic")}</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="関連トピック" />
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
        <p className="text-sm text-muted-foreground mb-4">このブリーフを削除しますか？この操作は取り消せません。</p>
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
