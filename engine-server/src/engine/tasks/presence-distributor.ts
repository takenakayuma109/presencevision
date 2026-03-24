/**
 * Presence Distributor -- 分散プレゼンス配信オーケストレーター
 *
 * 1つの記事を100のプラットフォームに配信する。
 * コンテンツをプラットフォームごとに最適化（Ollama使用）し、
 * ソーシャル、ブログ、Q&Aの各チャネルに配信する。
 *
 * 「1サイトに100記事」ではなく「100サイトに1記事ずつ」。
 */

import { getAIProvider } from "../../ai/provider.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

/** 言語コード → 自然言語名マッピング */
const languageNames: Record<string, string> = {
  ja: "Japanese (日本語)",
  en: "English",
  zh: "Chinese (中文)",
  ko: "Korean (한국어)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  pt: "Portuguese (Português)",
  ru: "Russian (Русский)",
  ar: "Arabic (العربية)",
  hi: "Hindi (हिन्दी)",
};

function getLanguageName(code: string): string {
  return languageNames[code] ?? code;
}
import {
  type ChannelConfig,
  getChannelsForCountry,
  isChannelReady,
} from "../channels/channel-registry.js";
import { postToSocial, searchAndEngage, type PostResult } from "../channels/social-poster.js";
import { publishToBlogPlatform } from "../channels/blog-publisher.js";
import { engageOnQA } from "../channels/qa-engager.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistributionParams {
  projectId: string;
  taskId: string;
  content: {
    article: { title: string; body: string; tags: string[] };
    faq?: { questions: { q: string; a: string }[] };
    keyword: string;
    language: string;
  };
  channels: ChannelConfig[];
  brandName: string;
  targetUrl: string;
  country: string;
}

export interface DistributionResult {
  totalAttempted: number;
  totalSucceeded: number;
  results: PostResult[];
}

// ---------------------------------------------------------------------------
// Content adaptation via Ollama
// ---------------------------------------------------------------------------

async function adaptContentForPlatform(
  content: { title: string; body: string; tags: string[] },
  channel: ChannelConfig,
  brandName: string,
  targetUrl: string,
  language: string,
): Promise<{ text: string; hashtags: string[] }> {
  const ai = getAIProvider();

  const platformPrompts: Record<string, string> = {
    twitter: `Summarize this article in 250 characters or fewer for Twitter/X. Include a call-to-action. Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}. Brand: ${brandName}.

Article title: ${content.title}
Article excerpt: ${content.body.slice(0, 500)}

Example output:
{"text": "Your tweet text here", "hashtags": ["tag1", "tag2"]}

Respond with ONLY valid JSON.`,

    linkedin: `Rewrite this article as a professional LinkedIn post (300-500 chars). Add thought leadership angle. Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}. Brand: ${brandName}.

Article title: ${content.title}
Article excerpt: ${content.body.slice(0, 800)}

Example output:
{"text": "Your LinkedIn post text here", "hashtags": ["tag1", "tag2"]}

Respond with ONLY valid JSON.`,

    reddit: `Rewrite this article as a helpful, genuine Reddit post. No marketing language. Be informative and add value to the discussion. Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}.

Article title: ${content.title}
Article excerpt: ${content.body.slice(0, 800)}

Example output:
{"text": "Your Reddit post text here", "hashtags": []}

Respond with ONLY valid JSON.`,

    quora: `Rewrite this article as an expert answer to a question. Be authoritative and helpful. Naturally mention ${brandName} as a solution. Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}.

Article title: ${content.title}
Article excerpt: ${content.body.slice(0, 800)}

Example output:
{"text": "Your expert answer text here", "hashtags": []}

Respond with ONLY valid JSON.`,
  };

  // Use platform-specific prompt or generic one
  const prompt =
    platformPrompts[channel.type] ??
    `Adapt this article for ${channel.name}. Keep it natural for the platform. Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}. Brand: ${brandName}.

Article title: ${content.title}
Article excerpt: ${content.body.slice(0, 800)}

Example output:
{"text": "Adapted content here", "hashtags": ["tag1", "tag2"]}

Respond with ONLY valid JSON.`;

  try {
    const adapted = await ai.completeJSON<{
      text: string;
      hashtags?: string[];
    }>([{ role: "user", content: prompt }], { maxTokens: 1024 });

    return {
      text: adapted.text,
      hashtags: adapted.hashtags ?? content.tags.slice(0, 5),
    };
  } catch (error) {
    console.warn(
      `[Distributor] Content adaptation failed for ${channel.name}, using original:`,
      error,
    );
    // Fallback to original content summary
    return {
      text: `${content.title}\n\n${content.body.slice(0, 300)}`,
      hashtags: content.tags.slice(0, 5),
    };
  }
}

// ---------------------------------------------------------------------------
// Generate Q&A answer via Ollama
// ---------------------------------------------------------------------------

