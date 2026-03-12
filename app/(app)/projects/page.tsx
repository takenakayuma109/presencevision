"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Dialog,
  TechTerm,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function ProjectsPage() {
  const t = useT();
  const { projects, addProject, removeProject } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProject({ name: name.trim(), description: description.trim(), entities: 0, topics: 0, content: 0 });
    setName("");
    setDescription("");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeProject(id);
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("projects.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("projects.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("projects.new")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="relative group">
            <Link href={`/projects/${project.id}`}>
              <Card className={cn("h-full transition-colors hover:bg-muted/50")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <FolderKanban className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <Badge variant="secondary">
                      {project.entities} <TechTerm term="エンティティ">{t("projects.entities")}</TechTerm>
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span><TechTerm term="トピッククラスター">{t("projects.topics")}</TechTerm>: {project.topics}</span>
                    <span><TechTerm term="コンテンツパイプライン">{t("projects.content")}</TechTerm>: {project.content}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setConfirmId(project.id);
              }}
              className="absolute top-2 right-2 hidden group-hover:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Creation dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("projects.new")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名前</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="プロジェクト名" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">説明</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="プロジェクトの説明" />
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
        <p className="text-sm text-muted-foreground mb-4">このプロジェクトを削除しますか？この操作は取り消せません。</p>
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
