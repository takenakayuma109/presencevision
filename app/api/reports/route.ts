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
    const reports = await prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("GET /api/reports:", error);
    return NextResponse.json(
      { error: "Failed to list reports" },
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
      type: "weekly-report",
      projectId,
      workspaceId,
    });
    return NextResponse.json(
      { message: "Report generation job enqueued" },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/reports:", error);
    return NextResponse.json(
      { error: "Failed to trigger report generation" },
      { status: 500 }
    );
  }
}
