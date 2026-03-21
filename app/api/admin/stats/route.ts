import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { PLANS } from "@/lib/stripe/config";
import type { PlanId } from "@/lib/types/billing";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [totalUsers, totalProjects, pendingReviews, subscriptions] =
      await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.approvalRequest.count({ where: { status: "PENDING" } }),
        prisma.subscription.findMany({
          where: { status: { in: ["active", "trialing"] } },
          select: { planId: true, interval: true },
        }),
      ]);

    // Calculate MRR from active subscriptions
    let mrr = 0;
    for (const sub of subscriptions) {
      const plan = PLANS[sub.planId as PlanId];
      if (!plan) continue;
      if (sub.interval === "annual") {
        mrr += plan.annualPrice;
      } else {
        mrr += plan.monthlyPrice;
      }
    }

    return NextResponse.json({
      totalUsers,
      totalProjects,
      pendingReviews,
      mrr,
      activeSubscriptions: subscriptions.length,
    });
  } catch (err) {
    console.error("GET /api/admin/stats:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
