"use client";

import { useState } from "react";
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Textarea, Dialog, TechTerm } from "@/components/ui";
import { Radio, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function ChannelsPage() {
  const t = useT();
  const { channels, addChannel, removeChannel } = useStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("ブログ");
  const [project, setProject] = useState("");
  const [config, setConfig] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    addChannel({
      name: name.trim(),
      type,
      project: project.trim(),
      config: config.trim(),
    });
    setName("");
    setType("ブログ");
    setProject("");
    setConfig("");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            <TechTerm term="チャネル">{t("channels.title")}</TechTerm>
          </h2>
          <p className="text-sm text-muted-foreground">{t("channels.subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t("channels.add")}</Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("channels.add")}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">名前</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="チャネル名"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">タイプ</label>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="mt-1">
              <option value="ブログ">ブログ</option>
              <option value="ドキュメント">ドキュメント</option>
              <option value="ヘルプ">ヘルプ</option>
              <option value="ウェブサイト">ウェブサイト</option>
              <option value="API">API</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t("common.project")}</label>
            <Input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="プロジェクト名"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">設定</label>
            <Textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder="URL: example.com, オプション: ..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit}>追加</Button>
          </div>
        </div>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{c.type}</Badge>
                  <button
                    onClick={() => removeChannel(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>{t("common.project")}: {c.project}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{c.config}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
