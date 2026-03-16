/**
 * Channel Content Transformer
 *
 * Hub記事を各チャネル向けに最適化変換する。
 * プラットフォームごとの文字数制限、トーン、フォーマットに対応。
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelType =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "medium"
  | "note"
  | "devto"
  | "qiita"
  | "reddit"
  | "quora"
  | "pinterest"
  | "tiktok"
  | "youtube";

export interface TransformConfig {
  brandVoice: string;
  tone: string;
  maxLength?: number;
  includeHashtags: boolean;
  includeEmoji: boolean;
  language: string;
}

export interface TransformResult {
  content: string;
  metadata: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the first H1 or H2 title from markdown */
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#{1,2}\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

/** Extract the first paragraph of meaningful text (skip headings, blanks) */
function extractFirstParagraph(markdown: string): string {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!") && !trimmed.startsWith("-")) {
      return trimmed;
    }
  }
  return "";
}

/** Extract all headings (H2/H3) as key points */
function extractKeyPoints(markdown: string): string[] {
  const headings: string[] = [];
  const regex = /^#{2,3}\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

/** Strip markdown formatting to plain text */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "") // images
    .replace(/^[-*]\s+/gm, "") // list items
    .replace(/^\d+\.\s+/gm, "") // numbered list items
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/\n{3,}/g, "\n\n") // collapse multiple newlines
    .trim();
}

/** Truncate text to maxLength, respecting word boundaries */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
}

/** Generate hashtags from keywords in the content title */
function generateHashtags(title: string, keywords: string[], max: number): string[] {
  const tags: string[] = [];
  // Use title words as potential hashtags
  const words = title
    .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  for (const kw of keywords) {
    tags.push(kw.replace(/\s+/g, ""));
  }
  for (const w of words) {
    if (tags.length >= max) break;
    if (!tags.includes(w)) tags.push(w);
  }
  return tags.slice(0, max);
}

