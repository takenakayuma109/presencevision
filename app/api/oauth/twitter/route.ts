import { NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/oauth/utils";
import { getTwitterAuthUrl } from "@/lib/oauth/twitter";

export async function GET() {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authUrl = getTwitterAuthUrl(state, codeChallenge);

    const response = NextResponse.redirect(authUrl);

    // Store state and PKCE verifier in cookies for callback validation
    response.cookies.set("twitter_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("twitter_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GET /api/oauth/twitter:", error);
    return NextResponse.json(
      { error: "Failed to initiate Twitter OAuth" },
      { status: 500 }
    );
  }
}
