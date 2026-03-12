"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export const techTerms: Record<string, { ja: string; en: string }> = {
  "エンティティ": { ja: "Webやデータベース上で一意に識別される人・組織・概念などの対象", en: "A uniquely identifiable person, organization, or concept on the web" },
  "Entity": { ja: "Webやデータベース上で一意に識別される人・組織・概念などの対象", en: "A uniquely identifiable person, organization, or concept on the web" },
  "AEO": { ja: "Answer Engine Optimization — AI検索エンジン（ChatGPT、Perplexity等）に最適化すること", en: "Answer Engine Optimization — optimizing for AI search engines like ChatGPT, Perplexity" },
  "GEO": { ja: "Generative Engine Optimization — 生成AI検索結果に表示されるよう最適化すること", en: "Generative Engine Optimization — optimizing to appear in AI-generated search results" },
  "SEO": { ja: "Search Engine Optimization — Google等の検索エンジンで上位表示を目指す施策", en: "Search Engine Optimization — improving visibility in search engine results" },
  "LLM引用": { ja: "大規模言語モデル（ChatGPT等）がコンテンツを回答に引用すること", en: "When large language models cite your content in their responses" },
  "LLM Citation": { ja: "大規模言語モデル（ChatGPT等）がコンテンツを回答に引用すること", en: "When large language models cite your content in their responses" },
  "ナレッジベース": { ja: "体系的に整理された知識・情報のデータベース", en: "A systematically organized database of knowledge and information" },
  "Knowledge Base": { ja: "体系的に整理された知識・情報のデータベース", en: "A systematically organized database of knowledge and information" },
  "コンテンツパイプライン": { ja: "コンテンツの企画から公開までの一連の制作フロー", en: "The workflow from content planning to publication" },
  "Content Pipeline": { ja: "コンテンツの企画から公開までの一連の制作フロー", en: "The workflow from content planning to publication" },
  "可視性スコア": { ja: "ブランドがオンラインでどれだけ見つけやすいかの指標（0-100）", en: "A metric (0-100) measuring how discoverable your brand is online" },
  "Visibility Score": { ja: "ブランドがオンラインでどれだけ見つけやすいかの指標（0-100）", en: "A metric (0-100) measuring how discoverable your brand is online" },
  "エンティティカバレッジ": { ja: "定義したエンティティのうち、十分なコンテンツがある割合", en: "The ratio of entities with sufficient content coverage" },
  "Entity Coverage": { ja: "定義したエンティティのうち、十分なコンテンツがある割合", en: "The ratio of entities with sufficient content coverage" },
  "リスクフラグ": { ja: "コンテンツの正確性・法的リスク・コンプライアンス違反の警告", en: "Warnings about content accuracy, legal risks, or compliance violations" },
  "Risk Flags": { ja: "コンテンツの正確性・法的リスク・コンプライアンス違反の警告", en: "Warnings about content accuracy, legal risks, or compliance violations" },
  "コンプライアンス": { ja: "法規制・社内規定・ブランドガイドラインの遵守", en: "Adherence to laws, regulations, and brand guidelines" },
  "Compliance": { ja: "法規制・社内規定・ブランドガイドラインの遵守", en: "Adherence to laws, regulations, and brand guidelines" },
  "ブリーフ": { ja: "コンテンツ制作の要件・方向性をまとめた指示書", en: "A document outlining content requirements and direction" },
  "Brief": { ja: "コンテンツ制作の要件・方向性をまとめた指示書", en: "A document outlining content requirements and direction" },
  "トピッククラスター": { ja: "関連トピックをグループ化したコンテンツ戦略手法", en: "A content strategy grouping related topics together" },
  "Topic Cluster": { ja: "関連トピックをグループ化したコンテンツ戦略手法", en: "A content strategy grouping related topics together" },
  "スキーママークアップ": { ja: "検索エンジンがコンテンツを理解しやすいよう構造化するコード", en: "Structured code helping search engines understand content" },
  "Schema Markup": { ja: "検索エンジンがコンテンツを理解しやすいよう構造化するコード", en: "Structured code helping search engines understand content" },
  "プレゼンスレイヤー": { ja: "デジタルプレゼンスを構成する各要素（検索、AI、知識グラフ等）", en: "Components of digital presence (search, AI, knowledge graphs, etc.)" },
  "Presence Layers": { ja: "デジタルプレゼンスを構成する各要素（検索、AI、知識グラフ等）", en: "Components of digital presence (search, AI, knowledge graphs, etc.)" },
  "デジタルプレゼンス": { ja: "ブランドのオンライン上での存在感・認知度の総体", en: "The overall online presence and visibility of a brand" },
  "Digital Presence": { ja: "ブランドのオンライン上での存在感・認知度の総体", en: "The overall online presence and visibility of a brand" },
  "FAQギャップ": { ja: "ユーザーの質問に対して自社コンテンツが回答できていない領域", en: "Areas where your content doesn't answer user questions" },
  "FAQ Gaps": { ja: "ユーザーの質問に対して自社コンテンツが回答できていない領域", en: "Areas where your content doesn't answer user questions" },
  "メンション": { ja: "SNSやWeb上でブランドが言及されること", en: "When your brand is mentioned on social media or the web" },
  "Mentions": { ja: "SNSやWeb上でブランドが言及されること", en: "When your brand is mentioned on social media or the web" },
  "モニタリング": { ja: "ブランドの言及・競合動向・検索順位などを定期的に監視すること", en: "Regularly tracking brand mentions, competitors, and search rankings" },
  "Monitoring": { ja: "ブランドの言及・競合動向・検索順位などを定期的に監視すること", en: "Regularly tracking brand mentions, competitors, and search rankings" },
  "チャネル": { ja: "コンテンツを公開・配信する媒体（ブログ、ドキュメント、SNS等）", en: "Media for publishing content (blog, docs, social media, etc.)" },
  "Channel": { ja: "コンテンツを公開・配信する媒体（ブログ、ドキュメント、SNS等）", en: "Media for publishing content (blog, docs, social media, etc.)" },
  "監査ログ": { ja: "システム上の操作履歴を記録したもの", en: "A record of system operations and changes" },
  "Audit Logs": { ja: "システム上の操作履歴を記録したもの", en: "A record of system operations and changes" },
};

interface TechTermProps {
  term: string;
  children?: React.ReactNode;
}

export function TechTerm({ term, children }: TechTermProps) {
  const { locale } = useI18n();
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const definition = techTerms[term];
  const description = definition
    ? locale === "ja"
      ? definition.ja
      : definition.en
    : null;

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTooltip]);

  return (
    <span className="relative inline-flex items-start">
      <span>{children ?? term}</span>
      {description && (
        <>
          <span
            ref={iconRef}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative -top-1 ml-0.5 inline-flex h-3 w-3 flex-shrink-0 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-muted-foreground/60 hover:border-muted-foreground hover:text-muted-foreground transition-colors"
            style={{ fontSize: "7px", lineHeight: 1 }}
            aria-label={`${term} の説明`}
          >
            i
          </span>

          {showTooltip && (
            <div
              ref={tooltipRef}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="absolute left-1/2 bottom-full mb-2 z-50 w-64 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
            >
              {/* Arrow */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px">
                <div className="h-2 w-2 rotate-45 border-b border-r bg-popover" />
              </div>

              <p className="text-xs leading-relaxed">{description}</p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(term)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block text-xs text-primary hover:underline"
              >
                もっと詳しく
              </a>
            </div>
          )}
        </>
      )}
    </span>
  );
}
