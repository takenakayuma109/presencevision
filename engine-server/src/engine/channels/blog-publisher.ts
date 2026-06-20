/**
 * Blog Publisher — 公式API経由のブログ配信のみ（安全・コンプライアンス方針）
 *
 * DEV.to / Qiita / Hashnode への「公式API + ユーザー自身のAPIキー」による投稿のみを
 * サポートする。以前あった Medium / note.com / Naver Blog / Tistory / CSDN への
 * Playwright（資格情報ブラウザ自動化）投稿は、各サイトの利用規約違反であり、かつ
 * 投稿成否を検証せず無条件に success:true を返す「幻の成功」問題があったため全面廃止した。
 */

import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";
import type { ChannelConfig, ChannelType } from "./channel-registry.js";
import type { PostResult } from "./social-poster.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPublishParams {
  projectId: string;
  taskId: string;
  channel: ChannelConfig;
  article: { title: string; body: string; tags: string[] };
  language: string;
}

// ---------------------------------------------------------------------------
// API-based publishers (official APIs, user-provided API keys)
// ---------------------------------------------------------------------------

async function publishToDevTo(
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (!channel.credentials?.apiKey) {
    return {
      success: false,
      error: "DEV.to API key not configured",
      channel: "dev_to",
      action: "post_article",
    };
  }

  try {
    const response = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": channel.credentials.apiKey,
      },
      body: JSON.stringify({
        article: {
          title: article.title,
          body_markdown: article.body,
          published: true,
          tags: article.tags.slice(0, 4), // DEV.to allows max 4 tags
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DEV.to API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { url?: string; id?: number };

    addArtifact(activityId, {
      type: "url",
      title: `DEV.to記事: ${article.title}`,
      content: data.url ?? "",
    });

    return {
      success: true,
      postUrl: data.url,
      channel: "dev_to",
      action: "post_article",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      channel: "dev_to",
      action: "post_article",
    };
  }
}

async function publishToQiita(
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (!channel.credentials?.apiKey) {
    return {
      success: false,
      error: "Qiita API token not configured",
      channel: "qiita",
      action: "post_article",
    };
  }

  try {
    const response = await fetch("https://qiita.com/api/v2/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channel.credentials.apiKey}`,
      },
      body: JSON.stringify({
        title: article.title,
        body: article.body,
        private: false,
        tags: article.tags.slice(0, 5).map((name) => ({ name, versions: [] })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Qiita API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { url?: string; id?: string };

    addArtifact(activityId, {
      type: "url",
      title: `Qiita記事: ${article.title}`,
      content: data.url ?? "",
    });

    return {
      success: true,
      postUrl: data.url,
      channel: "qiita",
      action: "post_article",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      channel: "qiita",
      action: "post_article",
    };
  }
}

async function publishToHashnode(
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (!channel.credentials?.apiKey) {
    return {
      success: false,
      error: "Hashnode API key not configured",
      channel: "hashnode",
      action: "post_article",
    };
  }

  try {
    // Hashnode uses GraphQL API
    const mutation = `
      mutation CreatePublicationStory($input: CreateStoryInput!) {
        createPublicationStory(input: $input) {
          post {
            slug
            title
          }
        }
      }
    `;

    const response = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: channel.credentials.apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title: article.title,
            contentMarkdown: article.body,
            tags: article.tags.slice(0, 5).map((name) => ({
              slug: name.toLowerCase().replace(/\s+/g, "-"),
              name,
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hashnode API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      data?: { createPublicationStory?: { post?: { slug?: string } } };
    };
    const slug = data.data?.createPublicationStory?.post?.slug;

    addArtifact(activityId, {
      type: "url",
      title: `Hashnode記事: ${article.title}`,
      content: slug ? `https://hashnode.com/post/${slug}` : "",
    });

    return {
      success: true,
      postUrl: slug ? `https://hashnode.com/post/${slug}` : undefined,
      channel: "hashnode",
      action: "post_article",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      channel: "hashnode",
      action: "post_article",
    };
  }
}

// ---------------------------------------------------------------------------
// Router — official-API platforms only
// ---------------------------------------------------------------------------

const API_HANDLERS: Partial<
  Record<
    ChannelType,
    (params: BlogPublishParams, activityId: string) => Promise<PostResult>
  >
> = {
  dev_to: publishToDevTo,
  qiita: publishToQiita,
  hashnode: publishToHashnode,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function publishToBlogPlatform(
  params: BlogPublishParams,
): Promise<PostResult> {
  const handler = API_HANDLERS[params.channel.type];

  // ブラウザ自動化（資格情報ログイン）系は廃止済み。公式API対応プラットフォームのみ許可。
  if (!handler) {
    return {
      success: false,
      error: `${params.channel.name}: このプラットフォームへの自動投稿は無効化されています（公式API対応のみ: DEV.to / Qiita / Hashnode）。`,
      channel: params.channel.type,
      action: "post_article",
    };
  }

  if (!params.channel.credentials?.apiKey) {
    return {
      success: false,
      error: `${params.channel.name}: APIキーが未設定です。設定画面でAPIキーを追加してください。`,
      channel: params.channel.type,
      action: "post_article",
    };
  }

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_distribution",
    country: params.channel.regions[0] ?? "GLOBAL",
    language: params.language,
    method: "BlogDistribution",
    description: `ブログ投稿(公式API): ${params.channel.name} — "${params.article.title}"`,
  });

  try {
    const result = await handler(params, activity.id);

    if (result.success) {
      completeActivity(activity.id, {
        metrics: { published: 1 },
        details: { postUrl: result.postUrl, channel: params.channel.type },
      });
    } else {
      failActivity(activity.id, result.error ?? "Unknown error");
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    failActivity(activity.id, errorMsg);
    return {
      success: false,
      error: errorMsg,
      channel: params.channel.type,
      action: "post_article",
    };
  }
}
