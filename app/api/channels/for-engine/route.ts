import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshGbpToken } from "@/lib/oauth/google-business";

const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";

/**
 * GET /api/channels/for-engine?projectId=xxx
 *
 * Engine-facing endpoint: returns channels WITH credentials for a project.
 * Auth via x-api-key header (no user session required).
 */
export async function GET(request: NextRequest) {
  try {
    // --- Auth: API key check ---
    const apiKey = request.headers.get("x-api-key");
    if (!ENGINE_API_KEY || !apiKey || apiKey !== ENGINE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Params ---
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 },
      );
    }

    // Find the project to get its workspaceId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Fetch channels for this workspace (optionally scoped to the project)
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId: project.workspaceId,
        OR: [
          { projectId: projectId },
          { projectId: null }, // workspace-level channels apply to all projects
        ],
      },
      include: {
        credentials: {
          select: { key: true, value: true },
        },
      },
    });

    // Map to engine-friendly format
    const result = await Promise.all(
      channels.map(async (ch) => {
        const credentials: Record<string, string> = {};
        for (const cred of ch.credentials) {
          credentials[cred.key] = cred.value;
        }

        // Google Business: access_token は短命なので、refresh_token で必要に応じ自動更新
        if (ch.type === "google_business" && credentials.refreshToken) {
          const exp = credentials.expiresAt ? Date.parse(credentials.expiresAt) : 0;
          const needsRefresh = !exp || exp - Date.now() < 5 * 60 * 1000;
          if (needsRefresh) {
            try {
              const refreshed = await refreshGbpToken(credentials.refreshToken);
              const newExpiresAt = new Date(
                Date.now() + refreshed.expires_in * 1000,
              ).toISOString();
              credentials.accessToken = refreshed.access_token;
              credentials.expiresAt = newExpiresAt;
              await prisma.channelCredential.updateMany({
                where: { channelId: ch.id, key: "accessToken" },
                data: { value: refreshed.access_token },
              });
              await prisma.channelCredential.updateMany({
                where: { channelId: ch.id, key: "expiresAt" },
                data: { value: newExpiresAt },
              });
            } catch (e) {
              console.warn("[for-engine] GBP token refresh failed:", e);
            }
          }
        }

        return {
          type: ch.type,
          name: ch.name,
          credentials,
          enabled: true,
          config: ch.config,
        };
      }),
    );

    return NextResponse.json({ channels: result });
  } catch (err) {
    console.error("GET /api/channels/for-engine:", err);
    return NextResponse.json(
      { error: "Failed to fetch channels for engine" },
      { status: 500 },
    );
  }
}
