import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { getSession, getUserId } from "@/lib/stripe/get-session";
import { getSubscription } from "@/lib/stripe/subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = getUserId(session);

    // Look up the user's subscription to find their Stripe customer ID
    const subscription = await getSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const origin = request.nextUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ portalUrl: portalSession.url });
  } catch (error) {
    console.error("POST /api/stripe/portal:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
