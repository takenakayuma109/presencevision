import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/channels/[id]/test — Test a channel connection
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch channel with credentials
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        credentials: true,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the workspace
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: channel.workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build a credential map
    const creds: Record<string, string> = {};
    for (const c of channel.credentials) {
      creds[c.key] = c.value;
    }

    const accessToken = creds.accessToken;
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: "No access token found. Please reconnect the channel.",
      });
    }

    // Check if token is expired
    if (creds.expiresAt && new Date(creds.expiresAt) < new Date()) {
      return NextResponse.json({
        success: false,
        message: "Access token has expired. Please reconnect the channel.",
      });
    }

    // Test connectivity based on channel type
    let testResult: { success: boolean; message: string };

    switch (channel.type) {
      case "twitter":
        testResult = await testTwitter(accessToken);
        break;
      case "linkedin":
        testResult = await testLinkedIn(accessToken);
        break;
      case "wordpress":
        testResult = await testWordPress(creds);
        break;
      default:
        testResult = {
          success: false,
          message: `Unsupported channel type: ${channel.type}`,
        };
    }

    return NextResponse.json(testResult);
  } catch (err) {
    console.error("POST /api/channels/[id]/test:", err);
    return NextResponse.json(
      { error: "Failed to test channel" },
      { status: 500 }
    );
  }
}

async function testTwitter(
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Connected as @${data.data?.username ?? "unknown"}`,
      };
    }
    return {
      success: false,
      message: `Twitter API returned ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

async function testLinkedIn(
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Connected as ${data.name ?? "unknown"}`,
      };
    }
    return {
      success: false,
      message: `LinkedIn API returned ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

async function testWordPress(
  creds: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const siteUrl = creds.siteUrl;
  const apiKey = creds.apiKey ?? creds.accessToken;

  if (!siteUrl) {
    return { success: false, message: "No site URL configured" };
  }

  try {
    const url = `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts?per_page=1`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { headers });
    if (res.ok) {
      return { success: true, message: `WordPress site reachable at ${siteUrl}` };
    }
    return {
      success: false,
      message: `WordPress API returned ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}
