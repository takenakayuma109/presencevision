"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Radio } from "lucide-react";
import { useT } from "@/lib/i18n";

const mockChannels = [
  { id: "1", name: "メインブログ", type: "ブログ", project: "デジタルプレゼンスガイド", config: "URL: blog.example.com, 自動公開: 有効" },
  { id: "2", name: "ドキュメント", type: "ドキュメント", project: "ブランドナレッジベース", config: "URL: docs.example.com, バージョン: v2" },
  { id: "3", name: "ヘルプセンター", type: "ヘルプ", project: "デジタルプレゼンスガイド", config: "URL: help.example.com, FAQ同期: 有効" },
  { id: "4", name: "プロダクトページ", type: "ウェブサイト", project: "ブランドナレッジベース", config: "URL: example.com, スキーマ: Product" },
  { id: "5", name: "APIドキュメント", type: "API", project: "プロダクトローンチ 2025", config: "URL: api.example.com, OpenAPI 3.0" },
];

export default function ChannelsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("channels.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("channels.subtitle")}</p>
        </div>
        <Button>{t("channels.add")}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockChannels.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{c.type}</Badge>
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
