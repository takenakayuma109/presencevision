import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body as { customerId: string };

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const origin = request.nextUrl.origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ portalUrl: session.url });
  } catch (error) {
    console.error("POST /api/stripe/portal:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
