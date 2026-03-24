/**
 * Blog Publisher -- 各ブログプラットフォームへの記事投稿
 *
 * Medium, note.com, DEV.to, Qiita, Hashnode, Naver Blog, Tistory, CSDN等に
 * Playwright自動化またはAPI経由で記事を公開する。
 */

import type { Page } from "playwright";
import { getBrowserPool } from "../browser-pool.js";
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
// Screenshot helper
// ---------------------------------------------------------------------------

async function captureScreenshot(
  page: Page,
  activityId: string,
  title: string,
): Promise<void> {
  try {
    const screenshot = await page.screenshot({ fullPage: false, type: "png" });
    addArtifact(activityId, {
      type: "screenshot",
      title,
      content: screenshot.toString("base64"),
      mimeType: "image/png",
    });
  } catch (err) {
    console.warn(`[BlogPublisher] Screenshot failed: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Playwright-based publishers
// ---------------------------------------------------------------------------

async function publishToMedium(
  page: Page,
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  // Login
  if (channel.credentials?.username && channel.credentials?.password) {
    await page.goto("https://medium.com/m/signin", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    // Medium uses Google/Email sign-in flow
    const emailSignIn = page.locator('button:has-text("Sign in with email")').first();
    if (await emailSignIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailSignIn.click();
      await page.waitForTimeout(2000);
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(channel.credentials.username);
      // Medium sends a magic link, so password flow may differ
    }
    await page.waitForTimeout(3000);
  }

  // Navigate to new story
  await page.goto("https://medium.com/new-story", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Type title
  const titleEditor = page.locator('[data-testid="title"], h3[contenteditable], [role="textbox"]').first();
  await titleEditor.click();
  await page.keyboard.type(article.title, { delay: 20 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  // Type body (simplified -- Medium uses a rich editor)
  await page.keyboard.type(article.body.slice(0, 5000), { delay: 5 });
  await page.waitForTimeout(1000);

  await captureScreenshot(page, activityId, `Medium記事プレビュー: ${article.title}`);

  // Publish flow: click "..." menu -> Publish
  const publishMenu = page.locator('button:has-text("Publish"), [data-testid="publishButton"]').first();
  if (await publishMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishMenu.click();
    await page.waitForTimeout(2000);

    // Add tags
    for (const tag of article.tags.slice(0, 5)) {
      const tagInput = page.locator('input[placeholder*="tag"], input[placeholder*="Tag"]').first();
      if (await tagInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tagInput.fill(tag);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    }

    // Final publish button
    const finalPublish = page.locator('button:has-text("Publish now")').first();
    if (await finalPublish.isVisible({ timeout: 3000 }).catch(() => false)) {
      await finalPublish.click();
      await page.waitForTimeout(5000);
    }
  }

  await captureScreenshot(page, activityId, `Medium記事公開完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "medium",
    action: "post_article",
  };
}

async function publishToNoteCom(
  page: Page,
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  // Login
  if (channel.credentials?.username && channel.credentials?.password) {
    await page.goto("https://note.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[name="login"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(channel.credentials.username);
      const passwordInput = page.locator('input[name="password"]').first();
      await passwordInput.fill(channel.credentials.password);
      const loginBtn = page.locator('button[type="submit"]').first();
      await loginBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  // Navigate to new note
  await page.goto("https://note.com/notes/new", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Title
  const titleInput = page.locator('[placeholder*="タイトル"], input[name="title"]').first();
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill(article.title);
  }
  await page.waitForTimeout(500);

  // Body
  const bodyEditor = page.locator('[contenteditable="true"], [role="textbox"]').first();
  if (await bodyEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bodyEditor.click();
    await page.keyboard.type(article.body.slice(0, 5000), { delay: 5 });
  }
  await page.waitForTimeout(1000);

  await captureScreenshot(page, activityId, `note.com記事プレビュー: ${article.title}`);

  // Publish
  const publishBtn = page.locator('button:has-text("公開"), button:has-text("投稿")').first();
  if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(5000);
  }

  await captureScreenshot(page, activityId, `note.com記事公開完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "note_com",
    action: "post_article",
  };
}

async function publishToNaverBlog(
  page: Page,
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (channel.credentials?.username && channel.credentials?.password) {
    await page.goto("https://nid.naver.com/nidlogin.login", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const idInput = page.locator('#id').first();
    if (await idInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await idInput.fill(channel.credentials.username);
      const pwInput = page.locator('#pw').first();
      await pwInput.fill(channel.credentials.password);
      const loginBtn = page.locator('#log\\.login').first();
      await loginBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await page.goto("https://blog.naver.com/PostWriteForm.naver", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Title
  const titleInput = page.locator('[placeholder*="제목"], input[name="title"]').first();
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill(article.title);
  }

  // Body -- Naver Blog uses an iframe editor
  const editorFrame = page.frameLocator('#mainFrame').first();
  const editorBody = editorFrame.locator('[contenteditable="true"]').first();
  if (await editorBody.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editorBody.click();
    await page.keyboard.type(article.body.slice(0, 5000), { delay: 5 });
  }

  await captureScreenshot(page, activityId, `Naver Blog記事プレビュー`);

  const publishBtn = page.locator('button:has-text("발행"), button:has-text("등록")').first();
  if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(5000);
  }

  await captureScreenshot(page, activityId, `Naver Blog記事公開完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "naver_blog",
    action: "post_article",
  };
}

async function publishToTistory(
  page: Page,
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (channel.credentials?.username && channel.credentials?.password) {
    await page.goto("https://www.tistory.com/auth/login", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const loginBtn = page.locator('a:has-text("카카오계정")').first();
    if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(3000);
      const emailInput = page.locator('#loginId--1').first();
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill(channel.credentials.username);
        const pwInput = page.locator('#password--2').first();
        await pwInput.fill(channel.credentials.password);
        const submitBtn = page.locator('button:has-text("로그인")').first();
        await submitBtn.click();
        await page.waitForTimeout(5000);
      }
    }
  }

  await page.goto("https://www.tistory.com/entry/write", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  const titleInput = page.locator('#post-title-inp').first();
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill(article.title);
  }

  const bodyEditor = page.locator('[contenteditable="true"]').first();
  if (await bodyEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bodyEditor.click();
    await page.keyboard.type(article.body.slice(0, 5000), { delay: 5 });
  }

  await captureScreenshot(page, activityId, `Tistory記事プレビュー`);

  const publishBtn = page.locator('button:has-text("발행")').first();
  if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(3000);
    const confirmBtn = page.locator('button:has-text("발행")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await captureScreenshot(page, activityId, `Tistory記事公開完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "tistory",
    action: "post_article",
  };
}

async function publishToCSDN(
  page: Page,
  params: BlogPublishParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, article } = params;

  if (channel.credentials?.username && channel.credentials?.password) {
    await page.goto("https://passport.csdn.net/login", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[name="all"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(channel.credentials.username);
      const pwInput = page.locator('input[name="password"]').first();
      await pwInput.fill(channel.credentials.password);
      const loginBtn = page.locator('button:has-text("登录")').first();
      await loginBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await page.goto("https://editor.csdn.net/md", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Title
  const titleInput = page.locator('input.article-bar__title, input[placeholder*="标题"]').first();
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill(article.title);
  }

  // Body (Markdown editor)
  const editor = page.locator('.editor-area textarea, [contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editor.click();
    await page.keyboard.type(article.body.slice(0, 5000), { delay: 5 });
  }

  await captureScreenshot(page, activityId, `CSDN記事プレビュー`);

  const publishBtn = page.locator('button:has-text("发布"), button:has-text("Publish")').first();
  if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(3000);
    const confirmBtn = page.locator('button:has-text("确认发布")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await captureScreenshot(page, activityId, `CSDN記事公開完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "csdn",
    action: "post_article",
  };
}

// ---------------------------------------------------------------------------
// API-based publishers
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
// Router
// ---------------------------------------------------------------------------

const PLAYWRIGHT_HANDLERS: Partial<
  Record<
    ChannelType,
    (page: Page, params: BlogPublishParams, activityId: string) => Promise<PostResult>
  >
> = {
  medium: publishToMedium,
  note_com: publishToNoteCom,
  naver_blog: publishToNaverBlog,
  tistory: publishToTistory,
  csdn: publishToCSDN,
};

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
  // 認証情報チェック：APIキーもログイン情報もなければスキップ
  const creds = params.channel.credentials;
  if (params.channel.requiresAuth && !creds?.apiKey && !creds?.username) {
    return {
      success: false,
      error: `${params.channel.name}: 認証情報が未設定です。設定画面でAPIキーまたはアカウント情報を追加してください。`,
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
    description: `ブログ投稿: ${params.channel.name} — "${params.article.title}"`,
  });

  try {
    // Check if this platform uses API
    const apiHandler = API_HANDLERS[params.channel.type];
    if (apiHandler) {
      const result = await apiHandler(params, activity.id);

      if (result.success) {
        completeActivity(activity.id, {
          metrics: { published: 1 },
          details: { postUrl: result.postUrl, channel: params.channel.type },
        });
      } else {
        failActivity(activity.id, result.error ?? "Unknown error");
      }
      return result;
    }

    // Otherwise use Playwright
    const playwrightHandler = PLAYWRIGHT_HANDLERS[params.channel.type];
    if (!playwrightHandler) {
      const result: PostResult = {
        success: false,
        error: `Unsupported blog platform: ${params.channel.type}`,
        channel: params.channel.type,
        action: "post_article",
      };
      failActivity(activity.id, result.error!);
      return result;
    }

    const pool = getBrowserPool();
    const result = await pool.withPage(
      async (page) => playwrightHandler(page, params, activity.id),
      { country: params.channel.regions[0] },
    );

    addArtifact(activity.id, {
      type: "json",
      title: `投稿結果: ${params.channel.name}`,
      content: JSON.stringify(result, null, 2),
    });

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
