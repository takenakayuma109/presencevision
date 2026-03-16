/**
 * Hub & Spoke Distribution Engine
 *
 * Hub = ユーザーの自サイトに公開された記事（正規URL）
 * Spoke = 各チャネルに最適化されたコンテンツ + Hubへのバックリンク
 *
 * 全てのトラフィックをHubに集約する「ハブ＆スポーク」配信戦略。
 */

import { transformForChannel } from "./transformer";
import { scheduleDistribution, type PostingRule } from "./scheduler";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HubContent {
  articleId: string;
  projectId: string;
  title: string;
  content: string; // Full markdown article
  keywords: string[];
  hubUrl: string; // URL on user's own site (the hub)
  publishedAt: string;
}

export interface SpokePost {
  id: string;
  articleId: string;
  channel: string;
  content: string; // Transformed content for this channel
  mediaUrls: string[]; // Associated images
  hubBacklink: string; // Link back to hub
  status: "pending" | "published" | "failed";
  publishedAt?: string;
}

export interface ConnectedChannel {
  type: string;
  enabled: boolean;
  brandVoice: string;
  tone: string;
  language: string;
  includeHashtags: boolean;
  includeEmoji: boolean;
}

export interface DistributeResult {
  hubContent: HubContent;
  spokes: SpokePost[];
  totalGenerated: number;
  totalPublished: number;
  totalFailed: number;
}

// ---------------------------------------------------------------------------
// In-memory storage
// ---------------------------------------------------------------------------

const hubStore = new Map<string, HubContent>();
const spokeStore = new Map<string, SpokePost>();

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let spokeCounter = 0;

function generateSpokeId(): string {
  spokeCounter++;
  return `spoke_${Date.now()}_${spokeCounter}`;
}

// ---------------------------------------------------------------------------
// Public API: Register the hub article
// ---------------------------------------------------------------------------

export function createHubContent(
  article: { title: string; content: string; keywords: string[] },
  projectId: string,
  hubUrl: string,
): HubContent {
  const hubContent: HubContent = {
    articleId: `hub_${Date.now()}`,
    projectId,
    title: article.title,
    content: article.content,
    keywords: article.keywords,
    hubUrl,
    publishedAt: new Date().toISOString(),
  };

  hubStore.set(hubContent.articleId, hubContent);
  return hubContent;
}

// ---------------------------------------------------------------------------
// Public API: Generate spoke posts for each connected channel
// ---------------------------------------------------------------------------

export function generateSpokes(
  hubContent: HubContent,
  connectedChannels: ConnectedChannel[],
): SpokePost[] {
  const spokes: SpokePost[] = [];

  for (const channel of connectedChannels) {
    if (!channel.enabled) continue;

    const transformed = transformForChannel(
      hubContent.content,
      channel.type as Parameters<typeof transformForChannel>[1],
      {
        brandVoice: channel.brandVoice,
        tone: channel.tone,
        language: channel.language,
        includeHashtags: channel.includeHashtags,
        includeEmoji: channel.includeEmoji,
      },
    );

    const spoke: SpokePost = {
      id: generateSpokeId(),
      articleId: hubContent.articleId,
      channel: channel.type,
      content: transformed.content,
      mediaUrls: [],
      hubBacklink: hubContent.hubUrl,
      status: "pending",
    };

    spokeStore.set(spoke.id, spoke);
    spokes.push(spoke);
  }

  return spokes;
}

// ---------------------------------------------------------------------------
// Public API: Publish a single spoke post (placeholder for actual API calls)
// ---------------------------------------------------------------------------

export async function distributeSpoke(spoke: SpokePost): Promise<SpokePost> {
  try {
    // TODO: Replace with actual platform API calls or Playwright automation
    // For now, simulate publishing with a short delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      `[HubSpoke] Published spoke ${spoke.id} to ${spoke.channel}`,
    );

    const updated: SpokePost = {
      ...spoke,
      status: "published",
      publishedAt: new Date().toISOString(),
    };

    spokeStore.set(updated.id, updated);
    return updated;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[HubSpoke] Failed to publish spoke ${spoke.id} to ${spoke.channel}: ${errorMsg}`,
    );

    const updated: SpokePost = {
      ...spoke,
      status: "failed",
    };

    spokeStore.set(updated.id, updated);
    return updated;
  }
}

// ---------------------------------------------------------------------------
// Public API: Orchestrate full hub & spoke distribution
// ---------------------------------------------------------------------------

export async function distributeAll(
  hubContent: HubContent,
  connectedChannels: ConnectedChannel[],
  postingRules?: PostingRule[],
): Promise<DistributeResult> {
  console.log(
    `[HubSpoke] Starting distribution for "${hubContent.title}" to ${connectedChannels.length} channels`,
  );

  // 1. Generate spoke posts
  const spokes = generateSpokes(hubContent, connectedChannels);
  console.log(`[HubSpoke] Generated ${spokes.length} spoke posts`);

  // 2. Schedule if rules are provided, otherwise distribute immediately
  if (postingRules && postingRules.length > 0) {
    const scheduled = scheduleDistribution(spokes, postingRules);
    console.log(`[HubSpoke] Scheduled ${scheduled.length} posts with timing rules`);
  }

  // 3. Distribute each spoke
  const results: SpokePost[] = [];
  for (const spoke of spokes) {
    const result = await distributeSpoke(spoke);
    results.push(result);
  }

  const totalPublished = results.filter((s) => s.status === "published").length;
  const totalFailed = results.filter((s) => s.status === "failed").length;

  console.log(
    `[HubSpoke] Distribution complete: ${totalPublished} published, ${totalFailed} failed`,
  );

  return {
    hubContent,
    spokes: results,
    totalGenerated: spokes.length,
    totalPublished,
    totalFailed,
  };
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getHubContent(articleId: string): HubContent | undefined {
  return hubStore.get(articleId);
}

export function getSpokesForArticle(articleId: string): SpokePost[] {
  return Array.from(spokeStore.values()).filter(
    (s) => s.articleId === articleId,
  );
}

export function getSpokeById(spokeId: string): SpokePost | undefined {
  return spokeStore.get(spokeId);
}
