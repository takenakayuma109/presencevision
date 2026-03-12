import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { BriefStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const briefs = await prisma.contentBrief.findMany({
      where: { projectId },
      include: {
        topic: { select: { id: true, title: true } },
        entity: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(briefs);
  } catch (error) {
    console.error("GET /api/briefs:", error);
    return NextResponse.json(
      { error: "Failed to list briefs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      topicId,
      entityId,
      title,
      targetAudience,
      searchIntent,
      outline,
      angle,
      evidenceReqs,
      style,
      status,
    } = body;
    if (!projectId || !topicId || !title) {
      return NextResponse.json(
        { error: "projectId, topicId, and title are required" },
        { status: 400 }
      );
    }
    const brief = await prisma.contentBrief.create({
      data: {
        projectId,
        topicId,
        entityId,
        title,
        targetAudience,
        searchIntent,
        outline: outline as object | undefined,
        angle,
        evidenceReqs,
        style,
        status: (status as BriefStatus) ?? "DRAFT",
      },
    });
    return NextResponse.json(brief, { status: 201 });
  } catch (error) {
    console.error("POST /api/briefs:", error);
    return NextResponse.json(
      { error: "Failed to create brief" },
      { status: 500 }
    );
  }
}
