import { NextRequest, NextResponse } from "next/server";
import { contentRepository } from "@/server/repositories";
import type { AssetStatus, AssetType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const status = request.nextUrl.searchParams.get("status") as
      | AssetStatus
      | null;
    const type = request.nextUrl.searchParams.get("type") as AssetType | null;
    const filters =
      status || type ? { ...(status && { status }), ...(type && { type }) } : undefined;
    const assets = await contentRepository.findByProject(projectId, filters);
    return NextResponse.json(assets);
  } catch (error) {
    console.error("GET /api/content:", error);
    return NextResponse.json(
      { error: "Failed to list content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, briefId, entityId, type, title, slug, locale } = body;
    if (!projectId || !title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }
    const asset = await contentRepository.create({
      projectId,
      briefId,
      entityId,
      type,
      title,
      slug,
      locale,
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("POST /api/content:", error);
    return NextResponse.json(
      { error: "Failed to create content asset" },
      { status: 500 }
    );
  }
}
