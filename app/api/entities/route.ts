import { NextRequest, NextResponse } from "next/server";
import { entityRepository } from "@/server/repositories";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const entities = await entityRepository.findByProject(projectId);
    return NextResponse.json(entities);
  } catch (error) {
    console.error("GET /api/entities:", error);
    return NextResponse.json(
      { error: "Failed to list entities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, type, description, locale } = body;
    if (!projectId || !name || !type) {
      return NextResponse.json(
        { error: "projectId, name, and type are required" },
        { status: 400 }
      );
    }
    const entity = await entityRepository.create({
      projectId,
      name,
      type,
      description,
      locale,
    });
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error("POST /api/entities:", error);
    return NextResponse.json(
      { error: "Failed to create entity" },
      { status: 500 }
    );
  }
}
