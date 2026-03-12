"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Eye, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

const mockMentions = [
  { id: "1", source: "Twitter", snippet: "PresenceVisionのAEO機能を発見 - コンテンツ戦略が変わる！", sentiment: "positive", time: "2時間前" },
  { id: "2", source: "Reddit", snippet: "PresenceVisionを試した方いますか？導入前にフィードバックを聞きたい。", sentiment: "neutral", time: "5時間前" },
  { id: "3", source: "LinkedIn", snippet: "チームでPresenceVisionを使ったデジタルプレゼンス最適化を導入中。", sentiment: "positive", time: "1日前" },
  { id: "4", source: "Hacker News", snippet: "PresenceVisionは価格に対して過大評価されている気がする。", sentiment: "negative", time: "2日前" },
  { id: "5", source: "ブログ", snippet: "PresenceVisionはブランドのAI検索最適化を支援。", sentiment: "positive", time: "3日前" },
];

const mockFaqGaps = [
  { question: "PresenceVisionとは？", status: "未対応" },
  { question: "AEOとSEOの違いは？", status: "一部対応" },
  { question: "エンタープライズ料金は？", status: "未対応" },
];

const mockCompetitorUpdates = [
  { competitor: "ブランドA", update: "新しいAEO特化型プロダクトページをローンチ", date: "1日前" },
  { competitor: "ブランドB", update: "ホームページのエンティティスキーマを更新", date: "2日前" },
  { competitor: "ブランドC", update: "GEO最適化ガイドを公開", date: "3日前" },
];

const sentimentVariant: Record<string, "success" | "secondary" | "destructive"> = {
  positive: "success",
  neutral: "secondary",
  negative: "destructive",
};

const sentimentLabel: Record<string, string> = {
  positive: "ポジティブ",
  neutral: "中立",
  negative: "ネガティブ",
};

export default function MonitoringPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("monitoring.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("monitoring.subtitle")}</p>
        </div>
        <Button>
          <Eye className="h-4 w-4 mr-2" />
          {t("monitoring.run")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("monitoring.recentMentions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockMentions.map((m) => (
                <div key={m.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{m.source}</Badge>
                    <Badge variant={sentimentVariant[m.sentiment]}>{sentimentLabel[m.sentiment]}</Badge>
                  </div>
                  <p className="text-sm">{m.snippet}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {t("monitoring.faqGaps")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockFaqGaps.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm">{f.question}</p>
                    <Badge variant={f.status === "未対応" ? "warning" : "secondary"}>{f.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("monitoring.competitorUpdates")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockCompetitorUpdates.map((c, i) => (
                  <div key={i} className="py-2 border-b last:border-0">
                    <p className="font-medium text-sm">{c.competitor}</p>
                    <p className="text-sm text-muted-foreground">{c.update}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.date}</p>
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
