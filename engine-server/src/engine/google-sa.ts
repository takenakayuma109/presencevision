/**
 * Google サービスアカウント認証 — JWT(RS256) → アクセストークン交換
 *
 * PVが1つだけ持つサービスアカウント鍵（環境変数 GOOGLE_SA_KEY: JSON または base64）で、
 * 顧客が権限を付与した Google Analytics / Search Console のデータを読むためのトークンを得る。
 * 顧客・PV運用者ともにOAuthフローは不要（顧客はSAのメールに閲覧権限を付けるだけ）。
 *
 * 依存を増やさないため googleapis ライブラリは使わず、Node標準の crypto で JWT を署名する。
 */

import { createSign } from "crypto";

interface SAKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

let cachedKey: SAKey | null = null;

function loadKey(): SAKey {
  if (cachedKey) return cachedKey;
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw || !raw.trim()) {
    throw new Error("GOOGLE_SA_KEY 未設定（サービスアカウント鍵が必要）");
  }
  let json = raw.trim();
  if (!json.startsWith("{")) {
    // base64 で渡された場合をデコード
    json = Buffer.from(raw, "base64").toString("utf8");
  }
  const parsed = JSON.parse(json) as {
    client_email?: string;
    private_key?: string;
    token_uri?: string;
  };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SA_KEY の内容が不正（client_email / private_key が無い）");
  }
  cachedKey = {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || "https://oauth2.googleapis.com/token",
  };
  return cachedKey;
}

const tokenCache: Record<string, { token: string; exp: number }> = {};

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** サービスアカウントの鍵が設定されているか（未設定ならタスクをスキップする判定に使う） */
export function hasServiceAccount(): boolean {
  return !!(process.env.GOOGLE_SA_KEY && process.env.GOOGLE_SA_KEY.trim());
}

/** 指定スコープのアクセストークンを取得（1時間キャッシュ） */
export async function getSaAccessToken(scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache[scope];
  if (cached && cached.exp - 60 > now) return cached.token;

  const key = loadKey();
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope,
      aud: key.token_uri,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = base64url(signer.sign(key.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`SAトークン交換失敗: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache[scope] = {
    token: data.access_token,
    exp: now + (data.expires_in ?? 3600),
  };
  return data.access_token;
}
