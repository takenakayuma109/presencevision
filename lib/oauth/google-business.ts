/**
 * Google Business Profile — OAuth 2.0 連携ヘルパー
 *
 * scope: business.manage（GBPの管理）。access_type=offline で refresh_token を取得し、
 * 失効しても /api/channels/for-engine 側で自動更新する。
 *
 * 前提（顧客/運用側のGoogle設定）:
 *  - GCPプロジェクトで Business Profile API 群を有効化
 *  - Google Business Profile API のアクセス審査（承認制）を通過
 *  - OAuth同意画面に business.manage スコープを追加
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/business.manage";

function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/google-business/callback`;
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  // GBP専用クライアントを優先。無ければログイン用Googleクライアントにフォールバック。
  const clientId = process.env.GBP_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GBP_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GBP_CLIENT_ID/GBP_CLIENT_SECRET（または GOOGLE_CLIENT_ID/SECRET）が未設定です",
    );
  }
  return { clientId, clientSecret };
}

/** 認可URL（access_type=offline + prompt=consent で refresh_token を確実に取得） */
export function getGbpAuthUrl(state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GbpTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/** 認可コード → トークン交換 */
export async function exchangeGbpCode(code: string): Promise<GbpTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`GBP token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** refresh_token で access_token を更新 */
export async function refreshGbpToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = getClientCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`GBP token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface GbpAccount {
  name: string; // "accounts/{accountId}"
  accountName?: string;
}

/** Account Management API: 連携アカウント一覧 */
export async function listGbpAccounts(accessToken: string): Promise<GbpAccount[]> {
  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`GBP list accounts failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { accounts?: GbpAccount[] };
  return data.accounts ?? [];
}

export interface GbpLocation {
  name: string; // "locations/{locationId}"
  title?: string;
}

/** Business Information API: アカウント配下のロケーション一覧 */
export async function listGbpLocations(
  accessToken: string,
  accountName: string,
): Promise<GbpLocation[]> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title&pageSize=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`GBP list locations failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { locations?: GbpLocation[] };
  return data.locations ?? [];
}

/** "accounts/123" / "locations/456" から末尾のID部分を取り出す */
export function idFromResourceName(resourceName: string): string {
  const parts = resourceName.split("/");
  return parts[parts.length - 1] ?? resourceName;
}
