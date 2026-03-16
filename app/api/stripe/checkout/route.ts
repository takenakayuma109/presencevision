import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getPlan } from "@/lib/stripe/config";
import type { PlanId, BillingInterval } from "@/lib/types/billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, interval, customerId } = body as {
      planId: PlanId;
      interval: BillingInterval;
      customerId?: string;
    };

    if (!planId || !interval) {
      return NextResponse.json(
        { error: "planId and interval are required" },
        { status: 400 },
      );
    }

    const plan = getPlan(planId);
    const priceId =
      interval === "annual"
        ? plan.stripePriceIds.annual
        : plan.stripePriceIds.monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID is not configured for this plan" },
        { status: 500 },
      );
    }

    const stripe = getStripe();

    const origin = request.nextUrl.origin;

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      currency: "jpy",
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
    };

    if (customerId) {
      params.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("POST /api/stripe/checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
