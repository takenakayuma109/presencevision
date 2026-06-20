import { NextResponse } from "next/server";
import { generateState } from "@/lib/oauth/utils";
import { getGbpAuthUrl } from "@/lib/oauth/google-business";

/**
 * GET /api/oauth/google-business
 * Google Business Profile の OAuth 認可を開始する。
 */
export async function GET() {
  try {
    const state = generateState();
    const authUrl = getGbpAuthUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("gbp_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("GET /api/oauth/google-business:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google Business OAuth" },
      { status: 500 },
    );
  }
}
