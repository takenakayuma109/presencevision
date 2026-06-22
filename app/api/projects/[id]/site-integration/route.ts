/**
 * GET /api/projects/[id]/site-integration
 * ログインユーザー向けに、汎用サイト連携の情報（APIキー・各種URL・埋め込みコード）を返す。
 * プロジェクトのワークスペースに所属しているユーザーのみ取得可。
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/stripe/get-session";
import { projectRepository } from "@/server/repositories";
import { prisma } from "@/lib/db";
import { siteIntegration } from "@/lib/site-api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const project = await projectRepository.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, workspaceId: project.workspaceId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(siteIntegration(id));
  } catch (error) {
    console.error("GET /api/projects/[id]/site-integration:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
