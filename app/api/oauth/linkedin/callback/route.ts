import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  exchangeLinkedInCode,
  getLinkedInProfile,
} from "@/lib/oauth/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    if (error) {
      console.error("LinkedIn OAuth error:", error);
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

    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    // Exchange code for tokens
    const tokens = await exchangeLinkedInCode(code);

    // Fetch profile to get the user's URN (sub)
    const profile = await getLinkedInProfile(tokens.access_token);

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
        type: "linkedin",
      },
    });

    if (channel) {
      // Delete old credentials and replace
      await prisma.channelCredential.deleteMany({
        where: { channelId: channel.id },
      });
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          updatedAt: new Date(),
          config: {
            scope: tokens.scope,
            profileName: profile.name,
            profileSub: profile.sub,
          },
        },
      });
    } else {
      channel = await prisma.channel.create({
        data: {
          workspaceId: membership.workspaceId,
          name: `LinkedIn - ${profile.name}`,
          type: "linkedin",
          config: {
            scope: tokens.scope,
            profileName: profile.name,
            profileSub: profile.sub,
          },
        },
      });
    }

    // Store credentials as key-value pairs
    const credentials = [
      { channelId: channel.id, key: "accessToken", value: tokens.access_token },
      { channelId: channel.id, key: "expiresAt", value: expiresAt },
      { channelId: channel.id, key: "scope", value: tokens.scope },
      { channelId: channel.id, key: "urn", value: profile.sub },
    ];

    if (tokens.refresh_token) {
      credentials.push({
        channelId: channel.id,
        key: "refreshToken",
        value: tokens.refresh_token,
      });
    }

    await prisma.channelCredential.createMany({ data: credentials });

    // Clear OAuth cookie
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
