import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import {
  createOrUpdateSubscription,
  getSubscriptionByStripeSubId,
  cancelSubscription,
  updateSubscriptionStatus,
} from "@/lib/stripe/subscription";
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
        await handleCheckoutCompleted(session, stripe);
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
  stripe: Stripe,
): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId ?? "starter";
  const interval = session.metadata?.interval ?? "monthly";

  console.log(
    `Checkout completed: customer=${customerId}, subscription=${subscriptionId}, userId=${userId}`,
  );

  if (!userId) {
    console.error("No userId in checkout session metadata — cannot create subscription record");
    return;
  }

  // Fetch the full subscription from Stripe to get period dates
  let trialEnd: Date | undefined;
  let currentPeriodStart = new Date();
  let currentPeriodEnd = new Date();
  let status = "active";

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    status = stripeSubscription.status;
    currentPeriodStart = new Date(stripeSubscription.items.data[0]?.current_period_start
      ? stripeSubscription.items.data[0].current_period_start * 1000
      : Date.now());
    currentPeriodEnd = new Date(stripeSubscription.items.data[0]?.current_period_end
      ? stripeSubscription.items.data[0].current_period_end * 1000
      : Date.now());
    if (stripeSubscription.trial_end) {
      trialEnd = new Date(stripeSubscription.trial_end * 1000);
    }
  } catch (err) {
    console.error("Failed to retrieve subscription details from Stripe:", err);
  }

  await createOrUpdateSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubId: subscriptionId,
    planId,
    status,
    interval,
    currentPeriodStart,
    currentPeriodEnd,
    trialEnd,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(
    `Subscription updated: customer=${customerId}, status=${status}, id=${subscription.id}`,
  );

  // Try to find the existing subscription record to get userId
  const existing = await getSubscriptionByStripeSubId(subscription.id);

  if (existing) {
    const currentPeriodStart = new Date(
      subscription.items.data[0]?.current_period_start
        ? subscription.items.data[0].current_period_start * 1000
        : Date.now(),
    );
    const currentPeriodEnd = new Date(
      subscription.items.data[0]?.current_period_end
        ? subscription.items.data[0].current_period_end * 1000
        : Date.now(),
    );

    await createOrUpdateSubscription({
      userId: existing.userId,
      stripeCustomerId: customerId,
      stripeSubId: subscription.id,
      planId: existing.planId,
      status,
      interval: existing.interval,
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } else {
    console.warn(
      `No subscription record found for stripeSubId=${subscription.id}, skipping update`,
    );
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;

  console.log(
    `Subscription deleted: customer=${customerId}, id=${subscription.id}`,
  );

  await cancelSubscription(subscription.id);
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

  if (subscriptionId) {
    await updateSubscriptionStatus(subscriptionId, "past_due");
  }
}
