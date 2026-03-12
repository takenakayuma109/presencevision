import { NextRequest, NextResponse } from "next/server";
import { contentRepository } from "@/server/repositories";
import type { AssetStatus } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await contentRepository.findById(id);
    if (!asset) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    console.error("GET /api/content/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

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
    const validStatuses: AssetStatus[] = [
      "DRAFT",
      "REVIEW",
      "APPROVED",
      "PUBLISHED",
      "ARCHIVED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    const asset = await contentRepository.updateStatus(id, status);
    return NextResponse.json(asset);
  } catch (error) {
    console.error("PATCH /api/content/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update content status" },
      { status: 500 }
    );
  }
}
