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
    const targets = await prisma.publishTarget.findMany({
      where: { asset: { projectId } },
      include: {
        asset: { select: { id: true, title: true, status: true } },
        channel: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(targets);
  } catch (error) {
    console.error("GET /api/publish:", error);
    return NextResponse.json(
      { error: "Failed to list publish targets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, channelId, publishAt } = body;
    if (!assetId || !channelId) {
      return NextResponse.json(
        { error: "assetId and channelId are required" },
        { status: 400 }
      );
    }
    const target = await prisma.publishTarget.create({
      data: {
        assetId,
        channelId,
        publishAt: publishAt ? new Date(publishAt) : undefined,
      },
    });
    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error("POST /api/publish:", error);
    return NextResponse.json(
      { error: "Failed to create publish target" },
      { status: 500 }
    );
  }
}
