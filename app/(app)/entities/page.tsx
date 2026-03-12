"use client";

import { useState } from "react";
import {
  Button,
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
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function EntitiesPage() {
  const t = useT();
  const { entities, addEntity, removeEntity } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Organization");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addEntity({ name: name.trim(), type, contentCount: 0, mentions: 0, updated: new Date() });
    setName("");
    setType("Organization");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeEntity(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            <TechTerm term="エンティティ">{t("entities.title")}</TechTerm>
          </h2>
          <p className="text-sm text-muted-foreground">{t("entities.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("entities.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("entities.all")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("entities.name")}</TableHead>
                <TableHead>{t("entities.type")}</TableHead>
                <TableHead>{t("entities.contentCount")}</TableHead>
                <TableHead>{t("entities.mentions")}</TableHead>
                <TableHead>{t("entities.updated")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.contentCount}</TableCell>
                  <TableCell>{e.mentions}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(e.updated)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setConfirmId(e.id)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("entities.add")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("entities.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="エンティティ名" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("entities.type")}</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Organization">Organization</option>
              <option value="Concept">Concept</option>
              <option value="Technology">Technology</option>
              <option value="Product">Product</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)} title="削除の確認">
        <p className="text-sm text-muted-foreground mb-4">このエンティティを削除しますか？この操作は取り消せません。</p>
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