/** Extract keywords from markdown content */
function extractKeywords(markdown: string): string[] {
  const title = extractTitle(markdown);
  const keyPoints = extractKeyPoints(markdown);
  const words = [title, ...keyPoints]
    .join(" ")
    .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Deduplicate
  return Array.from(new Set(words)).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Platform-specific transformers
// ---------------------------------------------------------------------------

function transformForTwitter(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const firstParagraph = extractFirstParagraph(content);
  const keywords = extractKeywords(content);

  // Single tweet version: key insight + link placeholder
  const insight = firstParagraph || title;
  let tweet = truncate(insight, 250);

  if (config.includeHashtags) {
    const tags = generateHashtags(title, keywords, 3);
    const hashtagStr = tags.map((t) => `#${t}`).join(" ");
    // Ensure we stay within 280 chars with hashtags
    const available = 280 - hashtagStr.length - 2; // 2 for newline + space
    tweet = truncate(tweet, available) + "\n" + hashtagStr;
  }

  // Thread version for longer content
  const keyPoints = extractKeyPoints(content);
  const rawThread: string[] = [];
  if (keyPoints.length > 0) {
    // First pass: build tweets with placeholder for total count
    rawThread.push(truncate(`${config.includeEmoji ? "🧵 " : ""}${title}`, 270) + " (1/__COUNT__)");
    for (let i = 0; i < Math.min(keyPoints.length, 3); i++) {
      rawThread.push(truncate(keyPoints[i], 270) + ` (${i + 2}/__COUNT__)`);
    }
    rawThread.push(
      truncate(
        `${config.includeEmoji ? "👉 " : ""}Read more: {hubUrl}`,
        280,
      ) + ` (${rawThread.length + 1}/__COUNT__)`,
    );
  }
  // Replace placeholder count with actual total
  const threadCount = rawThread.length || 1;
  const thread = rawThread.map((t) => t.replace(/__COUNT__/g, String(threadCount)));

  return {
    content: tweet,
    metadata: {
      type: "tweet",
      threadVersion: JSON.stringify(thread),
      charCount: String(tweet.length),
    },
  };
}

function transformForLinkedIn(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const firstParagraph = extractFirstParagraph(content);

  // Professional summary
  let post = "";
  if (config.includeEmoji) {
    post += `💡 ${title}\n\n`;
  } else {
    post += `${title}\n\n`;
  }

  // Brief intro
  post += truncate(firstParagraph, 200) + "\n\n";

  // Key takeaways as bullet points
  if (keyPoints.length > 0) {
    post += "Key takeaways:\n";
    for (const point of keyPoints.slice(0, 5)) {
      post += `• ${point}\n`;
    }
    post += "\n";
  }

  post += "{hubUrl}";

  // Enforce length
  post = truncate(post, 500);

  if (config.includeHashtags) {
    const keywords = extractKeywords(content);
    const tags = generateHashtags(title, keywords, 5);
    post += "\n\n" + tags.map((t) => `#${t}`).join(" ");
  }

  return {
    content: post,
    metadata: {
      type: "linkedin_post",
      tone: "professional",
      charCount: String(post.length),
    },
  };
}

function transformForInstagram(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const firstParagraph = extractFirstParagraph(content);
  const keywords = extractKeywords(content);

  // Short caption
  let caption = truncate(firstParagraph || title, 150);

  if (config.includeEmoji) {
    caption = `✨ ${caption}`;
  }

  // Hashtags (up to 30 for Instagram)
  let hashtags = "";
  if (config.includeHashtags) {
    const tags = generateHashtags(title, keywords, 30);
    hashtags = tags.map((t) => `#${t}`).join(" ");
  }

  const fullCaption = hashtags ? `${caption}\n.\n.\n${hashtags}` : caption;

  return {
    content: fullCaption,
    metadata: {
      type: "instagram_caption",
      note: "Content is mainly visual - generate card image separately",
      captionLength: String(caption.length),
      hashtagCount: String(keywords.length),
    },
  };
}

function transformForFacebook(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const firstParagraph = extractFirstParagraph(content);

  // Medium-length conversational post
  let post = "";
  if (config.includeEmoji) {
    post += `📢 `;
  }
  post += `${title}\n\n`;
  post += truncate(firstParagraph, 300);
  post += `\n\n${config.includeEmoji ? "👉 " : ""}Read more: {hubUrl}`;

  post = truncate(post, 400);

  return {
    content: post,
    metadata: {
      type: "facebook_post",
      tone: "conversational",
      charCount: String(post.length),
    },
  };
}

function transformForMedium(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);

  // Rewrite with different intro angle to avoid duplicate content
  let article = `# ${title}: A Different Perspective\n\n`;
  article += `*Originally published at {hubUrl}*\n\n`;
  article += `---\n\n`;

  // New intro paragraph with different angle
  article += `Have you ever considered the impact of ${title.toLowerCase()}? `;
  article += `In this article, we explore the key aspects that matter most.\n\n`;

  // Rebuild content from key points
  for (const point of keyPoints) {
    article += `## ${point}\n\n`;
    // Extract relevant paragraph from original content
    const idx = content.indexOf(point);
    if (idx >= 0) {
      const afterHeading = content.slice(idx + point.length);
      const nextHeading = afterHeading.search(/^#{2,3}\s+/m);
      const section = nextHeading > 0
        ? afterHeading.slice(0, nextHeading)
        : afterHeading.slice(0, 500);
      article += stripMarkdown(section).trim() + "\n\n";
    }
  }

  article += `---\n\n`;
  article += `*This article was originally published on [our blog]({hubUrl}). `;
  article += `Visit the original for the full version with additional resources.*\n`;

  return {
    content: article,
    metadata: {
      type: "medium_article",
      canonicalUrl: "{hubUrl}",
      wordCount: String(article.split(/\s+/).length),
    },
  };
}

function transformForNote(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const plainText = stripMarkdown(content);

  // Japanese-optimized casual/personal tone
  let article = `# ${title}\n\n`;
  article += `こんにちは！今日は「${title}」についてお話しします。\n\n`;

  // Rebuild in casual Japanese style
  for (const point of keyPoints) {
    article += `## ${point}\n\n`;
    const idx = content.indexOf(point);
    if (idx >= 0) {
      const afterHeading = content.slice(idx + point.length);
      const nextHeading = afterHeading.search(/^#{2,3}\s+/m);
      const section = nextHeading > 0
        ? afterHeading.slice(0, nextHeading)
        : afterHeading.slice(0, 500);
      article += stripMarkdown(section).trim() + "\n\n";
    }
  }

  article += `---\n\n`;
  article += `この記事の元記事はこちら: {hubUrl}\n`;
  article += `もっと詳しく知りたい方はぜひご覧ください！\n`;

  return {
    content: article,
    metadata: {
      type: "note_article",
      language: "ja",
      tone: "casual_personal",
      originalUrl: "{hubUrl}",
    },
  };
}

function transformForDevTo(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const keywords = extractKeywords(content);

  // dev.to-specific frontmatter
  const tags = keywords.slice(0, 4).map((k) => k.toLowerCase().replace(/\s+/g, ""));

  let article = `---\n`;
  article += `title: "${title}"\n`;
  article += `published: true\n`;
  article += `tags: ${tags.join(", ")}\n`;
  article += `canonical_url: {hubUrl}\n`;
  article += `---\n\n`;

  // Technical angle
  article += `## Introduction\n\n`;
  article += extractFirstParagraph(content) + "\n\n";

  // Add code example placeholder
  article += `## Quick Example\n\n`;
  article += "```typescript\n";
  article += `// Example implementation for ${title}\n`;
  article += `// See the full article for detailed walkthrough\n`;
  article += "```\n\n";

  // Key sections from original
  for (const point of keyPoints.slice(0, 5)) {
    article += `## ${point}\n\n`;
    const idx = content.indexOf(point);
    if (idx >= 0) {
      const afterHeading = content.slice(idx + point.length);
      const nextHeading = afterHeading.search(/^#{2,3}\s+/m);
      const section = nextHeading > 0
        ? afterHeading.slice(0, nextHeading)
        : afterHeading.slice(0, 400);
      article += stripMarkdown(section).trim() + "\n\n";
    }
  }

  article += `## Wrapping Up\n\n`;
  article += `Check out the [full article]({hubUrl}) for more details and examples.\n`;

  return {
    content: article,
    metadata: {
      type: "devto_article",
      tags: tags.join(","),
      canonicalUrl: "{hubUrl}",
    },
  };
}

function transformForQiita(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const keywords = extractKeywords(content);

  // Qiita tags (max 5)
  const tags = keywords.slice(0, 5).map((k) => k.replace(/\s+/g, ""));

  let article = `<!--\n`;
  article += `title: ${title}\n`;
  article += `tags: ${tags.join(",")}\n`;
  article += `-->\n\n`;

  article += `# ${title}\n\n`;
  article += `## はじめに\n\n`;
  article += extractFirstParagraph(content) + "\n\n";

  // Sections from original
  for (const point of keyPoints.slice(0, 5)) {
    article += `## ${point}\n\n`;
    const idx = content.indexOf(point);
    if (idx >= 0) {
      const afterHeading = content.slice(idx + point.length);
      const nextHeading = afterHeading.search(/^#{2,3}\s+/m);
      const section = nextHeading > 0
        ? afterHeading.slice(0, nextHeading)
        : afterHeading.slice(0, 400);
      article += stripMarkdown(section).trim() + "\n\n";
    }
  }

  article += `## まとめ\n\n`;
  article += `詳細は[元記事]({hubUrl})をご参照ください。\n`;

  return {
    content: article,
    metadata: {
      type: "qiita_article",
      language: "ja",
      tags: tags.join(","),
      originalUrl: "{hubUrl}",
    },
  };
}

function transformForReddit(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const firstParagraph = extractFirstParagraph(content);

  // Value-first approach -- NOT promotional
  let post = `**${title}**\n\n`;
  post += `${firstParagraph}\n\n`;

  // Share key insights as helpful tips
  if (keyPoints.length > 0) {
    post += `Here's what I've found works:\n\n`;
    for (const point of keyPoints.slice(0, 4)) {
      post += `- **${point}**\n`;
    }
    post += "\n";
  }

  // Natural link at the end
  post += `I wrote a more detailed breakdown here if anyone's interested: {hubUrl}\n\n`;
  post += `Would love to hear your experiences with this. What has worked for you?`;

  return {
    content: post,
    metadata: {
      type: "reddit_post",
      tone: "helpful_discussion",
      note: "Frame as discussion, not promotion",
    },
  };
}

function transformForQuora(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const firstParagraph = extractFirstParagraph(content);

  // Expert answer format
  let answer = `Great question! Based on my experience with ${title.toLowerCase()}, here's what I can share:\n\n`;
  answer += `${firstParagraph}\n\n`;

  // Key points as expert insights
  if (keyPoints.length > 0) {
    answer += `The key factors to consider are:\n\n`;
    for (const point of keyPoints.slice(0, 4)) {
      answer += `**${point}** - This is important because it directly impacts your results.\n\n`;
    }
  }

  // Cite the hub article
  answer += `I covered this topic in detail in a recent article: {hubUrl}\n\n`;
  answer += `Hope this helps! Feel free to ask follow-up questions.`;

  return {
    content: answer,
    metadata: {
      type: "quora_answer",
      tone: "authoritative_helpful",
      sourceUrl: "{hubUrl}",
    },
  };
}

function transformForPinterest(content: string, config: TransformConfig): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);
  const keywords = extractKeywords(content);

  // Extract 3-5 tips for pin description
  const tips = keyPoints.slice(0, 5);

  let description = `${title}\n\n`;
  if (tips.length > 0) {
    for (let i = 0; i < tips.length; i++) {
      description += `${config.includeEmoji ? "✅ " : `${i + 1}. `}${tips[i]}\n`;
    }
    description += "\n";
  }

  // SEO-optimized keywords
  if (config.includeHashtags) {
    const tags = generateHashtags(title, keywords, 10);
    description += tags.map((t) => `#${t}`).join(" ");
  }

  description += `\n\nRead more: {hubUrl}`;

  return {
    content: truncate(description, 500),
    metadata: {
      type: "pinterest_pin",
      keywords: keywords.join(","),
      tipCount: String(tips.length),
    },
  };
}

function transformForVideoScript(
  content: string,
  config: TransformConfig,
  platform: "tiktok" | "youtube",
): TransformResult {
  const title = extractTitle(content);
  const keyPoints = extractKeyPoints(content);

  const maxPoints = platform === "tiktok" ? 3 : 3;
  const selectedPoints = keyPoints.slice(0, maxPoints);

  // Script outline: intro hook -> 3 points -> CTA
  let script = `## Script: ${title}\n\n`;

  // Hook
  script += `### HOOK (0-3s)\n`;
  script += `"Did you know about ${title.toLowerCase()}? Here's what you need to know."\n\n`;

  // Main points
  for (let i = 0; i < selectedPoints.length; i++) {
    const timeMark = platform === "tiktok" ? `${3 + i * 8}-${11 + i * 8}s` : `${3 + i * 15}-${18 + i * 15}s`;
    script += `### POINT ${i + 1} (${timeMark})\n`;
    script += `"${selectedPoints[i]}"\n`;
    script += `[Visual: On-screen text + relevant B-roll]\n\n`;
  }

  // CTA
  const ctaTime = platform === "tiktok" ? "27-30s" : "48-60s";
  script += `### CTA (${ctaTime})\n`;
  script += `"Follow for more tips like this! Link in bio for the full guide."\n`;
  script += `[Visual: Point to link / Subscribe button]\n\n`;

  script += `---\n`;
  script += `Full article: {hubUrl}\n`;

  return {
    content: script,
    metadata: {
      type: `${platform}_script`,
      format: "short_form_video",
      pointCount: String(selectedPoints.length),
      estimatedDuration: platform === "tiktok" ? "30s" : "60s",
    },
  };
}

// ---------------------------------------------------------------------------
// Router: Transform content for the given channel
// ---------------------------------------------------------------------------

export function transformForChannel(
  content: string,
  channel: ChannelType,
  config: TransformConfig,
): TransformResult {
  switch (channel) {
    case "twitter":
      return transformForTwitter(content, config);
    case "linkedin":
      return transformForLinkedIn(content, config);
    case "instagram":
      return transformForInstagram(content, config);
    case "facebook":
      return transformForFacebook(content, config);
    case "medium":
      return transformForMedium(content, config);
    case "note":
      return transformForNote(content, config);
    case "devto":
      return transformForDevTo(content, config);
    case "qiita":
      return transformForQiita(content, config);
    case "reddit":
      return transformForReddit(content, config);
    case "quora":
      return transformForQuora(content, config);
    case "pinterest":
      return transformForPinterest(content, config);
    case "tiktok":
      return transformForVideoScript(content, config, "tiktok");
    case "youtube":
      return transformForVideoScript(content, config, "youtube");
    default: {
      // Fallback: plain text summary
      const title = extractTitle(content);
      const plain = stripMarkdown(content);
      return {
        content: truncate(`${title}\n\n${plain}\n\n{hubUrl}`, 500),
        metadata: {
          type: "generic",
          channel: channel as string,
          note: "No platform-specific transformer found, using generic",
        },
      };
    }
  }
}
