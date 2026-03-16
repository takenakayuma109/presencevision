export type PlanId = "starter" | "professional" | "enterprise";
export type BillingInterval = "monthly" | "annual";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;  // JPY
  annualPrice: number;   // JPY per month
  stripePriceIds: {
    monthly: string;
    annual: string;
  };
}

export interface Subscription {
  id: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
}
