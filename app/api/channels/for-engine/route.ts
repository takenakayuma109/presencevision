import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    const result = channels.map((ch) => {
      const credentials: Record<string, string> = {};
      for (const cred of ch.credentials) {
        credentials[cred.key] = cred.value;
      }

      return {
        type: ch.type,
        name: ch.name,
        credentials,
        enabled: true,
        config: ch.config,
      };
    });

    return NextResponse.json({ channels: result });
  } catch (err) {
    console.error("GET /api/channels/for-engine:", err);
    return NextResponse.json(
      { error: "Failed to fetch channels for engine" },
      { status: 500 },
    );
  }
}
