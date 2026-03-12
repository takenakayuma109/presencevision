"use client";

import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n";

const mockTopicOpportunities = [
  { title: "デジタルプレゼンス vs ブランド認知", score: 0.92, intent: "比較" },
  { title: "ECサイトのAEO", score: 0.88, intent: "情報提供" },
  { title: "エンティティスキーママークアップガイド", score: 0.85, intent: "ハウツー" },
];

const mockKeywordClusters = [
  { cluster: "デジタルプレゼンス", keywords: ["デジタルプレゼンス", "オンライン可視性", "ブランドプレゼンス"], volume: "高" },
  { cluster: "AEO", keywords: ["アンサーエンジン最適化", "AEO戦略", "AI検索"], volume: "中" },
];

const mockFaqTopics = [
  { question: "デジタルプレゼンスとは？", source: "Google SGE" },
  { question: "AEOとSEOの違いは？", source: "Perplexity" },
  { question: "エンティティベースのコンテンツとは？", source: "ChatGPT" },
];

const mockEntityGaps = [
  { entity: "PresenceVision", gap: "製品機能のドキュメントが不十分", priority: "高" },
  { entity: "AEO", gap: "比較コンテンツが不足", priority: "中" },
];

export default function ResearchPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("research.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("research.subtitle")}</p>
        </div>
        <Button>
          <Search className="h-4 w-4 mr-2" />
          {t("research.run")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("research.topicOpportunities")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("research.topicOpportunitiesDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTopicOpportunities.map((topic, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.intent}</p>
                  </div>
                  <Badge variant="info">{(topic.score * 100).toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("research.keywordClusters")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("research.keywordClustersDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockKeywordClusters.map((c, i) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{c.cluster}</p>
                    <Badge variant="secondary">{c.volume}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.keywords.join(" · ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("research.faqTopics")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("research.faqTopicsDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockFaqTopics.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm">{f.question}</p>
                  <Badge variant="outline">{f.source}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("research.entityGaps")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("research.entityGapsDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockEntityGaps.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{g.entity}</p>
                    <p className="text-xs text-muted-foreground">{g.gap}</p>
                  </div>
                  <Badge variant={g.priority === "高" ? "warning" : "secondary"}>{g.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
