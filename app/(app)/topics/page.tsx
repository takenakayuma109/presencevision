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
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const statusVariant: Record<string, "secondary" | "warning" | "success"> = {
  backlog: "secondary",
  in_progress: "warning",
  completed: "success",
};

const statusLabel: Record<string, Record<string, string>> = {
  backlog: { ja: "バックログ", en: "backlog" },
  in_progress: { ja: "進行中", en: "in progress" },
  completed: { ja: "完了", en: "completed" },
};

export default function TopicsPage() {
  const t = useT();
  const { topics, addTopic, removeTopic } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [intent, setIntent] = useState("情報提供");
  const [priority, setPriority] = useState("中");
  const [cluster, setCluster] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTopic({
      title: title.trim(),
      intent,
      priority,
      status: "backlog",
      cluster: cluster.trim(),
    });
    setTitle("");
    setIntent("情報提供");
    setPriority("中");
    setCluster("");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeTopic(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("topics.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("topics.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("topics.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("topics.all")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("topics.titleCol")}</TableHead>
                <TableHead>{t("topics.intent")}</TableHead>
                <TableHead>{t("topics.priority")}</TableHead>
                <TableHead>{t("topics.status")}</TableHead>
                <TableHead>
                  <TechTerm term="トピッククラスター">{t("topics.cluster")}</TechTerm>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id} className="group">
                  <TableCell className="font-medium">{topic.title}</TableCell>
                  <TableCell>{topic.intent}</TableCell>
                  <TableCell>{topic.priority}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[topic.status]}>
                      {statusLabel[topic.status]?.ja ?? topic.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{topic.cluster}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setConfirmId(topic.id)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("topics.add")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("topics.titleCol")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="トピックタイトル" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("topics.intent")}</label>
            <Select value={intent} onChange={(e) => setIntent(e.target.value)}>
              <option value="情報提供">情報提供</option>
              <option value="比較">比較</option>
              <option value="ハウツー">ハウツー</option>
              <option value="ナビゲーション">ナビゲーション</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("topics.priority")}</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              <TechTerm term="トピッククラスター">{t("topics.cluster")}</TechTerm>
            </label>
            <Input value={cluster} onChange={(e) => setCluster(e.target.value)} placeholder="クラスター名" />
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
        <p className="text-sm text-muted-foreground mb-4">このトピックを削除しますか？この操作は取り消せません。</p>
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
