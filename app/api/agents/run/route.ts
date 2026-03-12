import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/server/agents";
import type { AgentName } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent, projectId, workspaceId, locale, extra } = body;
    if (!agent || !projectId || !workspaceId) {
      return NextResponse.json(
        { error: "agent, projectId, and workspaceId are required" },
        { status: 400 }
      );
    }
    const result = await orchestrator.runSingleAgent(agent as AgentName, {
      projectId,
      workspaceId,
      locale: locale ?? "ja",
      extra,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/agents/run:", error);
    return NextResponse.json(
      { error: "Failed to run agent" },
      { status: 500 }
    );
  }
}
