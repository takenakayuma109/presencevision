/**
 * Q&A Engager — Q&Aサイトへの自動投稿は無効化済み（安全・コンプライアンス方針）
 *
 * 以前は Playwright で Reddit / Quora / Yahoo!知恵袋 / 知乎(Zhihu) にログインして
 * ブランド言及つきの回答を自動投稿していたが、これは各サイトの利用規約・コミュニティ
 * 規約に反する「議論操作（manipulation）」に該当し、アカウント凍結や法的リスクを
 * 生むため全面的に廃止した。本モジュールは後方互換のため型と関数シグネチャのみ維持し、
 * 呼び出されても安全に「無効」を返す。
 */

import type { ChannelConfig } from "./channel-registry.js";
import type { PostResult } from "./social-poster.js";

// ---------------------------------------------------------------------------
// Types (kept for backward compatibility)
// ---------------------------------------------------------------------------

export interface QAEngageParams {
  projectId: string;
  taskId: string;
  channel: ChannelConfig;
  keyword: string;
  brandName: string;
  answerContent: string;
}

// ---------------------------------------------------------------------------
// Public API (no-op, safe by design)
// ---------------------------------------------------------------------------

export async function engageOnQA(params: QAEngageParams): Promise<PostResult> {
  console.warn(
    `[QAEngager] Skipped (disabled by safety policy): ${params.channel.name} / "${params.keyword}"`,
  );
  return {
    success: false,
    error:
      "Q&Aサイトへの自動投稿は、安全・コンプライアンス方針により無効化されています（規約違反・議論操作のリスクがあるため）。",
    channel: params.channel.type,
    action: "answer_question",
  };
}
