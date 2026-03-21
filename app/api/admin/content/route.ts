import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.contentAsset.findMany({
        where: { status: "REVIEW" },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          entity: { select: { id: true, name: true } },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { id: true, version: true, body: true, createdAt: true },
          },
          approvalRequests: {
            where: { status: "PENDING" },
            include: {
              requester: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.contentAsset.count({ where: { status: "REVIEW" } }),
    ]);

    return NextResponse.json({
      assets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/content:", err);
    return NextResponse.json(
      { error: "Failed to fetch content for review" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { assetId, action } = body;

    if (!assetId || !action) {
      return NextResponse.json(
        { error: "assetId and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const newAssetStatus = action === "approve" ? "APPROVED" : "DRAFT";
    const newApprovalStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // Update asset status and pending approval requests in a transaction
    await prisma.$transaction([
      prisma.contentAsset.update({
        where: { id: assetId },
        data: { status: newAssetStatus },
      }),
      prisma.approvalRequest.updateMany({
        where: { assetId, status: "PENDING" },
        data: { status: newApprovalStatus },
      }),
    ]);

    return NextResponse.json({ success: true, assetId, action });
  } catch (err) {
    console.error("PATCH /api/admin/content:", err);
    return NextResponse.json(
      { error: "Failed to update content status" },
      { status: 500 }
    );
  }
}
