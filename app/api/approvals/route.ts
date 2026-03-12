import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const approvals = await prisma.approvalRequest.findMany({
      where: {
        asset: { projectId },
        status: "PENDING",
      },
      include: {
        asset: { select: { id: true, title: true, status: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(approvals);
  } catch (error) {
    console.error("GET /api/approvals:", error);
    return NextResponse.json(
      { error: "Failed to list approvals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, requesterId } = body;
    if (!assetId || !requesterId) {
      return NextResponse.json(
        { error: "assetId and requesterId are required" },
        { status: 400 }
      );
    }
    const approval = await prisma.approvalRequest.create({
      data: { assetId, requesterId },
    });
    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("POST /api/approvals:", error);
    return NextResponse.json(
      { error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}
