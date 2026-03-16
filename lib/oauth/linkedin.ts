const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

const SCOPES = ["openid", "profile", "w_member_social"];

function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/linkedin/callback`;
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set"
    );
  }
  return { clientId, clientSecret };
}

/**
 * Generate LinkedIn OAuth 2.0 authorization URL
 */
export function getLinkedInAuthUrl(state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPES.join(" "),
    state,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeLinkedInCode(
  code: string
): Promise<LinkedInTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${error}`);
  }

  return res.json();
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
}

/**
 * Get the authenticated user's profile (for sub/URN)
 */
export async function getLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  const res = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LinkedIn get profile failed: ${res.status} ${error}`);
  }

  return res.json();
}

export interface LinkedInPostResponse {
  id: string;
}

/**
 * Create a share/post on LinkedIn
 */
export async function postToLinkedIn(
  accessToken: string,
  urn: string,
  text: string,
  articleUrl?: string,
  imageUrl?: string
): Promise<LinkedInPostResponse> {
  const author = `urn:li:person:${urn}`;

  const body: Record<string, unknown> = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: articleUrl || imageUrl ? "ARTICLE" : "NONE",
        ...(articleUrl || imageUrl
          ? {
              media: [
                {
                  status: "READY",
                  ...(articleUrl ? { originalUrl: articleUrl } : {}),
                  ...(imageUrl
                    ? {
                        thumbnails: [{ url: imageUrl }],
                      }
                    : {}),
                },
              ],
            }
          : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LinkedIn post failed: ${res.status} ${error}`);
  }

  return res.json();
}
