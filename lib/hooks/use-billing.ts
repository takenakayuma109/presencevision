"use client";

import { useState, useCallback } from "react";
import type { PlanId, BillingInterval } from "@/lib/types/billing";

interface UseBillingResult {
  checkout: (planId: PlanId, interval: BillingInterval) => Promise<void>;
  openPortal: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Stripe決済フック
 *
 * - checkout: Stripe Checkoutセッションを作成し、決済ページへリダイレクト
 * - openPortal: Stripe Customer Portalを開いてサブスクリプション管理
 *
 * @param customerId - 既存のStripe顧客ID（ログインユーザーに紐づく）
 */
export function useBilling(customerId?: string): UseBillingResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (planId: PlanId, interval: BillingInterval) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, interval, customerId }),
        });

        if (!res.ok) {
          const data = await res.json();
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
    [customerId],
  );

  const openPortal = useCallback(async () => {
    if (!customerId) {
      setError("No customer ID available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      if (!res.ok) {
        const data = await res.json();
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
  }, [customerId]);

  return { checkout, openPortal, loading, error };
}
