import { NextResponse } from "next/server";
import { getSession, getUserId } from "@/lib/stripe/get-session";
import { getSubscription, checkAccess } from "@/lib/stripe/subscription";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = getUserId(session);

    const [subscription, access] = await Promise.all([
      getSubscription(userId),
      checkAccess(userId),
    ]);

    return NextResponse.json({
      subscription: subscription
        ? {
            planId: subscription.planId,
            status: subscription.status,
            interval: subscription.interval,
            currentPeriodStart: subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            trialEnd: subscription.trialEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      hasAccess: access.hasAccess,
      isTrialing: access.isTrialing,
      planId: access.planId,
    });
  } catch (error) {
    console.error("GET /api/stripe/subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}
