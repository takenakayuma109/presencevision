"use client";

import { useState } from "react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Dialog, Input, Select } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Zap } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  queued: "secondary",
  processing: "warning",
  completed: "success",
  failed: "destructive",
};

const statusLabel: Record<string, string> = {
  queued: "キュー中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};

const jobTypes = ["リサーチ", "エンティティ同期", "モニタリング", "レポート生成", "コンテンツインデックス"];

export default function JobsPage() {
  const t = useT();
  const { jobs, addJob } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState(jobTypes[0]);
  const [newProject, setNewProject] = useState("");

  const handleAdd = () => {
    if (!newProject.trim()) return;
    addJob({
      type: newType,
      project: newProject.trim(),
      status: "queued",
      created: new Date(),
      completed: null,
    });
    setNewType(jobTypes[0]);
    setNewProject("");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("jobs.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("jobs.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Zap className="h-4 w-4 mr-2" />
          {t("jobs.enqueue")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("jobs.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("jobs.type")}</TableHead>
                <TableHead>{t("jobs.project")}</TableHead>
                <TableHead>{t("jobs.status")}</TableHead>
                <TableHead>{t("jobs.created")}</TableHead>
                <TableHead>{t("jobs.completed")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.type}</TableCell>
                  <TableCell>{j.project}</TableCell>
                  <TableCell><Badge variant={statusVariant[j.status]}>{statusLabel[j.status]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(j.created)}</TableCell>
                  <TableCell className="text-muted-foreground">{j.completed ? formatDateTime(j.completed) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="ジョブ追加">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("jobs.type")}</label>
            <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {jobTypes.map((jt) => (
                <option key={jt} value={jt}>{jt}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("jobs.project")}</label>
            <Input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="プロジェクト名"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAdd}>追加</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
