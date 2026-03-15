/**
 * CMS Publisher — WordPress REST APIで生成コンテンツを自動公開
 *
 * - SEO記事 → 投稿として公開
 * - FAQ → FAQPage Schema JSON-LD付きで投稿として公開
 * - Schema → 固定ページとして公開
 *
 * WordPress Application Passwords認証。API従量課金ゼロ。
 */

import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CmsConfig {
  type: "wordpress";
  siteUrl: string;
  username: string;
  applicationPassword: string;
  defaultStatus: "publish" | "draft";
}

export interface PublishParams {
  projectId: string;
  taskId: string;
  content: {
    title: string;
    body: string;
    type: "article" | "faq" | "schema";
    keyword?: string;
    language?: string;
    schemaJsonLd?: string;
  };
  cmsConfig: CmsConfig;
  country: string;
  language: string;
}

interface WpPostResponse {
  id: number;
  link: string;
  title: { rendered: string };
  status: string;
}

interface WpSiteResponse {
  name: string;
  description: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAuthHeader(config: CmsConfig): string {
  const credentials = Buffer.from(
    `${config.username}:${config.applicationPassword}`,
  ).toString("base64");
  return `Basic ${credentials}`;
}

function normalizeUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/**
 * Build the HTML body for a FAQ post, injecting FAQPage schema JSON-LD.
 */
function buildFaqContent(body: string, schemaJsonLd?: string): string {
  let html = body;

  // Generate FAQPage schema from body if not provided
  const faqSchema = schemaJsonLd ?? generateFaqSchema(body);
  if (faqSchema) {
    html += `\n\n<!-- FAQPage Schema.org -->\n<script type="application/ld+json">\n${faqSchema}\n</script>`;
  }

  return html;
}

/**
 * Auto-generate FAQPage JSON-LD from FAQ body content.
 * Parses ## Question / Answer pairs.
 */
function generateFaqSchema(body: string): string | null {
  const lines = body.split("\n");
  const questions: { question: string; answer: string }[] = [];
  let currentQuestion = "";
  let currentAnswer = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (currentQuestion && currentAnswer) {
        questions.push({ question: currentQuestion, answer: currentAnswer.trim() });
      }
      currentQuestion = trimmed.replace(/^##\s*/, "");
      currentAnswer = "";
    } else if (currentQuestion && trimmed) {
      currentAnswer += (currentAnswer ? " " : "") + trimmed;
    }
  }
  if (currentQuestion && currentAnswer) {
    questions.push({ question: currentQuestion, answer: currentAnswer.trim() });
  }

  if (questions.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

// ---------------------------------------------------------------------------
// WordPress REST API — Publish
// ---------------------------------------------------------------------------

export async function publishToWordPress(
  params: PublishParams,
): Promise<{ postId: number; postUrl: string }> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_distribution",
    country: params.country,
    language: params.language,
    method: "WordPress",
    description: `CMS公開: "${params.content.title}" (${params.content.type})`,
  });

  try {
    const baseUrl = normalizeUrl(params.cmsConfig.siteUrl);
    const authHeader = buildAuthHeader(params.cmsConfig);

    // Determine endpoint: posts for articles/FAQ, pages for schema
    const isPage = params.content.type === "schema";
    const endpoint = isPage
      ? `${baseUrl}/wp-json/wp/v2/pages`
      : `${baseUrl}/wp-json/wp/v2/posts`;

    // Build content body
    let contentBody = params.content.body;
    if (params.content.type === "faq") {
      contentBody = buildFaqContent(contentBody, params.content.schemaJsonLd);
    }

    // Build request body
    const wpBody: Record<string, unknown> = {
      title: params.content.title,
      content: contentBody,
      status: params.cmsConfig.defaultStatus,
    };

    // Add keyword as tag (posts only, not pages)
    if (!isPage && params.content.keyword) {
      // WordPress REST API accepts tag names via `tags` only as IDs.
      // We use the simpler approach: add keyword as a category-style tag via content.
      // For proper tagging, we'd need to create/find the tag first.
      // For now, we include keyword info in the excerpt.
      wpBody.excerpt = `Keywords: ${params.content.keyword}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WordPress API error ${response.status}: ${errorText}`,
      );
    }

    const wpPost = (await response.json()) as WpPostResponse;

    addArtifact(activity.id, {
      type: "url",
      title: `WordPress ${isPage ? "ページ" : "投稿"}: ${wpPost.title.rendered}`,
      content: wpPost.link,
    });

    addArtifact(activity.id, {
      type: "json",
      title: "WordPress APIレスポンス",
      content: JSON.stringify(
        { id: wpPost.id, link: wpPost.link, status: wpPost.status },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: { postId: wpPost.id },
      details: {
        postUrl: wpPost.link,
        postType: isPage ? "page" : "post",
        wpStatus: wpPost.status,
      },
    });

    return { postId: wpPost.id, postUrl: wpPost.link };
  } catch (error) {
    failActivity(
      activity.id,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

// ---------------------------------------------------------------------------
// WordPress REST API — Connection Verify
// ---------------------------------------------------------------------------

export async function verifyWordPressConnection(
  config: CmsConfig,
): Promise<{ ok: boolean; siteName?: string; error?: string }> {
  try {
    const baseUrl = normalizeUrl(config.siteUrl);
    const authHeader = buildAuthHeader(config);

    // Test authentication by fetching site info with auth
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: "認証失敗: ユーザー名またはアプリケーションパスワードが正しくありません",
        };
      }
      return {
        ok: false,
        error: `WordPress API error ${response.status}: ${response.statusText}`,
      };
    }

    // Also fetch site name
    let siteName: string | undefined;
    try {
      const siteRes = await fetch(`${baseUrl}/wp-json`, {
        headers: { "Content-Type": "application/json" },
      });
      if (siteRes.ok) {
        const siteData = (await siteRes.json()) as WpSiteResponse;
        siteName = siteData.name;
      }
    } catch {
      // Site name is optional
    }

    return { ok: true, siteName };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
      return {
        ok: false,
        error: `WordPress サイトに接続できません: ${config.siteUrl}`,
      };
    }
    return { ok: false, error: message };
  }
}
