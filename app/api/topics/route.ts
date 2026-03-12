import { NextRequest, NextResponse } from "next/server";
import { topicRepository } from "@/server/repositories";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const topics = await topicRepository.findByProject(projectId);
    return NextResponse.json(topics);
  } catch (error) {
    console.error("GET /api/topics:", error);
    return NextResponse.json(
      { error: "Failed to list topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      title,
      intent,
      volume,
      difficulty,
      priority,
      topicClusterId,
    } = body;
    if (!projectId || !title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }
    const topic = await topicRepository.create({
      projectId,
      title,
      intent,
      volume,
      difficulty,
      priority,
      topicClusterId,
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("POST /api/topics:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
