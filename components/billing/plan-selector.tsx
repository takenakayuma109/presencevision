"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { PLANS } from "@/lib/stripe/config";
import type { PlanId, BillingInterval } from "@/lib/types/billing";

interface PlanSelectorProps {
  currentPlanId: PlanId | null;
  currentInterval: BillingInterval;
  onSelectPlan: (planId: PlanId, interval: BillingInterval) => void;
  loading?: boolean;
}

const planFeatures: Record<PlanId, string[]> = {
  starter: [
    "1 project",
    "5 keywords",
    "3 distribution channels",
    "100 articles/month",
    "Basic SERP tracking",
  ],
  professional: [
    "5 projects",
    "50 keywords",
    "10 distribution channels",
    "500 articles/month",
    "SERP + LLM citation tracking",
    "Competitor analysis",
    "CMS auto-publishing",
    "Priority support",
  ],
  enterprise: [
    "Unlimited projects",
    "Unlimited keywords",
    "25+ distribution channels",
    "Unlimited articles",
    "All features",
    "Dedicated VPS instance",
    "Custom channels",
    "API integration",
    "Dedicated support",
    "SLA guarantee",
  ],
};

const planFeaturesJa: Record<PlanId, string[]> = {
  starter: [
    "1プロジェクト",
    "5キーワード",
    "3チャネル配信",
    "月間100記事生成",
    "基本SERP追跡",
  ],
  professional: [
    "5プロジェクト",
    "50キーワード",
    "10チャネル配信",
    "月間500記事生成",
    "SERP + LLM引用追跡",
    "競合分析",
    "CMS自動投稿",
    "優先サポート",
  ],
  enterprise: [
    "プロジェクト無制限",
    "キーワード無制限",
    "全25+チャネル配信",
    "記事生成無制限",
    "全機能利用可能",
    "専用VPSインスタンス",
    "カスタムチャネル追加",
    "API連携",
    "専任サポート",
    "SLA保証",
  ],
};

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function PlanSelector({
  currentPlanId,
  currentInterval,
  onSelectPlan,
  loading,
}: PlanSelectorProps) {
  const { t, locale } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(currentInterval === "annual");

  const interval: BillingInterval = isAnnual ? "annual" : "monthly";
  const planIds: PlanId[] = ["starter", "professional", "enterprise"];
  const features = locale === "ja" ? planFeaturesJa : planFeatures;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("billing.changePlan")}</h3>
      </div>

      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-border/50 bg-card/50 p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              !isAnnual
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.monthly")}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              isAnnual
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.annual")}
          </button>
        </div>
        {isAnnual && (
          <Badge variant="success" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            {t("landing.pricing.billing.annualSave")}
          </Badge>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {planIds.map((planId) => {
          const plan = PLANS[planId];
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const isCurrent = planId === currentPlanId;
          const isFeatured = planId === "professional";

          return (
            <Card
              key={planId}
              className={`relative flex flex-col ${
                isFeatured
                  ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                  : "border-border/50"
              } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
            >
              {isFeatured && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge variant="info">{t("billing.currentPlanBadge")}</Badge>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(price)}</span>
                    <span className="text-muted-foreground">{t("billing.perMonth")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2.5">
                  {features[planId].map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    className={`w-full ${
                      isFeatured && !isCurrent
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : ""
                    }`}
                    variant={isCurrent ? "outline" : isFeatured ? "default" : "outline"}
                    disabled={isCurrent || loading}
                    onClick={() => onSelectPlan(planId, interval)}
                  >
                    {isCurrent
                      ? t("billing.currentPlanBadge")
                      : t("billing.selectPlan")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
