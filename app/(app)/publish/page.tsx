"use client";

import { useState } from "react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input, Select, Dialog } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function PublishPage() {
  const t = useT();
  const { publishTargets, addPublishTarget } = useStore();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("ブログ");
  const [scheduled, setScheduled] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    addPublishTarget({
      content: content.trim(),
      channel,
      status: "予定",
      scheduled: scheduled ? new Date(scheduled) : null,
      url: null,
    });
    setContent("");
    setChannel("ブログ");
    setScheduled("");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("publish.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("publish.subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          {t("publish.schedule")}
        </Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("publish.schedule")}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("publish.content")}</label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("publish.content")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("publish.channel")}</label>
            <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="mt-1">
              <option value="ブログ">ブログ</option>
              <option value="ドキュメント">ドキュメント</option>
              <option value="ヘルプセンター">ヘルプセンター</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t("publish.scheduled")}</label>
            <Input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="mt-1"
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
              {publishTargets.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.content}</TableCell>
                  <TableCell>{p.channel}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "公開済" ? "success" : p.status === "予定" ? "info" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.scheduled ? formatDateTime(p.scheduled) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.url ? (
                      <a href={p.url} className="text-primary hover:underline truncate block max-w-[200px]">
                        {p.url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
