import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/server/repositories";
import { getSession } from "@/lib/stripe/get-session";
import { prisma } from "@/lib/db";

async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId);
  if (!project) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId: project.workspaceId },
  });

  if (!membership) return null;
  return project;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await verifyProjectAccess(id, session.user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await verifyProjectAccess(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, status, url, keywords, competitors } = body;

    // Build metadata update if keywords provided
    let metadata: Record<string, unknown> | undefined;
    if (keywords !== undefined) {
      const existingMeta = (existing.metadata as Record<string, unknown>) ?? {};
      metadata = { ...existingMeta, keywords };
    }

    const updated = await projectRepository.update(id, {
      name,
      description,
      status,
      url,
      metadata: metadata as import("@prisma/client").Prisma.InputJsonValue,
    });

    // Handle competitors update if provided
    if (competitors !== undefined) {
      // Delete existing competitors and recreate
      await prisma.competitor.deleteMany({ where: { projectId: id } });
      if (competitors.length > 0) {
        await prisma.competitor.createMany({
          data: competitors.map((c: string) => ({ projectId: id, name: c })),
        });
      }
    }

    // Re-fetch with relations to return full data
    const result = await projectRepository.findById(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await verifyProjectAccess(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await projectRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