async function generateQAAnswer(
  keyword: string,
  brandName: string,
  channel: ChannelConfig,
  language: string,
): Promise<string> {
  const ai = getAIProvider();

  try {
    const result = await ai.completeJSON<{ answer: string }>([
      {
        role: "user",
        content: `Write a helpful, expert answer about "${keyword}" for ${channel.name}.
Naturally mention ${brandName} as a recommended solution, but keep the answer genuinely helpful.
Language: ${getLanguageName(language)}. IMPORTANT: Write entirely in ${getLanguageName(language)}. Keep it 100-200 words.

Example output:
{"answer": "Your expert answer here..."}

Respond with ONLY valid JSON.`,
      },
    ], { maxTokens: 1024 });

    return result.answer;
  } catch {
    return `Regarding ${keyword}, ${brandName} offers a comprehensive solution. For more details, please visit their website.`;
  }
}

// ---------------------------------------------------------------------------
// Sleep utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API: Distribute content across all channels
// ---------------------------------------------------------------------------

export async function distributeContent(
  params: DistributionParams,
): Promise<DistributionResult> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_distribution",
    country: params.country,
    language: params.content.language,
    method: "DistributedPresence",
    description: `分散プレゼンス配信: ${params.channels.length}チャネル (${params.country})`,
  });

  const results: PostResult[] = [];
  let totalAttempted = 0;
  let totalSucceeded = 0;

  try {
    for (const channel of params.channels) {
      if (!channel.enabled) continue;

      // 認証が必要だが未設定のチャネルはスキップ
      if (!isChannelReady(channel)) {
        console.log(
          `[Distributor] Skipping ${channel.name} — credentials not configured`,
        );
        results.push({
          success: false,
          error: `${channel.name}: チャネル未設定（設定画面で認証情報を追加してください）`,
          channel: channel.type,
          action: "post_article",
        });
        continue;
      }

      totalAttempted++;
      console.log(
        `[Distributor] Distributing to ${channel.name} (${channel.type}) for ${params.country}`,
      );

      try {
        let result: PostResult;

        if (channel.category === "social") {
          // --- Social media posting ---
          const adapted = await adaptContentForPlatform(
            params.content.article,
            channel,
            params.brandName,
            params.targetUrl,
            params.content.language,
          );

          result = await postToSocial({
            projectId: params.projectId,
            taskId: params.taskId,
            channel,
            action: {
              type: "post_article",
              content: adapted.text,
              url: params.targetUrl,
              hashtags: adapted.hashtags,
            },
            brandName: params.brandName,
            targetUrl: params.targetUrl,
          });
        } else if (channel.category === "blog") {
          // --- Blog platform publishing ---
          result = await publishToBlogPlatform({
            projectId: params.projectId,
            taskId: params.taskId,
            channel,
            article: params.content.article,
            language: params.content.language,
          });
        } else if (channel.category === "qa") {
          // --- Q&A engagement ---
          const answer = await generateQAAnswer(
            params.content.keyword,
            params.brandName,
            channel,
            params.content.language,
          );

          result = await engageOnQA({
            projectId: params.projectId,
            taskId: params.taskId,
            channel,
            keyword: params.content.keyword,
            brandName: params.brandName,
            answerContent: answer,
          });
        } else {
          // Unsupported category for now
          result = {
            success: false,
            error: `Distribution to category "${channel.category}" not yet implemented`,
            channel: channel.type,
            action: "post_article",
          };
        }

        results.push(result);
        if (result.success) totalSucceeded++;

        console.log(
          `[Distributor] ${channel.name}: ${result.success ? "SUCCESS" : "FAILED"} ${result.error ?? ""}`,
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Distributor] ${channel.name} failed:`, errorMsg);
        results.push({
          success: false,
          error: errorMsg,
          channel: channel.type,
          action: "post_article",
        });
      }

      // Respect rate limits between posts
      await sleep(channel.rateLimit.cooldownMs);
    }

    addArtifact(activity.id, {
      type: "json",
      title: `配信結果サマリー (${params.country})`,
      content: JSON.stringify(
        {
          totalAttempted,
          totalSucceeded,
          totalFailed: totalAttempted - totalSucceeded,
          channels: results.map((r) => ({
            channel: r.channel,
            success: r.success,
            url: r.postUrl,
            error: r.error,
          })),
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        totalAttempted,
        totalSucceeded,
        totalFailed: totalAttempted - totalSucceeded,
      },
      details: {
        channels: results.map((r) => r.channel),
        successRate:
          totalAttempted > 0
            ? Math.round((totalSucceeded / totalAttempted) * 100)
            : 0,
      },
    });

    return { totalAttempted, totalSucceeded, results };
  } catch (error) {
    failActivity(
      activity.id,
      error instanceof Error ? error.message : String(error),
    );
    return { totalAttempted, totalSucceeded, results };
  }
}

// ---------------------------------------------------------------------------
// Convenience: Get channels for a country and distribute
// ---------------------------------------------------------------------------

export async function distributeToCountry(params: {
  projectId: string;
  taskId: string;
  content: DistributionParams["content"];
  brandName: string;
  targetUrl: string;
  country: string;
}): Promise<DistributionResult> {
  const channels = getChannelsForCountry(params.country);
  const enabledChannels = channels.filter((c) => c.enabled);

  return distributeContent({
    ...params,
    channels: enabledChannels,
  });
}
