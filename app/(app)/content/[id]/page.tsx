"use client";

import { useParams } from "next/navigation";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, TechTerm } from "@/components/ui";
import { Download, Send, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, "secondary" | "warning" | "success" | "info" | "destructive"> = {
  DRAFT: "secondary",
  REVIEW: "warning",
  APPROVED: "info",
  PUBLISHED: "success",
  ARCHIVED: "destructive",
};

const statusLabel: Record<string, string> = {
  DRAFT: "下書き",
  REVIEW: "レビュー中",
  APPROVED: "承認済",
  PUBLISHED: "公開済",
  ARCHIVED: "アーカイブ",
};

const sampleMarkdown = `# デジタルプレゼンスガイド

## デジタルプレゼンスとは？

デジタルプレゼンスとは、ブランドがオンライン上でどのように表示されるかを指します。検索エンジン、AIアシスタント、ナレッジパネルなど、あらゆるチャネルが対象です。

## 主要な構成要素

1. **エンティティカバレッジ** - ブランドのエンティティがどれだけ適切に表現されているか
2. **コンテンツ品質** - 権威ある、よく構造化されたコンテンツ
3. **引用シグナル** - 権威を裏付けるバックリンクやメンション

## ベストプラクティス

- Web全体でNAP（名前・住所・電話番号）の一貫性を維持する
- よくある質問に答えるエンティティ中心のコンテンツを作成する
- アンサーエンジン（AEO）とジェネレーティブ検索（GEO）に最適化する
`;

const sampleVersions = [
  { id: "v1", created: new Date(Date.now() - 86400000), author: "admin" },
  { id: "v2", created: new Date(Date.now() - 3600000), author: "admin" },
];

const sampleEvidence = [
  { id: "1", type: "ソース", text: "Google SGE - デジタルプレゼンスの定義", url: "#" },
  { id: "2", type: "エンティティ", text: "PresenceVision - 会社概要", url: "#" },
];

export default function ContentDetailPage() {
  const params = useParams();
  const t = useT();
  const { contentItems } = useStore();

  const content = contentItems.find((c) => c.id === params.id);

  if (!content) {
    return (
      <div className="space-y-6">
        <Link href="/content" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
        <p className="text-sm text-muted-foreground">コンテンツが見つかりません。</p>
      </div>
    );
  }

  const markdown = content.markdown || sampleMarkdown;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/content" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{content.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[content.status]}>{statusLabel[content.status] ?? content.status}</Badge>
            <span className="text-sm text-muted-foreground">
              <TechTerm term="エンティティ">エンティティ</TechTerm>: {content.entity}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Markdownエクスポート
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            承認申請
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">マークダウンプレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">{markdown}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">バージョン履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleVersions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <span className="font-medium">{v.id}</span>
                    <span className="text-muted-foreground">{formatDateTime(v.created)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">エビデンス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleEvidence.map((e) => (
                  <div key={e.id} className="py-2 border-b last:border-0">
                    <Badge variant="secondary" className="mb-1">{e.type}</Badge>
                    <p className="text-sm">{e.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
