"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  "リスクアラート": { ja: "コンテンツや運用上のリスクを通知する警告", en: "Alerts notifying about content or operational risks" },
  "承認キュー": { ja: "公開前のコンテンツが承認待ちとなる待ち行列", en: "A queue of content awaiting approval before publication" },
  "ダッシュボード": { ja: "主要指標やアクティビティを一覧表示する管理画面", en: "A management screen displaying key metrics and activity" },
  "プロジェクト": { ja: "関連するエンティティ・トピック・コンテンツをまとめた作業単位", en: "A unit of work grouping related entities, topics, and content" },
  "トピック": { ja: "コンテンツ制作の対象となるテーマ・話題", en: "A theme or subject targeted for content creation" },
  "コンテンツ": { ja: "Web上で公開する記事・ガイド・FAQなどの情報", en: "Information published on the web such as articles, guides, and FAQs" },
  "コンテンツスタジオ": { ja: "コンテンツの作成・編集・管理を行う制作環境", en: "A production environment for creating, editing, and managing content" },
  "レポート": { ja: "パフォーマンスや活動の分析結果をまとめた報告書", en: "A report summarizing performance and activity analysis" },
  "ジョブ": { ja: "バックグラウンドで実行される自動処理タスク", en: "An automated task running in the background" },
  "リサーチ": { ja: "トピックやキーワードの調査・分析活動", en: "Research and analysis of topics and keywords" },
  "カレンダー": { ja: "コンテンツの制作・公開スケジュールを管理するツール", en: "A tool for managing content production and publication schedules" },
  "パブリッシュ": { ja: "コンテンツを各チャネルに公開・配信すること", en: "Publishing and distributing content to channels" },
  "スラッグ": { ja: "URLの一部として使われる識別子（例: my-workspace）", en: "A URL-friendly identifier (e.g., my-workspace)" },
  "APIキー": { ja: "外部サービスと連携するための認証キー", en: "An authentication key for integrating with external services" },
  "キーワードクラスター": { ja: "関連キーワードをグループ化した検索戦略手法", en: "A search strategy grouping related keywords together" },
  "エンティティギャップ": { ja: "エンティティに対するコンテンツが不足している領域", en: "Areas where entity content coverage is insufficient" },
  "ブログ": { ja: "定期的に更新されるWebメディアの記事形式", en: "A regularly updated web article format" },
  "ドキュメント": { ja: "製品やサービスの使い方を解説する技術文書", en: "Technical documentation explaining product or service usage" },
  "レビュー": { ja: "コンテンツの品質・正確性を確認する審査プロセス", en: "A review process to verify content quality and accuracy" },
  "アーカイブ": { ja: "使用しなくなったコンテンツを保管すること", en: "Storing content that is no longer actively used" },
  "ステータス": { ja: "コンテンツやタスクの現在の進行状況", en: "The current progress status of content or tasks" },
  "インテント": { ja: "ユーザーの検索意図（情報提供・比較・ハウツー等）", en: "User search intent (informational, comparison, how-to, etc.)" },
  "バックログ": { ja: "着手前のタスクや計画が保管されるリスト", en: "A list of tasks and plans waiting to be started" },
  "ナビゲーション": { ja: "特定のページやサイトに直接たどり着くための検索意図", en: "Search intent aimed at reaching a specific page or site" },
  "ハウツー": { ja: "手順や方法を解説するコンテンツ形式", en: "A content format explaining procedures and methods" },
  "センチメント": { ja: "ブランドへの言及がポジティブ・中立・ネガティブかの評価", en: "Evaluating whether brand mentions are positive, neutral, or negative" },
  "グローバルナレッジ": { ja: "世界規模の検索エンジンやAIが参照する知識層", en: "Knowledge layer referenced by global search engines and AI" },
  "ローカルマーケット": { ja: "特定地域の市場におけるデジタルプレゼンス", en: "Digital presence in a specific local market" },
  "構造化ナレッジ": { ja: "スキーママークアップ等で構造化された知識データ", en: "Knowledge data structured with schema markup, etc." },
  "ワークスペース": { ja: "チームやプロジェクトの作業環境・管理単位", en: "A work environment and management unit for teams or projects" },
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const definition = techTerms[term];
  const description = definition
    ? locale === "ja"
      ? definition.ja
      : definition.en
    : null;

  const updatePosition = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, []);

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

  const handleShow = () => {
    updatePosition();
    setShowTooltip(true);
  };

  return (
    <span className="inline-flex items-start">
      <span>{children ?? term}</span>
      {description && (
        <>
          <span
            ref={iconRef}
            onMouseEnter={handleShow}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={handleShow}
            className="relative -top-1 ml-0.5 inline-flex h-3 w-3 flex-shrink-0 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-muted-foreground/60 hover:border-muted-foreground hover:text-muted-foreground transition-colors"
            style={{ fontSize: "7px", lineHeight: 1 }}
            aria-label={`${term} の説明`}
          >
            i
          </span>

          {showTooltip && pos && createPortal(
            <div
              ref={tooltipRef}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="fixed z-[9999] w-72 rounded-lg border bg-popover px-4 py-3 text-popover-foreground shadow-xl"
              style={{
                top: pos.top - 8,
                left: pos.left,
                transform: "translate(-50%, -100%)",
              }}
            >
              {/* Arrow */}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2"
                style={{ marginTop: "-1px" }}
              >
                <div className="h-2.5 w-2.5 rotate-45 border-b border-r bg-popover" />
              </div>

              <p className="text-sm leading-relaxed font-normal">{description}</p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(term)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                もっと詳しく →
              </a>
            </div>,
            document.body,
          )}
        </>
      )}
    </span>
  );
}
