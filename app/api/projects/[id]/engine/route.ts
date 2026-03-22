/**
 * POST /api/projects/[id]/engine — Register a DB project with the VPS engine
 *
 * Called by the frontend to start the engine for a project that was created
 * in the database but not yet registered with the engine.
 */

import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/server/repositories";
import { getSession } from "@/lib/stripe/get-session";
import { prisma } from "@/lib/db";

const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, workspaceId: project.workspaceId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read optional overrides from request body
    const body = await request.json().catch(() => ({}));
    const {
      brandName = project.name,
      url = "",
      keywords = [],
      targetCountries = ["JP"],
      methods = ["SEO"],
    } = body as {
      brandName?: string;
      url?: string;
      keywords?: string[];
      targetCountries?: string[];
      methods?: string[];
    };

    // Register with the engine
    const engineRes = await fetch(`${ENGINE_URL}/engine/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ENGINE_API_KEY,
      },
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        targetUrl: url || `https://${project.name.toLowerCase().replace(/\s+/g, "-")}.com`,
        brandName,
        keywords,
        targetCountries,
        methods,
        status: "active",
        createdAt: project.createdAt,
      }),
    });

    if (!engineRes.ok) {
      const errData = await engineRes.json().catch(() => ({}));
      // 409 means already running — treat as success
      if (engineRes.status === 409) {
        return NextResponse.json({
          message: "Project is already registered with the engine",
          alreadyRunning: true,
        });
      }
      return NextResponse.json(
        { error: "Failed to register with engine", details: errData },
        { status: 502 },
      );
    }

    const data = await engineRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/projects/[id]/engine:", error);
    return NextResponse.json(
      { error: "Failed to register project with engine" },
      { status: 500 },
    );
  }
}
