import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/server/repositories";
import { getSession, getUserId } from "@/lib/stripe/get-session";
import { prisma } from "@/lib/db";

/**
 * Resolve the workspace for the authenticated user.
 * If workspaceId is provided, verify membership.
 * Otherwise, return the first workspace the user belongs to.
 */
async function resolveWorkspace(userId: string, workspaceId?: string | null) {
  if (workspaceId) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId },
    });
    return membership ? workspaceId : null;
  }

  // Find first workspace user belongs to
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspaceId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceIdParam = request.nextUrl.searchParams.get("workspaceId");
    const workspaceId = await resolveWorkspace(
      session.user.id,
      workspaceIdParam,
    );

    if (!workspaceId) {
      // No workspace yet — return empty list instead of error
      return NextResponse.json([]);
    }

    const projects = await projectRepository.findAll(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, description, locale } = body;
    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: "workspaceId and name are required" },
        { status: 400 },
      );
    }

    // Verify user has access to this workspace
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, workspaceId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await projectRepository.create({
      workspaceId,
      name,
      description,
      locale,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
