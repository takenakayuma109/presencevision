import { NextRequest, NextResponse } from "next/server";
import { enqueueJob } from "@/lib/jobs";
import type { JobType } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, projectId, workspaceId, data } = body;
    if (!type || !projectId || !workspaceId) {
      return NextResponse.json(
        { error: "type, projectId, and workspaceId are required" },
        { status: 400 }
      );
    }
    const job = await enqueueJob({
      type: type as JobType,
      projectId,
      workspaceId,
      data,
    });
    return NextResponse.json(
      { message: "Job enqueued", jobId: job.id },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/jobs:", error);
    return NextResponse.json(
      { error: "Failed to enqueue job" },
      { status: 500 }
    );
  }
}
