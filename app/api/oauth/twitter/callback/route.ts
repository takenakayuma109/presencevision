import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeTwitterCode } from "@/lib/oauth/twitter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    if (error) {
      console.error("Twitter OAuth error:", error);
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

    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    // Exchange code for tokens
    const tokens = await exchangeTwitterCode(code, codeVerifier);

    // Find user's workspace (use the first one they own/admin)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { workspaceId: true },
    });

    if (!membership) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=no_workspace`
      );
    }

    // Create or update the Channel and ChannelCredential records
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    let channel = await prisma.channel.findFirst({
      where: {
        workspaceId: membership.workspaceId,
        type: "twitter",
      },
    });

    if (channel) {
      // Delete old credentials and replace
      await prisma.channelCredential.deleteMany({
        where: { channelId: channel.id },
      });
      await prisma.channel.update({
        where: { id: channel.id },
        data: { updatedAt: new Date() },
      });
    } else {
      channel = await prisma.channel.create({
        data: {
          workspaceId: membership.workspaceId,
          name: "Twitter / X",
          type: "twitter",
          config: { scope: tokens.scope },
        },
      });
    }

    // Store credentials as key-value pairs
    const credentials = [
      { channelId: channel.id, key: "accessToken", value: tokens.access_token },
      { channelId: channel.id, key: "expiresAt", value: expiresAt },
      { channelId: channel.id, key: "scope", value: tokens.scope },
    ];

    if (tokens.refresh_token) {
      credentials.push({
        channelId: channel.id,
        key: "refreshToken",
        value: tokens.refresh_token,
      });
    }

    await prisma.channelCredential.createMany({ data: credentials });

    // Clear OAuth cookies
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
