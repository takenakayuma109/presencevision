import { NextRequest, NextResponse } from "next/server";
import { exportContentAsMarkdown } from "@/server/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const markdown = await exportContentAsMarkdown(id);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="content-${id}.md"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("No content version")) {
      return NextResponse.json(
        { error: "No content version found" },
        { status: 404 }
      );
    }
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    console.error("GET /api/content/[id]/export:", error);
    return NextResponse.json(
      { error: "Failed to export content" },
      { status: 500 }
    );
  }
}
