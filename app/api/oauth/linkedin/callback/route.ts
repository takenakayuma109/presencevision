import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCode, getLinkedInProfile } from "@/lib/oauth/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("LinkedIn OAuth error:", error);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/settings?error=linkedin_oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Validate state against cookie
    const storedState = request.cookies.get("linkedin_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: "Invalid state parameter (CSRF check failed)" },
        { status: 403 }
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeLinkedInCode(code);

    // Fetch profile to get the user's URN (sub)
    const profile = await getLinkedInProfile(tokens.access_token);

    // TODO: Store tokens and profile in channel connection when DB schema is ready
    console.log("LinkedIn OAuth tokens obtained:", {
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      has_refresh_token: !!tokens.refresh_token,
      profile_sub: profile.sub,
      profile_name: profile.name,
    });

    // Clear OAuth cookie
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const response = NextResponse.redirect(
      `${baseUrl}/settings?success=linkedin_connected`
    );
    response.cookies.delete("linkedin_oauth_state");

    return response;
  } catch (error) {
    console.error("GET /api/oauth/linkedin/callback:", error);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/settings?error=linkedin_oauth_failed`
    );
  }
}
