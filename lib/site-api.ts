/**
 * Site API — 汎用サイト連携（WordPress / Wix / 自作コード問わず）。
 *
 * プロジェクト単位で安定した公開APIキーを HMAC で発行・検証する。
 * 記事自体は元々公開(/blog)なので、キーは「サイト連携の識別・将来の失効/書込認証」用。
 * DB不要（projectId から決定的に導出）。SECRET が変わらない限りキーは安定。
 */
import crypto from "crypto";

const SECRET =
  process.env.SITE_API_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "pv-site-api-dev-secret-change-me";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://presencevision.com";

/** プロジェクトの公開連携キー（32文字・base64url） */
export function siteKey(projectId: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`site:${projectId}`)
    .digest("base64url")
    .slice(0, 32);
}

/** 連携キーの検証（タイミング安全比較） */
export function verifySiteKey(projectId: string, key: string | null | undefined): boolean {
  if (!projectId || !key) return false;
  const expected = siteKey(projectId);
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** ダッシュボード表示用に、連携情報一式（URL・埋め込みコード）を組み立てる */
export function siteIntegration(projectId: string) {
  const key = siteKey(projectId);
  const base = SITE_URL.replace(/\/+$/, "");
  const q = `projectId=${encodeURIComponent(projectId)}&key=${encodeURIComponent(key)}`;
  const articlesUrl = `${base}/api/public/articles?${q}`;
  const feedUrl = `${base}/api/public/feed?${q}`;
  const jsonFeedUrl = `${base}/api/public/feed?${q}&format=json`;
  const embedSnippet = `<div id="pv-articles"></div>
<script src="${base}/pv-embed.js" data-project="${projectId}" data-key="${key}" data-limit="6" async></script>`;
  return { projectId, key, articlesUrl, feedUrl, jsonFeedUrl, embedSnippet, siteUrl: base };
}
