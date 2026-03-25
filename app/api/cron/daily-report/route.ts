/**
 * Daily Report Cron Job
 *
 * Called by Vercel Cron at 0:00 UTC (9:00 JST) every day.
 * For each active project, fetches engine activity stats from the last 24h
 * and sends a summary email to the project owner.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendDailyReport } from "@/lib/email/send";
import type { DailyReportStats, DailyReportHighlight } from "@/lib/email/templates";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[daily-report] CRON_SECRET not set — rejecting request");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// ---------------------------------------------------------------------------
// Engine API helpers
// ---------------------------------------------------------------------------

async function fetchEngineStats(
  projectId: string,
): Promise<{ total: number; completed: number; failed: number; running: number } | null> {
  try {
    const url = new URL("/activities/stats", ENGINE_URL);
    url.searchParams.set("projectId", projectId);

    const res = await fetch(url.toString(), {
      headers: { "x-api-key": ENGINE_API_KEY },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    console.error(`[daily-report] Failed to fetch stats for project ${projectId}`);
    return null;
  }
}

interface EngineActivity {
  id: string;
  type: string;
  status: string;
  title?: string;
  description?: string;
  url?: string;
  createdAt: string;
}

async function fetchEngineActivities(
  projectId: string,
): Promise<EngineActivity[]> {
  try {
    const url = new URL("/activities", ENGINE_URL);
    url.searchParams.set("projectId", projectId);
    url.searchParams.set("limit", "100");

    const res = await fetch(url.toString(), {
      headers: { "x-api-key": ENGINE_API_KEY },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.activities ?? [];
  } catch {
    console.error(`[daily-report] Failed to fetch activities for project ${projectId}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all active projects with their workspace owner info
    const projects = await prisma.project.findMany({
      where: { status: "active" },
      include: {
        workspace: {
          include: {
            memberships: {
              where: { role: "OWNER" },
              include: { user: true },
              take: 1,
            },
          },
        },
      },
    });

    const today = new Date();
    const dateStr = today.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Tokyo",
    });

    const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    let sent = 0;
    let errors = 0;

    for (const project of projects) {
      const owner = project.workspace.memberships[0]?.user;
      if (!owner?.email) {
        console.warn(`[daily-report] No owner email for project ${project.id}, skipping`);
        continue;
      }

      // Fetch engine data
      const [engineStats, activities] = await Promise.all([
        fetchEngineStats(project.id),
        fetchEngineActivities(project.id),
      ]);

      // Filter activities from the last 24 hours
      const recentActivities = activities.filter(
        (a) => new Date(a.createdAt) >= twentyFourHoursAgo,
      );

      // Build stats
      const stats: DailyReportStats = {
        totalTasks: engineStats?.total ?? recentActivities.length,
        completed: engineStats?.completed ?? recentActivities.filter((a) => a.status === "completed").length,
        failed: engineStats?.failed ?? recentActivities.filter((a) => a.status === "failed").length,
        skipped: recentActivities.filter((a) => a.status === "skipped").length,
      };

      // Build highlights from recent activities (max 20)
      const highlights: DailyReportHighlight[] = recentActivities
        .slice(0, 20)
        .map((a) => ({
          title: a.title ?? a.type,
          status: a.status,
          description: a.description ?? "",
          url: a.url,
        }));

      try {
        await sendDailyReport(
          owner.email,
          owner.name ?? "ユーザー",
          project.name,
          dateStr,
          stats,
          highlights,
        );
        sent++;
      } catch (err) {
        console.error(`[daily-report] Failed to send email for project ${project.id}:`, err);
        errors++;
      }
    }

    console.log(`[daily-report] Done. Sent: ${sent}, Errors: ${errors}, Projects: ${projects.length}`);

    return NextResponse.json({
      ok: true,
      sent,
      errors,
      totalProjects: projects.length,
    });
  } catch (err) {
    console.error("[daily-report] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
