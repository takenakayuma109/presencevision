import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/stripe/get-session";
import { prisma } from "@/lib/db";

async function resolveWorkspaceId(userId: string): Promise<string | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspaceId ?? null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ companyProfile: null });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { metadata: true },
    });

    const metadata = (workspace?.metadata as Record<string, unknown>) ?? {};
    return NextResponse.json({
      companyProfile: metadata.companyProfile ?? null,
    });
  } catch (error) {
    console.error("GET /api/company-profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
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

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      companyName,
      companyNameEn,
      representative,
      foundedDate,
      industry,
      employeeCount,
      headquarters,
      companyUrl,
      description,
      capital,
      revenueScale,
      listingStatus,
      logoUrl,
    } = body;

    // Validate required fields
    const requiredFields = [
      "companyName",
      "companyNameEn",
      "representative",
      "foundedDate",
      "industry",
      "employeeCount",
      "headquarters",
      "companyUrl",
      "description",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { metadata: true },
    });

    const existingMetadata =
      (workspace?.metadata as Record<string, unknown>) ?? {};

    const companyProfile = {
      companyName,
      companyNameEn,
      representative,
      foundedDate,
      industry,
      employeeCount,
      headquarters,
      companyUrl,
      description,
      capital: capital || null,
      revenueScale: revenueScale || null,
      listingStatus: listingStatus || null,
      logoUrl: logoUrl || null,
      updatedAt: new Date().toISOString(),
    };

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        metadata: {
          ...existingMetadata,
          companyProfile,
        },
      },
    });

    return NextResponse.json({ companyProfile }, { status: 200 });
  } catch (error) {
    console.error("POST /api/company-profile:", error);
    return NextResponse.json(
      { error: "Failed to save company profile" },
      { status: 500 },
    );
  }
}
