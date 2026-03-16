import { NextRequest, NextResponse } from "next/server";
import {
  getBrandKit,
  addAsset,
  removeAsset,
} from "@/lib/brand-assets/manager";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const kit = getBrandKit(projectId);
    return NextResponse.json(kit);
  } catch (error) {
    console.error("GET /api/brand-assets:", error);
    return NextResponse.json(
      { error: "Failed to get brand kit" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, category, filename, url, mimeType, width, height, fileSize, tags } = body;

    if (!projectId || !category || !filename || !url || !mimeType) {
      return NextResponse.json(
        { error: "projectId, category, filename, url, and mimeType are required" },
        { status: 400 }
      );
    }

    const asset = addAsset(projectId, {
      category,
      filename,
      url,
      mimeType,
      width,
      height,
      fileSize: fileSize ?? 0,
      tags: tags ?? [],
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("POST /api/brand-assets:", error);
    return NextResponse.json(
      { error: "Failed to add asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    const assetId = request.nextUrl.searchParams.get("assetId");

    if (!projectId || !assetId) {
      return NextResponse.json(
        { error: "projectId and assetId are required" },
        { status: 400 }
      );
    }

    const removed = removeAsset(projectId, assetId);
    if (!removed) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/brand-assets:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
