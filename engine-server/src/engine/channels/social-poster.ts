/**
 * Social Poster — 第三者ソーシャルへの自動投稿は無効化済み（安全・コンプライアンス方針）
 *
 * 以前は Playwright でユーザーの認証情報を使い Twitter/X・LinkedIn・Facebook 等へ
 * 自動ログイン・投稿していたが、これは各プラットフォームの利用規約に違反し、
 * 顧客アカウントの凍結・法的/評判リスクを直接生むため全面的に廃止した。
 * （加えて旧実装は投稿成否を検証せず無条件に success:true を返しており、
 *  ダッシュボードに「幻の投稿成功」を計上していた。）
 *
 * 将来ソーシャル配信を再導入する場合は、各社の「公式API + ユーザー本人のOAuth同意 +
 * 人間の承認付きスケジュール投稿」のみを用いる。本モジュールは後方互換のため
 * 型と関数シグネチャのみ維持し、呼び出されても安全に「無効」を返す。
 */

import type { ChannelConfig, ChannelType } from "./channel-registry.js";

// ---------------------------------------------------------------------------
// Types (kept for backward compatibility)
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

const DISABLED_REASON =
  "第三者ソーシャルプラットフォームへの自動投稿は、安全・コンプライアンス方針により無効化されています（公式API連携・本人同意・人間承認が必要）。";

// ---------------------------------------------------------------------------
// Public API (no-op, safe by design)
// ---------------------------------------------------------------------------

export async function postToSocial(
  params: SocialPostParams,
): Promise<PostResult> {
  console.warn(
    `[SocialPoster] Skipped (disabled by safety policy): ${params.channel.name} / ${params.action.type}`,
  );
  return {
    success: false,
    error: DISABLED_REASON,
    channel: params.channel.type,
    action: params.action.type,
  };
}

export async function searchAndEngage(params: {
  projectId: string;
  taskId: string;
  keyword: string;
  channel: ChannelConfig;
  maxEngagements: number;
}): Promise<PostResult[]> {
  console.warn(
    `[SocialPoster] Skipped engagement (disabled by safety policy): ${params.channel.name}`,
  );
  return [
    {
      success: false,
      error: DISABLED_REASON,
      channel: params.channel.type,
      action: "search_engage",
    },
  ];
}
