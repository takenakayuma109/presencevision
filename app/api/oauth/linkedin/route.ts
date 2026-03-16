import { NextResponse } from "next/server";
import { generateState } from "@/lib/oauth/utils";
import { getLinkedInAuthUrl } from "@/lib/oauth/linkedin";

export async function GET() {
  try {
    const state = generateState();
    const authUrl = getLinkedInAuthUrl(state);

    const response = NextResponse.redirect(authUrl);

    // Store state in cookie for callback validation
    response.cookies.set("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GET /api/oauth/linkedin:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn OAuth" },
      { status: 500 }
    );
  }
}
