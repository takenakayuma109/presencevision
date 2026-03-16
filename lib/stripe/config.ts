import Stripe from "stripe";
import { loadStripe, type Stripe as StripeClient } from "@stripe/stripe-js";
import type { Plan, PlanId } from "@/lib/types/billing";

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9800,
    annualPrice: 7800,
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ?? "",
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 29800,
    annualPrice: 24800,
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? "",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 98000,
    annualPrice: 78000,
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL ?? "",
    },
  },
};

// ---------------------------------------------------------------------------
// Server-side Stripe instance
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Client-side Stripe instance (singleton promise)
// ---------------------------------------------------------------------------

let _stripePromise: Promise<StripeClient | null> | null = null;

export function getStripeClient(): Promise<StripeClient | null> {
  if (!_stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }
    _stripePromise = loadStripe(publishableKey);
  }
  return _stripePromise;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPlan(planId: PlanId): Plan {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}
