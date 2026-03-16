import { NextRequest, NextResponse } from "next/server";
import { exchangeTwitterCode } from "@/lib/oauth/twitter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Twitter OAuth error:", error);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitter_oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Validate state against cookie
    const storedState = request.cookies.get("twitter_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: "Invalid state parameter (CSRF check failed)" },
        { status: 403 }
      );
    }

    // Retrieve PKCE code verifier from cookie
    const codeVerifier = request.cookies.get("twitter_code_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.json(
        { error: "Missing code verifier" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeTwitterCode(code, codeVerifier);

    // TODO: Store tokens in channel connection when DB schema is ready
    console.log("Twitter OAuth tokens obtained:", {
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      has_refresh_token: !!tokens.refresh_token,
    });

    // Clear OAuth cookies
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const response = NextResponse.redirect(
      `${baseUrl}/settings?success=twitter_connected`
    );
    response.cookies.delete("twitter_oauth_state");
    response.cookies.delete("twitter_code_verifier");

    return response;
  } catch (error) {
    console.error("GET /api/oauth/twitter/callback:", error);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/settings?error=twitter_oauth_failed`
    );
  }
}
