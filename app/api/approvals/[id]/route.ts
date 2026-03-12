import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApprovalStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }
    const validStatuses: ApprovalStatus[] = [
      "APPROVED",
      "REJECTED",
      "NEEDS_REVISION",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use APPROVED, REJECTED, or NEEDS_REVISION" },
        { status: 400 }
      );
    }
    const approval = await prisma.approvalRequest.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(approval);
  } catch (error) {
    console.error("PATCH /api/approvals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
