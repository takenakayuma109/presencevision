const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_API_BASE = "https://api.twitter.com/2";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/twitter/callback`;
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

/**
 * Generate Twitter OAuth 2.0 authorization URL with PKCE
 */
export function getTwitterAuthUrl(
  state: string,
  codeChallenge: string
): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${TWITTER_AUTH_URL}?${params.toString()}`;
}

export interface TwitterTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

/**
 * Exchange authorization code for access/refresh tokens
 */
export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Twitter token exchange failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshTwitterToken(
  refreshToken: string
): Promise<TwitterTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Twitter token refresh failed: ${res.status} ${error}`);
  }

  return res.json();
}

export interface TweetResponse {
  data: {
    id: string;
    text: string;
  };
}

/**
 * Post a single tweet
 */
export async function postTweet(
  accessToken: string,
  text: string,
  mediaIds?: string[]
): Promise<TweetResponse> {
  const body: Record<string, unknown> = { text };

  if (mediaIds && mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Twitter post tweet failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Post a thread (multiple tweets in a reply chain)
 */
export async function postThread(
  accessToken: string,
  tweets: string[]
): Promise<TweetResponse[]> {
  if (tweets.length === 0) {
    throw new Error("Thread must contain at least one tweet");
  }

  const results: TweetResponse[] = [];
  let replyToId: string | undefined;

  for (const text of tweets) {
    const body: Record<string, unknown> = { text };
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId };
    }

    const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(
        `Twitter post thread failed at tweet ${results.length + 1}: ${res.status} ${error}`
      );
    }

    const result: TweetResponse = await res.json();
    results.push(result);
    replyToId = result.data.id;
  }

  return results;
}
