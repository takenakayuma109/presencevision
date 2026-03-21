"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Clock } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { PLANS } from "@/lib/stripe/config";
import type { PlanId, BillingInterval, SubscriptionStatus } from "@/lib/types/billing";

interface SubscriptionData {
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData | null;
  isTrialing: boolean;
  onManageBilling: () => void;
  onChangePlan: () => void;
  loading?: boolean;
}

const statusVariantMap: Record<SubscriptionStatus, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  canceled: "destructive",
  unpaid: "destructive",
};

function getTrialDaysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function SubscriptionCard({
  subscription,
  isTrialing,
  onManageBilling,
  onChangePlan,
  loading,
}: SubscriptionCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{t("billing.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t("billing.currentPlan")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <p className="text-lg font-medium">{t("billing.noSubscription")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("billing.noSubscriptionDesc")}
            </p>
          </div>
          <Button onClick={onChangePlan} className="w-full">
            {t("billing.choosePlan")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = PLANS[subscription.planId];
  const price = subscription.interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const statusKey = `billing.status${subscription.status.charAt(0).toUpperCase()}${subscription.status.slice(1).replace("_", "")}` as string;
  const trialDays = getTrialDaysRemaining(subscription.trialEnd);

  // Map status to a translation key
  const statusTranslationMap: Record<SubscriptionStatus, string> = {
    active: "billing.statusActive",
    trialing: "billing.statusTrialing",
    past_due: "billing.statusPastDue",
    canceled: "billing.statusCanceled",
    unpaid: "billing.statusUnpaid",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t("billing.currentPlan")}
          </CardTitle>
          <Badge variant={statusVariantMap[subscription.status]}>
            {t(statusTranslationMap[subscription.status])}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan name and price */}
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {subscription.interval === "annual" ? t("billing.annual") : t("billing.monthly")}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{formatPrice(price)}</span>
            <span className="text-sm text-muted-foreground">{t("billing.perMonth")}</span>
          </div>
        </div>

        {/* Trial badge */}
        {isTrialing && subscription.trialEnd && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-3 py-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-400">
              {t("billing.trialDaysRemaining").replace("{days}", String(trialDays))}
            </span>
          </div>
        )}

        {/* Cancel at period end notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-3 py-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-700 dark:text-orange-400">
              {t("billing.cancelAtPeriodEnd")}
            </span>
          </div>
        )}

        {/* Billing details */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("billing.nextBillingDate")}</span>
            <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("billing.billingCycle")}</span>
            <span className="font-medium">
              {subscription.interval === "annual" ? t("billing.annual") : t("billing.monthly")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onChangePlan} className="flex-1">
            {t("billing.changePlan")}
          </Button>
          <Button variant="outline" size="sm" onClick={onManageBilling} className="flex-1">
            {t("billing.manageBilling")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
