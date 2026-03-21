"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { PlanSelector } from "@/components/billing/plan-selector";
import { InvoiceHistory } from "@/components/billing/invoice-history";
import type { PlanId, BillingInterval, SubscriptionStatus } from "@/lib/types/billing";

interface SubscriptionResponse {
  subscription: {
    planId: PlanId;
    status: SubscriptionStatus;
    interval: BillingInterval;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  hasAccess: boolean;
  isTrialing: boolean;
  planId: PlanId | null;
}

export default function BillingPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/subscription");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      // User may not be authenticated or no subscription
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to open portal");
      const { portalUrl } = await res.json();
      window.location.href = portalUrl;
    } catch {
      // Portal not available, may not have subscription
      setActionLoading(false);
    }
  };

  const handleSelectPlan = async (planId: PlanId, interval: BillingInterval) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });
      if (!res.ok) throw new Error("Failed to create checkout");
      const { sessionUrl } = await res.json();
      window.location.href = sessionUrl;
    } catch {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
      // Use the Stripe portal for cancellation (safest approach)
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to open portal");
      const { portalUrl } = await res.json();
      window.location.href = portalUrl;
    } catch {
      setActionLoading(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("billing.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("billing.subtitle")}</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Subscription Card */}
        <SubscriptionCard
          subscription={data?.subscription ?? null}
          isTrialing={data?.isTrialing ?? false}
          onManageBilling={handleManageBilling}
          onChangePlan={() => setShowPlanSelector(!showPlanSelector)}
          loading={loading}
        />

        {/* Plan Selector (toggled) */}
        {showPlanSelector && (
          <PlanSelector
            currentPlanId={data?.subscription?.planId ?? null}
            currentInterval={data?.subscription?.interval ?? "monthly"}
            onSelectPlan={handleSelectPlan}
            loading={actionLoading}
          />
        )}

        {/* Manage Billing Card */}
        {data?.subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {t("billing.manageBilling")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("billing.manageBillingDesc")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={actionLoading}
              >
                {t("billing.openPortal")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invoice History */}
        {data?.subscription && <InvoiceHistory />}

        {/* Cancel Subscription */}
        {data?.subscription &&
          data.subscription.status !== "canceled" &&
          !data.subscription.cancelAtPeriodEnd && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {t("billing.cancelSubscription")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showCancelConfirm ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("billing.cancelConfirm")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancelSubscription}
                        disabled={actionLoading}
                      >
                        {t("billing.cancelButton")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        {t("billing.keepButton")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20"
                  >
                    {t("billing.cancelSubscription")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
