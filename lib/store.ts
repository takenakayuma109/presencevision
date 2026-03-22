"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import React from "react";
import {
  startEngine,
  stopEngine,
  getActivities,
  getStats,
  activitiesToExecutions,
  activitiesToTaskActivities,
  type CmsConfig,
} from "./engine-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiteInfo {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  language?: string;
  industry?: string;
  suggestedKeywords?: string[];
}

export type PresenceGoal =
  | "brand_awareness"
  | "lead_generation"
  | "thought_leadership"
  | "product_visibility"
  | "local_presence"
  | "llm_citation";

export type PresenceMethod =
  | "seo"
  | "aeo"
  | "geo"
  | "content_marketing"
  | "knowledge_graph"
  | "schema_markup"
  | "faq_optimization"
  | "multilingual";

export type TargetAudience =
  | "b2b_enterprise"
  | "b2b_smb"
  | "b2c_general"
  | "developers"
  | "marketing_professionals"
  | "executives";

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const availableCountries: Country[] = [
  { code: "JP", name: "日本", flag: "🇯🇵" },
  { code: "US", name: "アメリカ", flag: "🇺🇸" },
  { code: "GB", name: "イギリス", flag: "🇬🇧" },
  { code: "DE", name: "ドイツ", flag: "🇩🇪" },
  { code: "FR", name: "フランス", flag: "🇫🇷" },
  { code: "KR", name: "韓国", flag: "🇰🇷" },
  { code: "CN", name: "中国", flag: "🇨🇳" },
  { code: "TW", name: "台湾", flag: "🇹🇼" },
  { code: "SG", name: "シンガポール", flag: "🇸🇬" },
  { code: "AU", name: "オーストラリア", flag: "🇦🇺" },
  { code: "CA", name: "カナダ", flag: "🇨🇦" },
  { code: "IN", name: "インド", flag: "🇮🇳" },
  { code: "BR", name: "ブラジル", flag: "🇧🇷" },
  { code: "GLOBAL", name: "グローバル（全世界）", flag: "🌐" },
];

export type TaskStatus = "running" | "waiting" | "completed" | "error";

export interface TaskActivity {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export type ArtifactType = "screenshot" | "link" | "content" | "code" | "data";

export interface ExecutionArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description?: string;
  url?: string;           // for links and screenshots
  thumbnailUrl?: string;  // screenshot preview
  content?: string;       // for content/code previews
  language?: string;      // language of the content
  metadata?: Record<string, string>;
  /** How this artifact was created (e.g., "Ollama llama3.1", "Playwright", "Google Search") */
  source?: string;
  /** Where this artifact was published/deployed (e.g., URL, "Draft", page path) */
  destination?: string;
  /** Current status: draft, published, verified, error */
  publishStatus?: "draft" | "published" | "verified" | "error";
}

