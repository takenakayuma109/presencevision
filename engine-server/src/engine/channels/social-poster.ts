/**
 * Social Poster -- Playwrightでソーシャルメディアに自動投稿
 *
 * Twitter/X, LinkedIn, Facebook等に対してブラウザ自動化で投稿。
 * キーワード検索 → エンゲージメント（いいね、RT）も実行可能。
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocialPostParams {
  projectId: string;
  taskId: string;
  channel: ChannelConfig;
  action: {
    type: "post_article" | "retweet" | "share" | "search_engage";
    content: string;
    url?: string;
    hashtags?: string[];
    keyword?: string;
  };
  brandName: string;
  targetUrl: string;
}

export interface PostResult {
  success: boolean;
  postUrl?: string;
  error?: string;
  channel: ChannelType;
  action: string;
}

// ---------------------------------------------------------------------------
// Login helper -- reusable across platforms
// ---------------------------------------------------------------------------

async function loginIfNeeded(
  page: Page,
  channel: ChannelConfig,
  loginUrl: string,
  usernameSelector: string,
  passwordSelector: string,
  submitSelector: string,
): Promise<void> {
  if (!channel.credentials?.username || !channel.credentials?.password) {
    console.log(`[SocialPoster] No credentials for ${channel.name}, skipping login`);
    return;
  }

  await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Check if already logged in by seeing if login form exists
  const usernameField = page.locator(usernameSelector).first();
  if (!(await usernameField.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log(`[SocialPoster] Already logged in to ${channel.name}`);
    return;
  }

  await usernameField.fill(channel.credentials.username);
  await page.waitForTimeout(500);

  const passwordField = page.locator(passwordSelector).first();
  await passwordField.fill(channel.credentials.password);
  await page.waitForTimeout(500);

  await page.locator(submitSelector).first().click();
  await page.waitForTimeout(5000);

  console.log(`[SocialPoster] Logged in to ${channel.name}`);
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
    console.warn(`[SocialPoster] Screenshot failed: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Platform-specific handlers
// ---------------------------------------------------------------------------

async function postToTwitter(
  page: Page,
  params: SocialPostParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, action } = params;

  // Login
  await loginIfNeeded(
    page,
    channel,
    "https://twitter.com/login",
    'input[autocomplete="username"]',
    'input[name="password"]',
    '[data-testid="LoginForm_Login_Button"]',
  );

  // Navigate to compose
  await page.goto("https://twitter.com/compose/tweet", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Compose tweet
  let tweetText = action.content;
  if (action.hashtags?.length) {
    tweetText += "\n" + action.hashtags.map((h) => `#${h}`).join(" ");
  }
  if (action.url) {
    tweetText += "\n" + action.url;
  }
  // Truncate to 280 chars
  if (tweetText.length > 280) {
    tweetText = tweetText.slice(0, 277) + "...";
  }

  const tweetBox = page.locator('[data-testid="tweetTextarea_0"]').first();
  await tweetBox.click();
  await page.keyboard.type(tweetText, { delay: 30 });
  await page.waitForTimeout(1000);

  // Screenshot before posting
  await captureScreenshot(page, activityId, `Twitter投稿プレビュー`);

  // Post
  const postButton = page.locator('[data-testid="tweetButton"]').first();
  await postButton.click();
  await page.waitForTimeout(5000);

  // Capture result
  await captureScreenshot(page, activityId, `Twitter投稿完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "twitter",
    action: "post_article",
  };
}

async function postToLinkedIn(
  page: Page,
  params: SocialPostParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, action } = params;

  // Login
  await loginIfNeeded(
    page,
    channel,
    "https://www.linkedin.com/login",
    "#username",
    "#password",
    'button[type="submit"]',
  );

  // Navigate to feed
  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Click "Start a post" button
  const startPostBtn = page.locator('button:has-text("Start a post"), button:has-text("投稿を開始")').first();
  await startPostBtn.click();
  await page.waitForTimeout(2000);

  // Type content
  let postText = action.content;
  if (action.url) {
    postText += "\n\n" + action.url;
  }
  if (action.hashtags?.length) {
    postText += "\n" + action.hashtags.map((h) => `#${h}`).join(" ");
  }

  const editor = page.locator('[role="textbox"]').first();
  await editor.click();
  await page.keyboard.type(postText, { delay: 20 });
  await page.waitForTimeout(1000);

  // Screenshot
  await captureScreenshot(page, activityId, `LinkedIn投稿プレビュー`);

  // Post
  const postBtn = page.locator('button:has-text("Post"), button:has-text("投稿")').first();
  await postBtn.click();
  await page.waitForTimeout(5000);

  await captureScreenshot(page, activityId, `LinkedIn投稿完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "linkedin",
    action: "post_article",
  };
}

async function postToFacebook(
  page: Page,
  params: SocialPostParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, action } = params;

  await loginIfNeeded(
    page,
    channel,
    "https://www.facebook.com/login",
    "#email",
    "#pass",
    'button[name="login"]',
  );

  await page.goto("https://www.facebook.com/", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  // Click "What's on your mind?"
  const createPost = page.locator('[aria-label="Create a post"], [aria-label="投稿を作成"]').first();
  await createPost.click();
  await page.waitForTimeout(2000);

  let postText = action.content;
  if (action.url) {
    postText += "\n\n" + action.url;
  }

  const editor = page.locator('[role="textbox"]').first();
  await editor.click();
  await page.keyboard.type(postText, { delay: 20 });
  await page.waitForTimeout(1000);

  await captureScreenshot(page, activityId, `Facebook投稿プレビュー`);

  const postBtn = page.locator('div[aria-label="Post"], div[aria-label="投稿"]').first();
  await postBtn.click();
  await page.waitForTimeout(5000);

  await captureScreenshot(page, activityId, `Facebook投稿完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "facebook",
    action: "post_article",
  };
}

async function postToXing(
  page: Page,
  params: SocialPostParams,
  activityId: string,
): Promise<PostResult> {
  const { channel, action } = params;

  await loginIfNeeded(
    page,
    channel,
    "https://login.xing.com/",
    '#email, input[name="username"]',
    '#password, input[name="password"]',
    'button[type="submit"]',
  );

  await page.goto("https://www.xing.com/social/posts", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  let postText = action.content;
  if (action.url) {
    postText += "\n\n" + action.url;
  }

  const editor = page.locator('[role="textbox"], [contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.type(postText, { delay: 20 });
  await page.waitForTimeout(1000);

  await captureScreenshot(page, activityId, `XING投稿プレビュー`);

  const postBtn = page.locator('button:has-text("Post"), button:has-text("Teilen")').first();
  await postBtn.click();
  await page.waitForTimeout(5000);

  await captureScreenshot(page, activityId, `XING投稿完了`);

  return {
    success: true,
    postUrl: page.url(),
    channel: "xing",
    action: "post_article",
  };
}

// ---------------------------------------------------------------------------
// Router -- dispatch to correct platform handler
// ---------------------------------------------------------------------------

const PLATFORM_HANDLERS: Partial<
  Record<
    ChannelType,
    (page: Page, params: SocialPostParams, activityId: string) => Promise<PostResult>
  >
> = {
  twitter: postToTwitter,
  linkedin: postToLinkedIn,
  facebook: postToFacebook,
  xing: postToXing,
};

// ---------------------------------------------------------------------------
// Public API: Post to a social media platform
// ---------------------------------------------------------------------------

export async function postToSocial(
  params: SocialPostParams,
): Promise<PostResult> {
  // 認証情報チェック
  if (params.channel.requiresAuth && !params.channel.credentials?.username) {
    return {
      success: false,
      error: `${params.channel.name}: 認証情報が未設定です。設定画面でアカウント情報を追加してください。`,
      channel: params.channel.type,
      action: params.action.type,
    };
  }

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "social_posting",
    country: params.channel.regions[0] ?? "GLOBAL",
    language: params.channel.languages[0] ?? "en",
    method: "SocialDistribution",
    description: `ソーシャル投稿: ${params.channel.name} (${params.action.type})`,
  });

  const pool = getBrowserPool();

  try {
    const handler = PLATFORM_HANDLERS[params.channel.type];
    if (!handler) {
      throw new Error(`Unsupported social platform: ${params.channel.type}`);
    }

    const result = await pool.withPage(
      async (page) => handler(page, params, activity.id),
      { country: params.channel.regions[0] },
    );

    addArtifact(activity.id, {
      type: "json",
      title: `投稿結果: ${params.channel.name}`,
      content: JSON.stringify(result, null, 2),
    });

    completeActivity(activity.id, {
      metrics: { posted: result.success ? 1 : 0 },
      details: {
        postUrl: result.postUrl,
        channel: params.channel.type,
        actionType: params.action.type,
      },
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    failActivity(activity.id, errorMsg);
    return {
      success: false,
      error: errorMsg,
      channel: params.channel.type,
      action: params.action.type,
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Search for keyword and engage (retweet, like)
// ---------------------------------------------------------------------------

export async function searchAndEngage(params: {
  projectId: string;
  taskId: string;
  keyword: string;
  channel: ChannelConfig;
  maxEngagements: number;
}): Promise<PostResult[]> {
  if (params.channel.requiresAuth && !params.channel.credentials?.username) {
    return [{
      success: false,
      error: `${params.channel.name}: 認証情報が未設定です`,
      channel: params.channel.type,
      action: "search_engage",
    }];
  }

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "social_posting",
    country: params.channel.regions[0] ?? "GLOBAL",
    language: params.channel.languages[0] ?? "en",
    method: "SocialDistribution",
    description: `検索エンゲージメント: "${params.keyword}" on ${params.channel.name}`,
  });

  const pool = getBrowserPool();
  const results: PostResult[] = [];

  try {
    await pool.withPage(
      async (page) => {
        if (params.channel.type === "twitter") {
          // Login
          await loginIfNeeded(
            page,
            params.channel,
            "https://twitter.com/login",
            'input[autocomplete="username"]',
            'input[name="password"]',
            '[data-testid="LoginForm_Login_Button"]',
          );

          // Search
          const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(params.keyword)}&src=typed_query&f=live`;
          await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.waitForTimeout(3000);

          await captureScreenshot(page, activity.id, `Twitter検索: "${params.keyword}"`);

          // Like/Retweet top posts
          const likeButtons = page.locator('[data-testid="like"]');
          const count = Math.min(
            params.maxEngagements,
            await likeButtons.count(),
          );

          for (let i = 0; i < count; i++) {
            try {
              await likeButtons.nth(i).click();
              await page.waitForTimeout(2000 + Math.random() * 3000);
              results.push({
                success: true,
                channel: "twitter",
                action: "search_engage",
              });
            } catch {
              results.push({
                success: false,
                error: "Failed to engage with post",
                channel: "twitter",
                action: "search_engage",
              });
            }
          }

          await captureScreenshot(page, activity.id, `Twitter エンゲージメント完了`);
        }
      },
      { country: params.channel.regions[0] },
    );

    completeActivity(activity.id, {
      metrics: {
        engaged: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
      details: { keyword: params.keyword },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    failActivity(activity.id, errorMsg);
    results.push({
      success: false,
      error: errorMsg,
      channel: params.channel.type,
      action: "search_engage",
    });
  }

  return results;
}
