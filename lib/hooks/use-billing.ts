"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlanId, BillingInterval, SubscriptionStatus } from "@/lib/types/billing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionInfo {
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UseBillingResult {
  /** Create a Stripe Checkout session and redirect to payment page */
  checkout: (planId: PlanId, interval: BillingInterval) => Promise<void>;
  /** Open Stripe Customer Portal for subscription management */
  openPortal: () => Promise<void>;
  /** Current subscription info (null if no subscription) */
  subscription: SubscriptionInfo | null;
  /** Whether the user has an active or trialing subscription */
  hasAccess: boolean;
  /** Whether the user is currently in a trial period */
  isTrialing: boolean;
  /** The user's current plan ID (null if no active subscription) */
  planId: PlanId | null;
  /** Loading state for any async operation */
  loading: boolean;
  /** Error message from the last failed operation */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Stripe決済フック（認証連携版）
 *
 * - checkout: Stripe Checkoutセッションを作成し、決済ページへリダイレクト
 * - openPortal: Stripe Customer Portalを開いてサブスクリプション管理
 * - subscription: 現在のサブスクリプション情報
 * - hasAccess / isTrialing / planId: アクセス権の派生状態
 *
 * 認証セッションから自動的にユーザー情報を取得するため、customerId は不要です。
 */
export function useBilling(): UseBillingResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [planId, setPlanId] = useState<PlanId | null>(null);

  // Fetch subscription status on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/stripe/subscription");
        if (!res.ok) {
          // 401 is expected if user is not logged in — not an error worth surfacing
          if (res.status === 401) return;
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        setSubscription(data.subscription ?? null);
        setHasAccess(data.hasAccess ?? false);
        setIsTrialing(data.isTrialing ?? false);
        setPlanId(data.planId ?? null);
      } catch {
        // Silently fail — subscription status is supplementary
      }
    }

    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkout = useCallback(
    async (planId: PlanId, interval: BillingInterval) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, interval }),
        });

        if (!res.ok) {
          const data = await res.json();

          // If not authenticated, redirect to sign-in
          if (res.status === 401) {
            const callbackUrl = `/dashboard?plan=${planId}&interval=${interval}`;
            window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            return;
          }

          throw new Error(data.error ?? "Failed to create checkout session");
        }

        const { sessionUrl } = await res.json();

        if (sessionUrl) {
          window.location.href = sessionUrl;
        } else {
          throw new Error("No session URL returned");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Checkout error:", message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const openPortal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();

        if (res.status === 401) {
          window.location.href = "/sign-in?callbackUrl=/dashboard";
          return;
        }

        throw new Error(data.error ?? "Failed to create portal session");
      }

      const { portalUrl } = await res.json();

      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Portal error:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkout,
    openPortal,
    subscription,
    hasAccess,
    isTrialing,
    planId,
    loading,
    error,
  };
}