export interface TaskExecution {
  id: string;
  cycleNumber: number;
  startedAt: Date;
  completedAt: Date;
  status: "success" | "partial" | "error";
  targetRegion: string;      // country code or "GLOBAL"
  targetLanguage: string;    // e.g. "ja", "en", "zh"
  actions: string[];         // specific actions taken
  results: string[];         // what was produced
  metrics?: { itemsProcessed: number; itemsGenerated: number };
  artifacts: ExecutionArtifact[];
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  method: PresenceMethod;
  priority: "high" | "medium" | "low";
  status: TaskStatus;
  whatItDoes: string;
  howItWorks: string;
  expectedOutput: string;
  activities: TaskActivity[];
  executions: TaskExecution[];
  cycleCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

export interface GeneratedPlan {
  summary: string;
  tasks: PlanTask[];
  estimatedImpact: string;
  duration: string;
}

export interface ReportConfig {
  morningTime: string;
  eveningTime: string;
  emailAddresses: string[];
  enabled: boolean;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  siteInfo: SiteInfo | null;
  keywords: string[];
  competitors: string[];
  brandName: string;
  goals: PresenceGoal[];
  businessCountries: string[];
  presenceCountries: string[];
  audiences: TargetAudience[];
  methods: PresenceMethod[];
  duration: "1month" | "3months" | "6months" | "12months";
  additionalNotes: string;
  reportConfig: ReportConfig;
  cmsConfig?: CmsConfig;
  generatedPlan: GeneratedPlan | null;
  isAnalyzing: boolean;
  isGeneratingPlan: boolean;
}

export type ProjectStatus = "active" | "paused" | "completed";

export interface ProjectReport {
  id: string;
  title: string;
  type: "morning" | "evening" | "milestone";
  date: Date;
  summary: string;
  details: string[];
  metrics: ReportMetrics;
}

export interface ReportMetrics {
  visibilityScore: number;
  visibilityDelta: number;
  contentGenerated: number;
  schemaDeployed: number;
  mentionsFound: number;
  llmCitations: number;
  tasksRunning: number;
}

export type { CmsConfig };

export type ChannelCategory = "social" | "blog" | "qa" | "directory" | "press" | "forum";

export interface DistributionChannelConfig {
  type: string;
  name: string;
  category: ChannelCategory;
  regions: string[];
  languages: string[];
  requiresAuth: boolean;
  enabled: boolean;
  rateLimit: { maxPerHour: number; cooldownMs: number };
}

export interface Project {
  id: string;
  name: string;
  url: string;
  siteInfo: SiteInfo;
  goals: PresenceGoal[];
  businessCountries: string[];
  presenceCountries: string[];
  audiences: TargetAudience[];
  methods: PresenceMethod[];
  duration: string;
  additionalNotes: string;
  keywords: string[];
  competitors: string[];
  brandName: string;
  reportConfig: ReportConfig;
  cmsConfig?: CmsConfig;
  channels?: DistributionChannelConfig[];
  enabledChannels?: string[];
  channelCredentials?: Record<string, { username?: string; password?: string }>;
  plan: GeneratedPlan;
  status: ProjectStatus;
  createdAt: Date;
  reports: ProjectReport[];
  selectedTaskId: string | null;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const goalLabels: Record<PresenceGoal, string> = {
  brand_awareness: "ブランド認知の向上",
  lead_generation: "リード獲得",
  thought_leadership: "ソートリーダーシップ確立",
  product_visibility: "プロダクトの可視化",
  local_presence: "ローカル検索での存在感",
  llm_citation: "AI/LLMでの引用強化",
};

export const methodLabels: Record<PresenceMethod, string> = {
  seo: "SEO（検索エンジン最適化）",
  aeo: "AEO（回答エンジン最適化）",
  geo: "GEO（生成AI最適化）",
  content_marketing: "コンテンツマーケティング",
  knowledge_graph: "ナレッジグラフ構築",
  schema_markup: "構造化データ（Schema.org）",
  faq_optimization: "FAQ最適化",
  multilingual: "多言語コンテンツ",
};

export const audienceLabels: Record<TargetAudience, string> = {
  b2b_enterprise: "法人（エンタープライズ）",
  b2b_smb: "法人（中小企業）",
  b2c_general: "一般消費者",
  developers: "開発者・エンジニア",
  marketing_professionals: "マーケティング担当者",
  executives: "経営層・意思決定者",
};

export const durationLabels: Record<string, string> = {
  "1month": "1ヶ月",
  "3months": "3ヶ月",
  "6months": "6ヶ月",
  "12months": "12ヶ月",
};

export const statusLabels: Record<ProjectStatus, string> = {
  active: "稼働中",
  paused: "一時停止",
  completed: "完了",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  running: "実行中",
  waiting: "待機中",
  completed: "完了",
  error: "エラー",
};

export const countryLanguageMap: Record<string, { lang: string; langName: string }> = {
  JP: { lang: "ja", langName: "日本語" },
  US: { lang: "en", langName: "英語" },
  GB: { lang: "en", langName: "英語" },
  DE: { lang: "de", langName: "ドイツ語" },
  FR: { lang: "fr", langName: "フランス語" },
  KR: { lang: "ko", langName: "韓国語" },
  CN: { lang: "zh", langName: "中国語" },
  TW: { lang: "zh-TW", langName: "繁体中国語" },
  SG: { lang: "en", langName: "英語" },
  AU: { lang: "en", langName: "英語" },
  CA: { lang: "en", langName: "英語" },
  IN: { lang: "en", langName: "英語" },
  BR: { lang: "pt", langName: "ポルトガル語" },
  GLOBAL: { lang: "multi", langName: "多言語" },
};

// Expand GLOBAL into all available regions for execution
export function expandPresenceCountries(countries: string[]): string[] {
  if (countries.includes("GLOBAL")) {
    // Return all specific country codes (excluding GLOBAL itself)
    return availableCountries.filter((c) => c.code !== "GLOBAL").map((c) => c.code);
  }
  return countries;
}

// ---------------------------------------------------------------------------
// Initial wizard state
// ---------------------------------------------------------------------------

function initialWizardState(): WizardState {
  return {
    step: 1,
    siteInfo: null,
    keywords: [],
    competitors: [],
    brandName: "",
    goals: [],
    businessCountries: [],
    presenceCountries: [],
    audiences: [],
    methods: [],
    duration: "3months",
    additionalNotes: "",
    reportConfig: { morningTime: "07:00", eveningTime: "19:00", emailAddresses: [], enabled: true },
    generatedPlan: null,
    isAnalyzing: false,
    isGeneratingPlan: false,
  };
}

// ---------------------------------------------------------------------------
// Mock task generation
// ---------------------------------------------------------------------------

// Execution action templates per method and language
const executionTemplates: Record<PresenceMethod, (lang: string, langName: string, region: string, cycle: number) => { actions: string[]; results: string[] }> = {
  seo: (lang, langName, region, cycle) => ({
    actions: [
      `${langName}のキーワードリサーチを実行（${region}市場向け）`,
      `検索ボリュームと競合度を${langName}で分析`,
      `${langName}版メタタイトル・ディスクリプションを最適化`,
      `${region}向け内部リンク構造を改善`,
    ],
    results: [
      `${langName}キーワード候補 ${5 + cycle * 2}件を発見`,
      `${langName}メタデータ ${2 + cycle}ページ分を最適化`,
      `${region}での検索順位トラッキングデータを更新`,
    ],
  }),
  aeo: (lang, langName, region, cycle) => ({
    actions: [
      `${langName}の「People Also Ask」質問を${3 + cycle}件収集`,
      `${langName}でFeatured Snippet向け回答文を生成`,
      `FAQPage Schema.orgを${langName}で付与`,
    ],
    results: [
      `${langName}FAQ ${2 + Math.floor(cycle / 2)}件を新規生成`,
      `${langName}Featured Snippet対応回答 ${1 + cycle}件を作成`,
    ],
  }),
  geo: (lang, langName, region, cycle) => ({
    actions: [
      `ChatGPT/Gemini/Claudeに${langName}でブランド関連質問を投入`,
      `${langName}での現在のLLM引用状況を調査`,
      `${langName}版LLM最適化コンテンツを生成`,
      `${region}市場向け「Xとは」形式の権威性記事を${langName}で作成`,
    ],
    results: [
      `${langName}でのLLM引用 ${cycle}件を確認`,
      `${langName}版最適化コンテンツ ${1 + Math.floor(cycle / 3)}件を生成`,
      `${region}でのブランド言及状況レポートを更新`,
    ],
  }),
  schema_markup: (lang, langName, region, cycle) => ({
    actions: [
      `${langName}版ページのHTML構造を分析`,
      `${langName}向けJSON-LDマークアップを生成`,
      `Google Rich Results Testで${langName}版を検証`,
    ],
    results: [
      `${langName}版Schema.org ${2 + cycle}ページ分を実装`,
      `${langName}版検証結果: エラー0件`,
    ],
  }),
  content_marketing: (lang, langName, region, cycle) => ({
    actions: [
      `${region}市場の業界トレンドを${langName}で収集`,
      `${langName}版権威性コンテンツの下書きを生成`,
      `${langName}版ファクトチェック・品質改善を実施`,
    ],
    results: [
      `${langName}版記事ドラフト ${1 + Math.floor(cycle / 2)}件を生成`,
      `${langName}版編集済みコンテンツ ${cycle}件を完成`,
    ],
  }),
  knowledge_graph: (lang, langName, region, cycle) => ({
    actions: [
      `${langName}でのエンティティ属性を定義・更新`,
      `${langName}版Wikidata/Wikipedia情報を調査`,
      `${region}向けナレッジパネル出現状況を監視`,
    ],
    results: [
      `${langName}版エンティティ定義を更新`,
      `${region}でのナレッジパネル出現: ${cycle > 3 ? "確認" : "未確認"}`,
    ],
  }),
  faq_optimization: (lang, langName, region, cycle) => ({
    actions: [
      `${langName}の検索クエリから質問パターンを${5 + cycle}件抽出`,
      `${langName}版FAQ回答を自動生成`,
      `${langName}版FAQPage Schemaを更新`,
    ],
    results: [
      `${langName}版新規FAQ ${2 + cycle}件を追加`,
      `${langName}版FAQ閲覧データに基づき並び順を最適化`,
    ],
  }),
  multilingual: (lang, langName, region, cycle) => ({
    actions: [
      `日本語コンテンツを${langName}にローカライズ`,
      `${langName}版キーワードリサーチを実施`,
      `${langName}版hreflangタグを生成`,
      `${langName}版翻訳品質をチェック`,
    ],
    results: [
      `${langName}版コンテンツ ${2 + cycle}件をローカライズ完了`,
      `${langName}版hreflang設定を更新`,
      `${langName}版検索パフォーマンスレポートを生成`,
    ],
  }),
};

// Artifact templates per method
const artifactTemplates: Record<PresenceMethod, (langName: string, region: string, cycle: number) => ExecutionArtifact[]> = {
  seo: (langName, region, cycle) => [
    {
      id: `art-seo-kw-${cycle}`, type: "data", title: `${langName}キーワードレポート`,
      description: `${region}市場向けキーワード分析結果`,
      content: `# ${langName}キーワード分析 (Cycle #${cycle})\n\n| キーワード | 検索Vol | 競合度 | 現在順位 |\n|---|---|---|---|\n| デジタルプレゼンス ${region} | 1,200 | 中 | 15位 |\n| ブランド認知 向上 | 880 | 高 | 22位 |\n| AI引用 最適化 | 320 | 低 | 8位 |`,
      language: langName,
      source: "Google Search Console + Playwright",
      destination: `google.co.jp (${region}版検索)`,
      publishStatus: "verified",
    },
    {
      id: `art-seo-serp-${cycle}`, type: "screenshot", title: `SERP分析スクリーンショット`,
      description: `${langName}での検索結果画面キャプチャ`,
      thumbnailUrl: `https://placehold.co/600x400/1a1a2e/e0e0e0?text=SERP+${region}+Cycle${cycle}`,
      url: `https://placehold.co/1200x800/1a1a2e/e0e0e0?text=SERP+Analysis+${region}`,
      source: "Playwright (Google検索を自動キャプチャ)",
      destination: `google.com 検索結果 (${region})`,
      publishStatus: "verified",
    },
    {
      id: `art-seo-meta-${cycle}`, type: "content", title: `最適化メタデータ`,
      description: `${langName}版メタタイトル・ディスクリプション`,
      content: `<title>${region}向け: デジタルプレゼンス最適化ガイド | Example Corp</title>\n<meta name="description" content="${langName}で最適化されたメタディスクリプション。検索エンジンとAIの両方に対応。" />`,
      language: langName,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/index.html <head>タグ内",
      publishStatus: "published",
    },
  ],
  aeo: (langName, region, cycle) => [
    {
      id: `art-aeo-faq-${cycle}`, type: "content", title: `${langName}版FAQ生成結果`,
      description: `Featured Snippet向けFAQコンテンツ`,
      content: `## Q: デジタルプレゼンスとは何ですか？\n\nA: デジタルプレゼンスとは、企業やブランドがインターネット上で存在感を示す度合いのことです。検索エンジン、SNS、AI/LLMでの可視性を総合的に表します。\n\n## Q: なぜLLM引用が重要ですか？\n\nA: ChatGPTやGeminiなどのAIが回答時にブランドを引用することで、新しい顧客接点が生まれます。`,
      language: langName,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/faq ページに追加",
      publishStatus: "published",
    },
    {
      id: `art-aeo-snippet-${cycle}`, type: "screenshot", title: `Featured Snippet取得状況`,
      description: `${langName}でのFeatured Snippet表示キャプチャ`,
      thumbnailUrl: `https://placehold.co/600x400/1a2e1a/e0e0e0?text=Featured+Snippet+${region}`,
      url: `https://placehold.co/1200x800/1a2e1a/e0e0e0?text=Featured+Snippet+${region}+Detail`,
      source: "Playwright (Google検索を自動キャプチャ)",
      destination: `google.com 検索結果 (${region})`,
      publishStatus: "verified",
    },
    {
      id: `art-aeo-schema-${cycle}`, type: "code", title: `FAQPage Schema.org`,
      description: `自動生成されたFAQPageマークアップ`,
      content: `{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "デジタルプレゼンスとは？",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "企業のインターネット上での存在感..."\n    }\n  }]\n}`,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/faq <script type='application/ld+json'>",
      publishStatus: "published",
    },
  ],
  geo: (langName, region, cycle) => [
    {
      id: `art-geo-llm-${cycle}`, type: "screenshot", title: `LLM引用チェック結果`,
      description: `ChatGPT/Gemini/Claudeでのブランド引用状況`,
      thumbnailUrl: `https://placehold.co/600x400/2e1a2e/e0e0e0?text=LLM+Citation+${region}+Cycle${cycle}`,
      url: `https://placehold.co/1200x800/2e1a2e/e0e0e0?text=LLM+Citation+Check+${region}`,
      source: "Playwright (Perplexity AI / Google AI Overview)",
      destination: "perplexity.ai, google.com/search (AI Overview)",
      publishStatus: "verified",
    },
    {
      id: `art-geo-content-${cycle}`, type: "content", title: `${langName}版LLM最適化コンテンツ`,
      description: `LLMが引用しやすい構造で生成されたコンテンツ`,
      content: `# Example Corporationとは\n\nExample Corporationは、デジタルプレゼンス最適化を専門とするテクノロジー企業です。\n\n## 主な特徴\n- **AI/LLM引用最適化**: ChatGPT、Gemini、Claudeでの引用率を向上\n- **グローバル対応**: ${region}を含む全世界でのプレゼンス構築\n- **自動化**: 24時間365日のAIエージェントによる継続的最適化`,
      language: langName,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/about ページに追加",
      publishStatus: "published",
    },
    {
      id: `art-geo-report-${cycle}`, type: "data", title: `引用状況レポート`,
      description: `各LLMでの引用・言及の追跡データ`,
      content: `# LLM引用トラッキング (${region})\n\n| LLM | 質問 | 引用あり | 正確性 |\n|---|---|---|---|\n| ChatGPT | "Example Corpとは" | Yes | 90% |\n| Gemini | "デジタルプレゼンス 企業" | Partial | 70% |\n| Claude | "プレゼンス最適化" | Yes | 95% |`,
      source: "Playwright (各LLMプラットフォーム)",
      destination: "ChatGPT, Gemini, Claude (引用モニタリング)",
      publishStatus: "verified",
    },
  ],
  schema_markup: (langName, region, cycle) => [
    {
      id: `art-schema-code-${cycle}`, type: "code", title: `${langName}版JSON-LDマークアップ`,
      description: `自動生成されたSchema.orgコード`,
      content: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Example Corporation",\n  "url": "https://example.com",\n  "logo": "https://example.com/logo.png",\n  "description": "${langName}での企業説明",\n  "sameAs": [\n    "https://twitter.com/example",\n    "https://linkedin.com/company/example"\n  ]\n}`,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/index.html <script type='application/ld+json'>",
      publishStatus: "published",
    },
    {
      id: `art-schema-validation-${cycle}`, type: "screenshot", title: `Rich Results Test結果`,
      description: `Googleリッチリザルトテストの検証結果`,
      thumbnailUrl: `https://placehold.co/600x400/1a1a3e/e0e0e0?text=Rich+Results+${region}+PASS`,
      url: `https://placehold.co/1200x800/1a1a3e/e0e0e0?text=Google+Rich+Results+Test+PASSED`,
      source: "Playwright (Google Rich Results Test)",
      destination: "search.google.com/test/rich-results",
      publishStatus: "verified",
    },
    {
      id: `art-schema-diff-${cycle}`, type: "content", title: `実装差分`,
      description: `HTMLに挿入されたマークアップの変更内容`,
      content: `<!-- 追加: Organization Schema -->\n<script type="application/ld+json">\n// ... Organization markup\n</script>\n\n<!-- 追加: Product Schema -->\n<script type="application/ld+json">\n// ... Product markup  \n</script>\n\n実装ページ: /index.html, /products.html\n検証ステータス: PASS (エラー0件, 警告0件)`,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com /index.html, /products.html",
      publishStatus: "published",
    },
  ],
  content_marketing: (langName, region, cycle) => [
    {
      id: `art-cm-article-${cycle}`, type: "content", title: `${langName}版記事ドラフト`,
      description: `AI生成された権威性コンテンツ`,
      content: `# ${region}市場のデジタルプレゼンス戦略ガイド\n\n## はじめに\n${region}市場において、デジタルプレゼンスの確立は企業の成長に不可欠です...\n\n## 主要な施策\n1. SEO最適化による検索可視性の向上\n2. AI/LLMでの引用獲得\n3. 構造化データの実装\n\n文字数: 3,200字 | 読了時間: 約8分`,
      language: langName,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/blog (下書き保存)",
      publishStatus: "draft",
    },
    {
      id: `art-cm-factcheck-${cycle}`, type: "data", title: `ファクトチェックレポート`,
      description: `記事内の事実確認結果`,
      content: `# ファクトチェック結果\n\n- 統計データ: 3件中3件確認済み\n- 引用元: 全て信頼性の高いソース\n- 法的リスク: なし\n- E-E-A-T評価: A`,
      source: "Ollama llama3.1 (ファクトチェック)",
      destination: "内部レポート (公開なし)",
      publishStatus: "verified",
    },
  ],
  knowledge_graph: (langName, region, cycle) => [
    {
      id: `art-kg-entity-${cycle}`, type: "data", title: `エンティティ定義書`,
      description: `ブランドのエンティティ属性定義`,
      content: `# Entity: Example Corporation\n\nType: Organization\nIndustry: Technology\nFounded: 2020\nHeadquarters: Tokyo, Japan\n\nRelated Entities:\n- Digital Presence (concept)\n- SEO Optimization (service)\n- AI Citation (technology)`,
      source: "Ollama llama3.1 + Wikidata API",
      destination: "Wikidata エンティティ登録申請",
      publishStatus: "draft",
    },
    {
      id: `art-kg-panel-${cycle}`, type: "screenshot", title: `ナレッジパネル監視`,
      description: `${region}でのGoogle検索ナレッジパネル表示状況`,
      thumbnailUrl: `https://placehold.co/600x400/2e2e1a/e0e0e0?text=Knowledge+Panel+${region}`,
      url: `https://placehold.co/1200x800/2e2e1a/e0e0e0?text=Knowledge+Panel+Monitor+${region}`,
      source: "Playwright (Google検索を自動キャプチャ)",
      destination: `google.com 検索結果 (${region})`,
      publishStatus: "verified",
    },
  ],
  faq_optimization: (langName, region, cycle) => [
    {
      id: `art-faq-content-${cycle}`, type: "content", title: `${langName}版FAQ更新内容`,
      description: `新規追加・更新されたFAQ`,
      content: `## 新規追加FAQ\n\n**Q: プレゼンスビジョンの料金は？**\nA: プランに応じて月額制でご利用いただけます。\n\n**Q: 効果が出るまでの期間は？**\nA: 通常1〜3ヶ月で検索可視性の向上が確認できます。\n\nFAQPage Schema: 自動付与済み`,
      language: langName,
      source: "Ollama llama3.1 (ローカルAI生成)",
      destination: "example.com/faq ページに追加",
      publishStatus: "published",
    },
  ],
  multilingual: (langName, region, cycle) => [
    {
      id: `art-ml-content-${cycle}`, type: "content", title: `${langName}版翻訳コンテンツ`,
      description: `ローカライズされたコンテンツのプレビュー`,
      content: `# Localized content for ${region}\n\n翻訳元: 日本語 → ${langName}\nローカライズ適応: 文化的コンテキストを調整\nhreflang: <link rel="alternate" hreflang="${langName}" />\n\n翻訳品質スコア: 92/100`,
      language: langName,
      source: "Ollama llama3.1 (翻訳+ローカライズ)",
      destination: `example.com/${langName}/ ページ群`,
      publishStatus: "published",
    },
    {
      id: `art-ml-hreflang-${cycle}`, type: "code", title: `hreflang設定`,
      description: `自動生成されたhreflangタグ`,
      content: `<link rel="alternate" hreflang="ja" href="https://example.com/ja/" />\n<link rel="alternate" hreflang="en" href="https://example.com/en/" />\n<link rel="alternate" hreflang="x-default" href="https://example.com/" />`,
      source: "Ollama llama3.1 (自動生成)",
      destination: "example.com 全ページ <head>タグ内",
      publishStatus: "published",
    },
  ],
};

function generateMockExecutions(
  method: PresenceMethod,
  presenceCountries: string[],
  cycleCount: number,
  baseTime: number,
): TaskExecution[] {
  const expanded = expandPresenceCountries(presenceCountries);
  const executions: TaskExecution[] = [];
  let execId = 0;

  for (let cycle = 1; cycle <= cycleCount; cycle++) {
    for (const region of expanded) {
      const langInfo = countryLanguageMap[region] ?? { lang: "en", langName: "英語" };
      const countryInfo = availableCountries.find((c) => c.code === region);
      const regionLabel = countryInfo ? countryInfo.name : region;
      const template = executionTemplates[method];
      const { actions, results } = template(langInfo.lang, langInfo.langName, regionLabel, cycle);

      const startOffset = cycle * 3600000 + expanded.indexOf(region) * 600000;
      const startedAt = new Date(baseTime - startOffset);
      const completedAt = new Date(startedAt.getTime() + 180000 + Math.random() * 300000);

      // Generate artifacts for this execution
      const artTemplate = artifactTemplates[method];
      const allArtifacts = artTemplate(langInfo.langName, regionLabel, cycle);
      // Include 1-3 artifacts per execution (not all every time)
      const numArtifacts = 1 + Math.floor(Math.random() * Math.min(3, allArtifacts.length));
      const artifacts = allArtifacts.slice(0, numArtifacts).map((a) => ({
        ...a,
        id: `${a.id}-${region}-${execId}`,
      }));

      executions.push({
        id: `exec-${++execId}`,
        cycleNumber: cycle,
        startedAt,
        completedAt,
        status: Math.random() > 0.05 ? "success" : "partial",
        targetRegion: region,
        targetLanguage: langInfo.lang,
        actions: actions.slice(0, 2 + Math.floor(Math.random() * (actions.length - 1))),
        results: results.slice(0, 1 + Math.floor(Math.random() * results.length)),
        metrics: {
          itemsProcessed: 3 + Math.floor(Math.random() * 10),
          itemsGenerated: 1 + Math.floor(Math.random() * 5),
        },
        artifacts,
      });
    }
  }

  return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

function generateMockTasks(methods: PresenceMethod[], presenceCountries: string[] = ["JP"]): PlanTask[] {
  const now = new Date();
  const taskDefs: Record<PresenceMethod, { title: string; desc: string; what: string; how: string; output: string }[]> = {
    schema_markup: [{
      title: "Schema.org構造化データの実装・更新",
      desc: "Organization/Product/FAQPage等のJSON-LDマークアップを継続的に生成・更新",
      what: "サイトのHTMLを定期的にクロールし、Schema.orgのJSON-LDマークアップを自動生成します。Organization、Product、FAQPage、BreadcrumbList、HowTo等のスキーマタイプを検出・生成し、Googleのリッチリザルト対応を維持します。",
      how: "1) サイトをクロールしてページ構造を分析\n2) 各ページに適したスキーマタイプを判定\n3) JSON-LDコードを自動生成\n4) Google Rich Results Testで検証\n5) エラーがあれば修正して再生成\n6) 新しいページや変更を検知して自動更新",
      output: "JSON-LDマークアップコード、実装レポート、Google検証結果",
    }],
    knowledge_graph: [{
      title: "エンティティ定義とナレッジグラフ拡張",
      desc: "ブランド・プロダクトのエンティティを定義し、ナレッジパネルへの掲載を目指す",
      what: "ブランドやプロダクトを「エンティティ」として定義し、Googleのナレッジグラフに認識させるための施策を継続実行します。Wikidata、Wikipedia、Google Business Profileなどへの情報登録・更新を行います。",
      how: "1) エンティティ属性の定義（名前、種類、説明、関連エンティティ）\n2) Wikidataエントリの作成/更新案を生成\n3) Wikipedia記事のドラフトを作成（特筆性の要件を確認）\n4) Google Business Profileの最適化提案\n5) sameAs属性で各プラットフォームを相互リンク\n6) ナレッジパネルの出現を定期監視",
      output: "エンティティ定義書、Wikidata登録案、Wikipedia下書き、監視レポート",
    }],
    seo: [{
      title: "キーワードリサーチとSEOコンテンツ最適化",
      desc: "検索意図に基づくキーワード戦略の策定と既存コンテンツの継続的な最適化",
      what: "ターゲットキーワードの発見・分析を継続的に行い、検索意図に沿ったコンテンツの作成・最適化を自動実行します。検索順位の変動を監視し、必要に応じてコンテンツを更新します。",
      how: "1) キーワードリサーチ（検索ボリューム、競合度、検索意図分析）\n2) コンテンツギャップ分析（競合が上位で自社がカバーしていないトピック）\n3) 既存コンテンツのSEO監査と改善提案\n4) メタタイトル・ディスクリプションの最適化\n5) 内部リンク構造の分析と改善\n6) 検索順位の定期トラッキングと再最適化",
      output: "キーワードレポート、SEO改善提案、順位トラッキングデータ、最適化済みメタデータ",
    }],
    aeo: [{
      title: "FAQ・回答コンテンツの最適化",
      desc: "検索エンジンのFeatured Snippetsや回答ボックスに表示されるコンテンツを生成",
      what: "ユーザーがよく検索する質問を特定し、Featured SnippetsやPeople Also Ask、音声検索に最適化された回答コンテンツを自動生成・更新します。",
      how: "1) 「People Also Ask」や関連質問の自動収集\n2) 各質問に対する簡潔で正確な回答文を生成\n3) FAQPage Schema.orgマークアップを付与\n4) 質問-回答ペアのA/Bテスト\n5) Featured Snippet獲得状況の監視\n6) 新しい質問トレンドの検出と対応",
      output: "FAQ集、回答コンテンツ、FAQPageスキーマ、Featured Snippet獲得レポート",
    }],
    geo: [{
      title: "LLM引用最適化コンテンツ生成",
      desc: "ChatGPT、Gemini、Claude等のLLMが引用しやすい構造のコンテンツを生成",
      what: "LLMが回答生成時に参照・引用しやすい形式のコンテンツを自動生成します。明確な定義、比較表、数値データ、構造化された説明文を重視し、LLMの学習データに取り込まれやすいコンテンツを作成します。",
      how: "1) LLMに対してブランド/プロダクト関連の質問を投げ、現在の引用状況を調査\n2) 引用されていないトピックのギャップを特定\n3) 明確な定義文・比較データ・数値情報を含むコンテンツを生成\n4) 「Xとは」「Xの特徴」「X vs Y」形式の権威性の高い記事を作成\n5) 定期的にLLMの回答内容を監視し、引用状況の変化を追跡\n6) 引用されやすい構造パターンを学習して最適化を継続",
      output: "LLM最適化コンテンツ、引用状況レポート、ギャップ分析レポート",
    }],
    content_marketing: [{
      title: "権威性コンテンツの自動生成・公開",
      desc: "業界分析、ハウツー、比較記事等のオーソリティコンテンツを自動生成",
      what: "業界の課題や話題を分析し、専門性・権威性・信頼性（E-E-A-T）の高いコンテンツを自動生成します。記事、ガイド、ケーススタディ、比較分析等、多様な形式のコンテンツを継続的に作成・公開します。",
      how: "1) 業界トレンドとニュースの自動収集\n2) コンテンツカレンダーの自動策定\n3) AI Writer Agentによる下書き生成\n4) Editor Agentによる品質改善\n5) Evidence Agentによるファクトチェック\n6) Compliance Agentによる法務チェック\n7) 承認後の自動公開",
      output: "記事ドラフト、編集済みコンテンツ、ファクトチェックレポート、公開コンテンツ",
    }],
    faq_optimization: [{
      title: "FAQ自動拡張・更新",
      desc: "ユーザーの質問トレンドに基づくFAQの自動拡張と既存FAQの更新",
      what: "検索クエリやユーザーの質問傾向を分析し、FAQセクションを自動的に拡張・更新します。新しい質問の追加、既存回答の改善、不要なFAQの整理を継続的に行います。",
      how: "1) サーチコンソールや検索トレンドから質問パターンを抽出\n2) 未回答の質問を特定\n3) 正確で簡潔な回答を自動生成\n4) FAQPage Schema.orgを自動更新\n5) 古い回答の最新情報への更新\n6) FAQ閲覧データに基づく並び順最適化",
      output: "新規FAQ、更新済みFAQ、FAQPageスキーマ、カバレッジレポート",
    }],
    multilingual: [{
      title: "多言語コンテンツ展開・同期",
      desc: "主要コンテンツの多言語版を自動生成し、グローバルプレゼンスを構築",
      what: "日本語コンテンツを基にターゲット言語への自動翻訳・ローカライズを行います。単純翻訳ではなく、各市場の文化・検索習慣に合わせたコンテンツを生成し、hreflang設定も自動管理します。",
      how: "1) 翻訳対象コンテンツの優先順位付け\n2) AI翻訳 + ローカライゼーション（文化的適応）\n3) 各言語のキーワードリサーチ\n4) hreflangタグの自動生成\n5) 翻訳品質のチェックと改善\n6) 各言語版の検索パフォーマンス監視",
      output: "多言語コンテンツ、hreflang設定、言語別パフォーマンスレポート",
    }],
  };

  const tasks: PlanTask[] = [];
  let taskIdx = 0;
  for (const method of methods) {
    const defs = taskDefs[method] ?? [];
    for (const def of defs) {
      taskIdx++;
      const runOffset = Math.floor(Math.random() * 3600000);
      const cycleCount = Math.floor(Math.random() * 15) + 3;
      const executions = generateMockExecutions(method, presenceCountries, Math.min(cycleCount, 5), now.getTime());
      tasks.push({
        id: `task-${taskIdx}`,
        title: def.title,
        description: def.desc,
        method,
        priority: taskIdx <= 3 ? "high" : taskIdx <= 5 ? "medium" : "low",
        status: "running",
        whatItDoes: def.what,
        howItWorks: def.how,
        expectedOutput: def.output,
        activities: [
          { timestamp: new Date(now.getTime() - 7200000 + runOffset), message: "タスクを開始しました", type: "info" },
          { timestamp: new Date(now.getTime() - 3600000 + runOffset), message: "サイトのクロールと分析を完了", type: "success" },
          { timestamp: new Date(now.getTime() - 1800000 + runOffset), message: "データ処理中...", type: "info" },
          { timestamp: new Date(now.getTime() - 600000 + runOffset), message: "最新の結果を生成しました", type: "success" },
        ],
        executions,
        cycleCount,
        lastRunAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000)),
        nextRunAt: new Date(now.getTime() + Math.floor(Math.random() * 3600000) + 600000),
      });
    }
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------

async function mockFetchSiteInfo(url: string): Promise<SiteInfo> {
  try {
    const res = await fetch("/api/site-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to basic extraction
  }

  // Fallback
  let hostname: string;
  try {
    hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    hostname = url;
  }
  const brand = hostname.replace("www.", "").split(".")[0].charAt(0).toUpperCase() + hostname.replace("www.", "").split(".")[0].slice(1);
  return {
    url: url.startsWith("http") ? url : `https://${url}`,
    title: brand,
    description: `${hostname} のウェブサイト`,
    favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    language: "ja",
    industry: "テクノロジー",
    suggestedKeywords: [brand, `${brand} サービス`, `${brand} 評判`, `${brand} 料金`],
  };
}

async function mockGeneratePlan(methods: PresenceMethod[], duration: string, presenceCountries: string[] = ["JP"]): Promise<GeneratedPlan> {
  await new Promise((r) => setTimeout(r, 2500));
  const tasks = generateMockTasks(methods, presenceCountries);
  return {
    summary: `選択された${methods.length}つの手段を同時並行で${durationLabels[duration]}間、24時間自動で実行し続けます。各タスクは独立して動作し、定期的にサイクルを繰り返します。AI エージェントがリサーチ→生成→検証→最適化のループを継続的に回します。`,
    tasks,
    estimatedImpact: `${durationLabels[duration]}で検索可視性 40-60% 向上、LLM引用率 20-30% 向上を見込めます`,
    duration: durationLabels[duration],
  };
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _idCounter = 100;
function nextId(): string {
  return String(++_idCounter);
}

// ---------------------------------------------------------------------------
// Mock data for demo project
// ---------------------------------------------------------------------------

const demoMethods: PresenceMethod[] = ["seo", "aeo", "geo", "schema_markup"];

const demoProject: Project = {
  id: "demo-1",
  name: "Example",
  url: "https://example.com",
  siteInfo: { url: "https://example.com", title: "Example Corporation", description: "テクノロジーソリューションを提供する企業", favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=64", language: "ja", industry: "テクノロジー" },
  goals: ["brand_awareness", "llm_citation"],
  businessCountries: ["JP"],
  presenceCountries: ["JP", "US", "GLOBAL"],
  audiences: ["b2b_enterprise", "developers"],
  methods: demoMethods,
  duration: "3months",
  additionalNotes: "",
  keywords: ["デジタルプレゼンス", "SEO最適化", "AI引用", "ブランド認知", "オンライン可視性"],
  competitors: ["https://competitor-a.com", "https://competitor-b.com"],
  brandName: "Example Corporation",
  reportConfig: { morningTime: "07:00", eveningTime: "19:00", emailAddresses: ["user@example.com", "team@example.com"], enabled: true },
  channels: [
    { type: "twitter", name: "Twitter / X", category: "social", regions: ["JP", "US", "GB"], languages: ["en", "ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 5, cooldownMs: 15000 } },
    { type: "linkedin", name: "LinkedIn", category: "social", regions: ["JP", "US", "GB"], languages: ["en", "ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 3, cooldownMs: 30000 } },
    { type: "medium", name: "Medium", category: "blog", regions: ["JP", "US", "GB"], languages: ["en", "ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 2, cooldownMs: 60000 } },
    { type: "dev_to", name: "DEV.to", category: "blog", regions: ["US", "GB"], languages: ["en"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 3, cooldownMs: 30000 } },
    { type: "note_com", name: "note.com", category: "blog", regions: ["JP"], languages: ["ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 2, cooldownMs: 60000 } },
    { type: "qiita", name: "Qiita", category: "blog", regions: ["JP"], languages: ["ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 2, cooldownMs: 60000 } },
    { type: "reddit", name: "Reddit", category: "qa", regions: ["US", "GB", "AU", "CA"], languages: ["en"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 2, cooldownMs: 120000 } },
    { type: "quora", name: "Quora", category: "qa", regions: ["US", "GB", "IN"], languages: ["en"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 2, cooldownMs: 120000 } },
    { type: "yahoo_chiebukuro", name: "Yahoo! Chiebukuro", category: "qa", regions: ["JP"], languages: ["ja"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 1, cooldownMs: 300000 } },
    { type: "hashnode", name: "Hashnode", category: "blog", regions: ["US", "GB"], languages: ["en"], requiresAuth: true, enabled: true, rateLimit: { maxPerHour: 3, cooldownMs: 30000 } },
  ],
  enabledChannels: ["twitter", "medium", "reddit", "linkedin"],
  channelCredentials: {},
  plan: {
    summary: "SEO・AEO・GEO・Schema.orgの4軸を同時並行で3ヶ月間実行。全タスクが独立して24時間稼働し、リサーチ→生成→検証→最適化のループを継続的に回します。",
    tasks: generateMockTasks(demoMethods, ["JP", "US", "GLOBAL"]),
    estimatedImpact: "3ヶ月で検索可視性 40-60% 向上、LLM引用率 20-30% 向上を見込めます",
    duration: "3ヶ月",
  },
  status: "active",
  createdAt: new Date(Date.now() - 14 * 86400000),
  reports: [
    {
      id: "r1", title: "イブニングレポート", type: "evening", date: new Date(Date.now() - 18000000),
      summary: "本日の進捗: Schema.org実装が2ページ完了、SEOコンテンツ1記事を生成、LLM引用チェックで2件の新規引用を確認",
      details: [
        "Schema.org: ProductスキーマとOrganizationスキーマをトップページに実装完了",
        "SEO: 「デジタルプレゼンスとは」のロングテールキーワード記事を生成",
        "GEO: ChatGPTでのブランド言及が前回比+2件（計5件）",
        "AEO: 「People Also Ask」対応FAQ 3件を新規追加",
      ],
      metrics: { visibilityScore: 42, visibilityDelta: 3, contentGenerated: 4, schemaDeployed: 2, mentionsFound: 12, llmCitations: 5, tasksRunning: 4 },
    },
    {
      id: "r2", title: "モーニングレポート", type: "morning", date: new Date(Date.now() - 43200000),
      summary: "昨晩の自動実行結果: キーワードリサーチ更新、FAQ 2件追加、多言語コンテンツ1件生成",
      details: [
        "SEO: 新規キーワード候補12件を発見、うち3件を優先キーワードに設定",
        "AEO: FAQ 2件を自動生成・FAQPageスキーマ付与",
        "GEO: LLM最適化コンテンツの下書き1件完成",
      ],
      metrics: { visibilityScore: 39, visibilityDelta: 2, contentGenerated: 3, schemaDeployed: 1, mentionsFound: 10, llmCitations: 3, tasksRunning: 4 },
    },
  ],
  selectedTaskId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface StoreState {
  projects: Project[];
  wizard: WizardState;
  wizardOpen: boolean;
}

interface StoreActions {
  openWizard: () => void;
  closeWizard: () => void;
  setWizardStep: (step: WizardState["step"]) => void;
  setWizardSiteInfo: (info: SiteInfo) => void;
  setWizardGoals: (goals: PresenceGoal[]) => void;
  setWizardBusinessCountries: (c: string[]) => void;
  setWizardPresenceCountries: (c: string[]) => void;
  setWizardAudiences: (audiences: TargetAudience[]) => void;
  setWizardMethods: (methods: PresenceMethod[]) => void;
  setWizardDuration: (duration: WizardState["duration"]) => void;
  setWizardNotes: (notes: string) => void;
  setWizardReportConfig: (config: Partial<ReportConfig>) => void;
  setWizardKeywords: (keywords: string[]) => void;
  setWizardCompetitors: (competitors: string[]) => void;
  setWizardBrandName: (brandName: string) => void;
  setWizardCmsConfig: (config: CmsConfig | undefined) => void;
  analyzeSiteUrl: (url: string) => Promise<void>;
  generatePlan: () => Promise<void>;
  confirmAndStartProject: () => void;
  removeProject: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  updateProjectReportConfig: (id: string, config: Partial<ReportConfig>) => void;
  updateProjectSettings: (id: string, settings: Partial<Pick<Project,
    'goals' | 'businessCountries' | 'presenceCountries' | 'audiences' |
    'methods' | 'duration' | 'additionalNotes' | 'keywords' | 'competitors' | 'brandName' | 'cmsConfig' |
    'enabledChannels' | 'channelCredentials'
  >>) => void;
  selectTask: (projectId: string, taskId: string | null) => void;
}

type StoreContextValue = StoreState & StoreActions;

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([demoProject]);
  const [wizard, setWizard] = useState<WizardState>(initialWizardState());
  const [wizardOpen, setWizardOpen] = useState(false);

  const openWizard = useCallback(() => { setWizard(initialWizardState()); setWizardOpen(true); }, []);
  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const setWizardStep = useCallback((step: WizardState["step"]) => setWizard((p) => ({ ...p, step })), []);
  const setWizardSiteInfo = useCallback((info: SiteInfo) => setWizard((p) => ({ ...p, siteInfo: info })), []);
  const setWizardGoals = useCallback((goals: PresenceGoal[]) => setWizard((p) => ({ ...p, goals })), []);
  const setWizardBusinessCountries = useCallback((c: string[]) => setWizard((p) => ({ ...p, businessCountries: c })), []);
  const setWizardPresenceCountries = useCallback((c: string[]) => setWizard((p) => ({ ...p, presenceCountries: c })), []);
  const setWizardAudiences = useCallback((audiences: TargetAudience[]) => setWizard((p) => ({ ...p, audiences })), []);
  const setWizardMethods = useCallback((methods: PresenceMethod[]) => setWizard((p) => ({ ...p, methods })), []);
  const setWizardDuration = useCallback((d: WizardState["duration"]) => setWizard((p) => ({ ...p, duration: d })), []);
  const setWizardNotes = useCallback((notes: string) => setWizard((p) => ({ ...p, additionalNotes: notes })), []);
  const setWizardReportConfig = useCallback((config: Partial<ReportConfig>) => {
    setWizard((p) => ({ ...p, reportConfig: { ...p.reportConfig, ...config } }));
  }, []);
  const setWizardKeywords = useCallback((keywords: string[]) => setWizard((p) => ({ ...p, keywords })), []);
  const setWizardCompetitors = useCallback((competitors: string[]) => setWizard((p) => ({ ...p, competitors })), []);
  const setWizardBrandName = useCallback((brandName: string) => setWizard((p) => ({ ...p, brandName })), []);
  const setWizardCmsConfig = useCallback((config: CmsConfig | undefined) => setWizard((p) => ({ ...p, cmsConfig: config })), []);

  const analyzeSiteUrl = useCallback(async (url: string) => {
    setWizard((p) => ({ ...p, isAnalyzing: true }));
    try {
      const info = await mockFetchSiteInfo(url);
      setWizard((p) => ({
        ...p,
        siteInfo: info,
        brandName: p.brandName || info.title || "",
        keywords: p.keywords.length > 0 ? p.keywords : (info.suggestedKeywords ?? []),
        isAnalyzing: false,
      }));
    } catch { setWizard((p) => ({ ...p, isAnalyzing: false })); }
  }, []);

  const generatePlan = useCallback(async () => {
    setWizard((p) => ({ ...p, isGeneratingPlan: true }));
    try {
      const plan = await mockGeneratePlan(wizard.methods, wizard.duration, wizard.presenceCountries);
      setWizard((p) => ({ ...p, generatedPlan: plan, isGeneratingPlan: false }));
    } catch { setWizard((p) => ({ ...p, isGeneratingPlan: false })); }
  }, [wizard.methods, wizard.duration, wizard.presenceCountries]);

  const confirmAndStartProject = useCallback(() => {
    const w = wizard;
    if (!w.siteInfo || !w.generatedPlan) return;
    const proj: Project = {
      id: nextId(),
      name: w.siteInfo.title || w.siteInfo.url,
      url: w.siteInfo.url,
      siteInfo: w.siteInfo,
      goals: w.goals,
      businessCountries: w.businessCountries,
      presenceCountries: w.presenceCountries,
      audiences: w.audiences,
      methods: w.methods,
      duration: w.duration,
      additionalNotes: w.additionalNotes,
      keywords: w.keywords,
      competitors: w.competitors,
      brandName: w.brandName || w.siteInfo.title || w.siteInfo.url,
      reportConfig: w.reportConfig,
      cmsConfig: w.cmsConfig,
      plan: w.generatedPlan,
      status: "active",
      createdAt: new Date(),
      reports: [],
      selectedTaskId: null,
    };
    setProjects((prev) => [proj, ...prev]);
    setWizardOpen(false);
    setWizard(initialWizardState());

    // エンジン起動（バックグラウンド）
    startEngine({
      id: proj.id,
      name: proj.name,
      url: proj.url,
      brandName: proj.siteInfo.title || proj.name,
      keywords: w.keywords,
      targetCountries: expandPresenceCountries(proj.presenceCountries),
      methods: proj.methods,
      cmsConfig: proj.cmsConfig,
    }).catch((err) => console.error("[Engine] Failed to start:", err));
  }, [wizard]);

  const removeProject = useCallback((id: string) => setProjects((p) => p.filter((x) => x.id !== id)), []);
  const updateProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    // エンジン制御
    if (status === "paused" || status === "completed") {
      stopEngine(id).catch((err) => console.error("[Engine] Failed to stop:", err));
    } else if (status === "active") {
      // 再開時はプロジェクトデータを取得してエンジン起動
      const proj = projects.find((x) => x.id === id);
      if (proj) {
        startEngine({
          id: proj.id,
          name: proj.name,
          url: proj.url,
          brandName: proj.siteInfo.title || proj.name,
          keywords: proj.keywords ?? [],
          targetCountries: expandPresenceCountries(proj.presenceCountries),
          methods: proj.methods,
          cmsConfig: proj.cmsConfig,
        }).catch((err) => console.error("[Engine] Failed to restart:", err));
      }
    }
  }, [projects]);
  const updateProjectReportConfig = useCallback((id: string, config: Partial<ReportConfig>) => {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, reportConfig: { ...x.reportConfig, ...config } } : x)));
  }, []);
  const updateProjectSettings = useCallback((id: string, settings: Partial<Pick<Project,
    'goals' | 'businessCountries' | 'presenceCountries' | 'audiences' |
    'methods' | 'duration' | 'additionalNotes' | 'keywords' | 'competitors' | 'brandName' | 'cmsConfig' |
    'enabledChannels' | 'channelCredentials'
  >>) => {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, ...settings } : x)));
  }, []);

  const selectTask = useCallback((projectId: string, taskId: string | null) => {
    setProjects((p) => p.map((x) => (x.id === projectId ? { ...x, selectedTaskId: taskId } : x)));
  }, []);

  const value: StoreContextValue = {
    projects, wizard, wizardOpen,
    openWizard, closeWizard, setWizardStep, setWizardSiteInfo,
    setWizardGoals, setWizardBusinessCountries, setWizardPresenceCountries,
    setWizardAudiences, setWizardMethods, setWizardDuration, setWizardNotes,
    setWizardReportConfig, setWizardKeywords, setWizardCompetitors, setWizardBrandName, setWizardCmsConfig,
    analyzeSiteUrl, generatePlan, confirmAndStartProject,
    removeProject, updateProjectStatus, updateProjectReportConfig, updateProjectSettings, selectTask,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
