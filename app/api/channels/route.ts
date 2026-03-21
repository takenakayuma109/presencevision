import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/channels — List channels for the user's workspace with connection status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all workspaces the user belongs to
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    const workspaceIds = memberships.map((m) => m.workspaceId);

    const channels = await prisma.channel.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: {
        credentials: {
          select: { key: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to a safe response (don't expose credential values)
    const result = channels.map((ch) => {
      const hasAccessToken = ch.credentials.some(
        (c) => c.key === "accessToken"
      );
      const expiresAtCred = ch.credentials.find(
        (c) => c.key === "expiresAt"
      );
      const isExpired = expiresAtCred
        ? new Date(expiresAtCred.createdAt) < new Date()
        : false;

      return {
        id: ch.id,
        workspaceId: ch.workspaceId,
        projectId: ch.projectId,
        name: ch.name,
        type: ch.type,
        config: ch.config,
        connected: hasAccessToken,
        expired: isExpired,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/channels:", err);
    return NextResponse.json(
      { error: "Failed to list channels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels — Save a channel with API-key-based credentials (e.g. WordPress)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, type, credentials, projectId } = body;

    if (!workspaceId || !name || !type || !credentials) {
      return NextResponse.json(
        { error: "workspaceId, name, type, and credentials are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this workspace
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create channel with credentials
    const channel = await prisma.channel.create({
      data: {
        workspaceId,
        projectId: projectId ?? null,
        name,
        type,
        config: body.config ?? null,
      },
    });

    // Store credentials (expects Record<string, string>)
    const credData = Object.entries(credentials as Record<string, string>).map(
      ([key, value]) => ({
        channelId: channel.id,
        key,
        value,
      })
    );

    if (credData.length > 0) {
      await prisma.channelCredential.createMany({ data: credData });
    }

    return NextResponse.json(
      { id: channel.id, name: channel.name, type: channel.type },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/channels:", err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels — Disconnect a channel by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const channelId = searchParams.get("id");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel id is required" },
        { status: 400 }
      );
    }

    // Fetch channel to verify workspace ownership
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: channel.workspaceId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete credentials and channel (cascade handles credentials)
    await prisma.channel.delete({ where: { id: channelId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/channels:", err);
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    );
  }
}
