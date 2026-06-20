/**
 * Google Business Profile Publisher — ローカル投稿(Local Posts)の自動公開
 *
 * Google Business Profile API (mybusiness v4) の Local Posts を使い、
 * 生成記事の要約を「最新情報」投稿として公開する（ローカルSEO/MEO）。
 *
 * 接続式チャネル: 顧客が GBP を OAuth 連携し、accessToken / accountId / locationId を
 * チャネル認証情報として保存している場合のみ動作する（WordPress と同じ思想）。
 * Google Business Profile API は Google のアクセス審査(承認制)が前提。
 */

import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";
import type { PostResult } from "./social-poster.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GbpCredentials {
  accessToken?: string;
  /** accounts/{accountId} の数値/ID部分 */
  accountId?: string;
  /** locations/{locationId} の ID 部分 */
  locationId?: string;
}

export interface GbpPublishParams {
  projectId: string;
  taskId: string;
  /** 投稿本文（要約）。最大1500文字に丸める */
  summary: string;
  /** CTA リンク（LEARN_MORE）。通常は自社サイトURL */
  actionUrl?: string;
  credentials: GbpCredentials;
  country: string;
  language: string;
}

interface GbpLocalPostResponse {
  name?: string;
  searchUrl?: string;
  state?: string;
}

// ---------------------------------------------------------------------------
// Public API: Publish a Local Post to Google Business Profile
// ---------------------------------------------------------------------------

export async function publishToGoogleBusiness(
  params: GbpPublishParams,
): Promise<PostResult> {
  const { accessToken, accountId, locationId } = params.credentials;

  // 接続情報チェック（未接続なら静かにスキップ＝幻の成功を作らない）
  if (!accessToken || !accountId || !locationId) {
    return {
      success: false,
      error:
        "Googleビジネスプロフィール未接続です（accessToken / accountId / locationId が必要）。設定画面で連携してください。",
      channel: "google_business",
      action: "post_article",
    };
  }

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_distribution",
    country: params.country,
    language: params.language,
    method: "GoogleBusiness",
    description: `GBPローカル投稿 (${params.country})`,
  });

  try {
    const summary = params.summary.trim().slice(0, 1500);
    const body: Record<string, unknown> = {
      languageCode: params.language,
      summary,
      topicType: "STANDARD",
      ...(params.actionUrl
        ? { callToAction: { actionType: "LEARN_MORE", url: params.actionUrl } }
        : {}),
    };

    const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(
      accountId,
    )}/locations/${encodeURIComponent(locationId)}/localPosts`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Business API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as GbpLocalPostResponse;

    addArtifact(activity.id, {
      type: "json",
      title: "GBPローカル投稿レスポンス",
      content: JSON.stringify(
        { name: data.name, searchUrl: data.searchUrl, state: data.state },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: { posted: 1 },
      details: { postUrl: data.searchUrl ?? data.name, state: data.state },
    });

    return {
      success: true,
      postUrl: data.searchUrl ?? data.name,
      channel: "google_business",
      action: "post_article",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    failActivity(activity.id, errorMsg);
    return {
      success: false,
      error: errorMsg,
      channel: "google_business",
      action: "post_article",
    };
  }
}
