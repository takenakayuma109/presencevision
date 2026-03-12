import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const mentions = await prisma.mention.findMany({
      where: { projectId },
      include: { entity: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(mentions);
  } catch (error) {
    console.error("GET /api/monitoring:", error);
    return NextResponse.json(
      { error: "Failed to list mentions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, workspaceId } = body;
    if (!projectId || !workspaceId) {
      return NextResponse.json(
        { error: "projectId and workspaceId are required" },
        { status: 400 }
      );
    }
    await enqueueJob({
      type: "monitoring",
      projectId,
      workspaceId,
    });
    return NextResponse.json(
      { message: "Monitoring workflow job enqueued" },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/monitoring:", error);
    return NextResponse.json(
      { error: "Failed to trigger monitoring workflow" },
      { status: 500 }
    );
  }
}
