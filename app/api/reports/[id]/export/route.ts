import { NextRequest, NextResponse } from "next/server";
import { exportReportAsMarkdown } from "@/server/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const markdown = await exportReportAsMarkdown(id);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="report-${id}.md"`,
      },
    });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2025") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    console.error("GET /api/reports/[id]/export:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
