/**
 * Channel Registry -- 配信チャネルの定義と管理
 *
 * 100のプラットフォームに1記事ずつ配信する
 * 「分散プレゼンス」戦略のためのチャネル定義。
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelType =
  // Social Media
  | "twitter"
  | "linkedin"
  | "facebook"
  // Blogging Platforms
  | "medium"
  | "note_com"
  | "dev_to"
  | "qiita"
  | "hashnode"
  // Q&A Sites
  | "reddit"
  | "quora"
  | "yahoo_chiebukuro"
  | "zhihu"
  | "stack_overflow"
  // Business Directories
  | "google_business"
  // Press/News
  | "press_release"
  // Regional platforms
  | "naver_blog"
  | "tistory"
  | "csdn"
  | "xing";

export interface ChannelConfig {
  type: ChannelType;
  name: string;
  category: "social" | "blog" | "qa" | "directory" | "press" | "forum";
  regions: string[]; // which countries this channel is relevant for
  languages: string[];
  requiresAuth: boolean;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
  enabled: boolean;
  rateLimit: { maxPerHour: number; cooldownMs: number };
}

export interface ChannelAction {
  type:
    | "post_article"
    | "post_comment"
    | "answer_question"
    | "retweet"
    | "share"
    | "search_engage";
  channel: ChannelType;
  content: string;
  url?: string;
  hashtags?: string[];
  keyword?: string;
}

// ---------------------------------------------------------------------------
// All regions shorthand
// ---------------------------------------------------------------------------

const ALL_REGIONS = [
  "JP", "US", "GB", "DE", "FR", "KR", "CN", "TW", "BR",
  "IN", "AU", "CA", "ES", "IT", "NL", "SE", "SG", "ID", "TH", "VN",
];

const ENGLISH_REGIONS = ["US", "GB", "AU", "CA", "SG", "IN"];

// ---------------------------------------------------------------------------
// Default channel definitions
// ---------------------------------------------------------------------------

export function getDefaultChannels(): ChannelConfig[] {
  return [
    // --- Social Media ---
    {
      type: "twitter",
      name: "Twitter / X",
      category: "social",
      regions: ALL_REGIONS,
      languages: ["en", "ja", "de", "fr", "ko", "zh", "pt", "es", "it", "nl", "sv", "id", "th", "vi"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 5, cooldownMs: 15_000 },
    },
    {
      type: "linkedin",
      name: "LinkedIn",
      category: "social",
      regions: ALL_REGIONS,
      languages: ["en", "ja", "de", "fr", "ko", "zh", "pt", "es", "it", "nl", "sv"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 3, cooldownMs: 30_000 },
    },
    {
      type: "facebook",
      name: "Facebook",
      category: "social",
      regions: ALL_REGIONS,
      languages: ["en", "ja", "de", "fr", "ko", "zh", "pt", "es", "it", "nl", "sv", "id", "th", "vi"],
      requiresAuth: true,
      enabled: false, // disabled by default -- strict bot detection
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },

    // --- Blogging Platforms ---
    {
      type: "medium",
      name: "Medium",
      category: "blog",
      regions: ALL_REGIONS,
      languages: ["en", "ja", "de", "fr", "es", "pt"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "note_com",
      name: "note.com",
      category: "blog",
      regions: ["JP"],
      languages: ["ja"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "dev_to",
      name: "DEV.to",
      category: "blog",
      regions: ALL_REGIONS,
      languages: ["en"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 3, cooldownMs: 30_000 },
    },
    {
      type: "qiita",
      name: "Qiita",
      category: "blog",
      regions: ["JP"],
      languages: ["ja"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "hashnode",
      name: "Hashnode",
      category: "blog",
      regions: ALL_REGIONS,
      languages: ["en"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 3, cooldownMs: 30_000 },
    },

    // --- Q&A Sites ---
    {
      type: "reddit",
      name: "Reddit",
      category: "qa",
      regions: [...ENGLISH_REGIONS, "DE", "FR", "BR", "NL", "SE"],
      languages: ["en", "de", "fr", "pt", "nl", "sv"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 120_000 },
    },
    {
      type: "quora",
      name: "Quora",
      category: "qa",
      regions: [...ENGLISH_REGIONS, "JP", "DE", "FR", "ES", "IT", "BR"],
      languages: ["en", "ja", "de", "fr", "es", "it", "pt"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 120_000 },
    },
    {
      type: "yahoo_chiebukuro",
      name: "Yahoo! Chiebukuro",
      category: "qa",
      regions: ["JP"],
      languages: ["ja"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 1, cooldownMs: 300_000 },
    },
    {
      type: "zhihu",
      name: "Zhihu",
      category: "qa",
      regions: ["CN"],
      languages: ["zh"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 1, cooldownMs: 300_000 },
    },
    {
      type: "stack_overflow",
      name: "Stack Overflow",
      category: "qa",
      regions: ALL_REGIONS,
      languages: ["en"],
      requiresAuth: true,
      enabled: false, // disabled by default -- strict quality rules
      rateLimit: { maxPerHour: 1, cooldownMs: 600_000 },
    },

    // --- Business Directories ---
    {
      type: "google_business",
      name: "Google Business Profile",
      category: "directory",
      regions: ALL_REGIONS,
      languages: ["en", "ja", "de", "fr", "ko", "zh", "pt", "es", "it"],
      requiresAuth: true,
      enabled: false, // manual setup required
      rateLimit: { maxPerHour: 1, cooldownMs: 600_000 },
    },

    // --- Press/News ---
    {
      type: "press_release",
      name: "Press Release Distribution",
      category: "press",
      regions: ALL_REGIONS,
      languages: ["en", "ja"],
      requiresAuth: true,
      enabled: false, // typically needs paid service
      rateLimit: { maxPerHour: 1, cooldownMs: 3600_000 },
    },

    // --- Regional Platforms ---
    {
      type: "naver_blog",
      name: "Naver Blog",
      category: "blog",
      regions: ["KR"],
      languages: ["ko"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "tistory",
      name: "Tistory",
      category: "blog",
      regions: ["KR"],
      languages: ["ko"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "csdn",
      name: "CSDN",
      category: "blog",
      regions: ["CN"],
      languages: ["zh"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
    {
      type: "xing",
      name: "XING",
      category: "social",
      regions: ["DE", "AT", "CH"],
      languages: ["de"],
      requiresAuth: true,
      enabled: true,
      rateLimit: { maxPerHour: 2, cooldownMs: 60_000 },
    },
  ];
}

// ---------------------------------------------------------------------------
// Get channels relevant for a specific country
// ---------------------------------------------------------------------------

export function getChannelsForCountry(country: string): ChannelConfig[] {
  const all = getDefaultChannels();
  return all.filter((ch) => ch.regions.includes(country));
}

/**
 * チャネルが認証済み（利用可能）かどうかを判定する。
 * requiresAuth === true のチャネルで credentials が未設定ならfalse。
 */
export function isChannelReady(channel: ChannelConfig): boolean {
  if (!channel.enabled) return false;
  if (!channel.requiresAuth) return true;

  const creds = channel.credentials;
  if (!creds) return false;

  // APIキーがあればOK（DEV.to, Qiita, Hashnode等）
  if (creds.apiKey) return true;
  // ユーザー名+パスワードがあればOK（Playwright系）
  if (creds.username && creds.password) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Get channels relevant for a specific category
// ---------------------------------------------------------------------------

export function getChannelsByCategory(
  category: ChannelConfig["category"],
): ChannelConfig[] {
  return getDefaultChannels().filter((ch) => ch.category === category);
}
