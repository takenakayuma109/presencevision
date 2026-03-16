import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import type Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log(
    `Checkout completed: customer=${customerId}, subscription=${subscriptionId}`,
  );

  // TODO: Update user record in database with customerId and subscriptionId
  // TODO: Activate subscription in local database
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(
    `Subscription updated: customer=${customerId}, status=${status}, id=${subscription.id}`,
  );

  // TODO: Update subscription status in local database
  // TODO: Handle plan changes, trial endings, etc.
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;

  console.log(
    `Subscription deleted: customer=${customerId}, id=${subscription.id}`,
  );

  // TODO: Mark subscription as canceled in local database
  // TODO: Revoke access or downgrade to free tier
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId = invoice.customer as string;
  const sub = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === "string" ? sub : sub?.id ?? "";

  console.log(
    `Payment failed: customer=${customerId}, subscription=${subscriptionId}`,
  );

  // TODO: Notify user of payment failure
  // TODO: Update subscription status to past_due in local database
}
