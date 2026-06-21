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
import { checkAccess } from "@/lib/stripe/subscription";

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

    // 有効なアクセス（無料トライアル/有料/管理者）が無ければ起動しない（コスト制御）
    const access = await checkAccess(session.user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error:
            "エンジンの起動には有効なサブスクリプション（無料トライアルまたは有料プラン）が必要です。",
          code: "subscription_required",
        },
        { status: 403 },
      );
    }

    // プロジェクトのメタデータを設定の真実源にする（body は任意の上書き）
    const meta = (project.metadata as Record<string, unknown> | null) ?? {};
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const asArr = (v: unknown): string[] =>
      Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];

    const keywords = asArr(body.keywords).length ? asArr(body.keywords) : asArr(meta.keywords);
    const methods = asArr(body.methods).length
      ? asArr(body.methods)
      : asArr(meta.methods).length
        ? asArr(meta.methods)
        : ["SEO"];
    const targetCountries = asArr(body.targetCountries).length
      ? asArr(body.targetCountries)
      : asArr(meta.presenceCountries).length
        ? asArr(meta.presenceCountries)
        : ["JP"];
    const brandName =
      (typeof body.brandName === "string" && body.brandName) ||
      (typeof meta.brandName === "string" && meta.brandName) ||
      project.name;
    const url =
      (typeof body.url === "string" && body.url) || project.url || "";

    // 会社プロフィール（E-E-A-T用）をワークスペースから注入
    let companyProfile: unknown;
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id: project.workspaceId },
        select: { metadata: true },
      });
      companyProfile = (ws?.metadata as Record<string, unknown> | null)?.companyProfile;
    } catch {
      /* optional */
    }

    // Register with the engine（契約から確定した planId と会社プロフィールを注入）
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
        autoPublish: meta.autoPublish === true || body.autoPublish === true,
        planId: access.planId,
        ...(companyProfile ? { companyProfile } : {}),
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
