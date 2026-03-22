import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/server/repositories";
import { getSession } from "@/lib/stripe/get-session";
import { prisma } from "@/lib/db";

const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";

/**
 * Resolve the workspace for the authenticated user.
 * If workspaceId is provided, verify membership.
 * Otherwise, return the first workspace the user belongs to.
 * If no workspace exists, auto-create one.
 */
async function resolveWorkspace(userId: string, workspaceId?: string | null) {
  if (workspaceId) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId },
    });
    if (membership) return workspaceId;
  }

  // Find first workspace user belongs to
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (membership) return membership.workspaceId;

  // Auto-create workspace for users who don't have one yet
  // (e.g., credentials-registered users)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const baseName = user?.name || user?.email?.split("@")[0] || "workspace";
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const ws = await prisma.workspace.create({
    data: {
      name: baseName,
      slug,
      plan: "free",
      memberships: { create: { userId, role: "OWNER" } },
    },
  });

  return ws.id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceIdParam = request.nextUrl.searchParams.get("workspaceId");
    const workspaceId = await resolveWorkspace(
      session.user.id,
      workspaceIdParam,
    );

    if (!workspaceId) {
      // No workspace yet — return empty list instead of error
      return NextResponse.json([]);
    }

    const projects = await projectRepository.findAll(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId: requestedWsId,
      name,
      url,
      description,
      locale,
      keywords,
      competitors,
      goals,
      businessCountries,
      presenceCountries,
      audiences,
      methods,
      duration,
      additionalNotes,
      brandName,
      reportConfig,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    // Resolve workspace — auto-create if needed
    const workspaceId = await resolveWorkspace(session.user.id, requestedWsId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Could not resolve workspace" }, { status: 500 });
    }

    // Store wizard-specific config as metadata JSON
    const metadata: Record<string, unknown> = {};
    if (keywords?.length) metadata.keywords = keywords;
    if (goals?.length) metadata.goals = goals;
    if (businessCountries?.length) metadata.businessCountries = businessCountries;
    if (presenceCountries?.length) metadata.presenceCountries = presenceCountries;
    if (audiences?.length) metadata.audiences = audiences;
    if (methods?.length) metadata.methods = methods;
    if (duration) metadata.duration = duration;
    if (additionalNotes) metadata.additionalNotes = additionalNotes;
    if (brandName) metadata.brandName = brandName;
    if (reportConfig) metadata.reportConfig = reportConfig;

    const project = await projectRepository.create({
      workspaceId,
      name,
      url: url || undefined,
      description: description || undefined,
      locale: locale || undefined,
      metadata: Object.keys(metadata).length > 0 ? JSON.parse(JSON.stringify(metadata)) : undefined,
      competitors: competitors || undefined,
    });

    // Register with the engine in the background (non-blocking)
    if (ENGINE_URL && ENGINE_URL !== "http://localhost:4000") {
      fetch(`${ENGINE_URL}/engine/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ENGINE_API_KEY,
        },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          targetUrl: url || `https://${name.toLowerCase().replace(/\s+/g, "-")}.com`,
          brandName: brandName || name,
          keywords: keywords || [],
          targetCountries: presenceCountries || ["JP"],
          methods: methods || ["SEO"],
          status: "active",
          createdAt: project.createdAt,
        }),
      }).catch((err) =>
        console.error("[Engine] Failed to register project:", err),
      );
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
