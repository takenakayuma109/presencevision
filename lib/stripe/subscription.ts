import type { PlanId, BillingInterval, SubscriptionStatus, Subscription } from "@/lib/types/billing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionRecord {
  userId: string;
  stripeCustomerId: string;
  stripeSubId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface AccessCheck {
  hasAccess: boolean;
  planId: PlanId | null;
  isTrialing: boolean;
}

// ---------------------------------------------------------------------------
// In-memory fallback store (used when Prisma is not available)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, SubscriptionRecord>();
const memoryStoreByStripeSubId = new Map<string, string>(); // stripeSubId -> userId
const memoryStoreByCustomerId = new Map<string, string>(); // stripeCustomerId -> userId

// ---------------------------------------------------------------------------
// Prisma helper — returns the PrismaClient or null if not available
// ---------------------------------------------------------------------------

async function getPrisma(): Promise<any | null> {
  try {
    const mod = await import("@prisma/client");
    const { PrismaClient } = mod;
    // Reuse a global instance to avoid too many connections in dev
    const globalForPrisma = globalThis as unknown as { __prisma?: any };
    if (!globalForPrisma.__prisma) {
      globalForPrisma.__prisma = new PrismaClient();
    }
    return globalForPrisma.__prisma;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// createOrUpdateSubscription
// ---------------------------------------------------------------------------

export async function createOrUpdateSubscription(params: {
  userId: string;
  stripeCustomerId: string;
  stripeSubId: string;
  planId: string;
  status: string;
  interval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const record: SubscriptionRecord = {
    userId: params.userId,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubId: params.stripeSubId,
    planId: params.planId as PlanId,
    status: params.status as SubscriptionStatus,
    interval: params.interval as BillingInterval,
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    trialEnd: params.trialEnd,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
  };

  const prisma = await getPrisma();

  if (prisma) {
    try {
      await prisma.subscription.upsert({
        where: { userId: params.userId },
        create: {
          userId: params.userId,
          stripeCustomerId: params.stripeCustomerId,
          stripeSubId: params.stripeSubId,
          planId: params.planId,
          status: params.status,
          interval: params.interval,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          trialEnd: params.trialEnd ?? null,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        },
        update: {
          stripeCustomerId: params.stripeCustomerId,
          stripeSubId: params.stripeSubId,
          planId: params.planId,
          status: params.status,
          interval: params.interval,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          trialEnd: params.trialEnd ?? null,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        },
      });
      return;
    } catch (err) {
      console.warn("Prisma upsert failed, falling back to in-memory store:", err);
    }
  }

  // In-memory fallback
  memoryStore.set(params.userId, record);
  memoryStoreByStripeSubId.set(params.stripeSubId, params.userId);
  memoryStoreByCustomerId.set(params.stripeCustomerId, params.userId);
}

// ---------------------------------------------------------------------------
// getSubscription
// ---------------------------------------------------------------------------

export async function getSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { userId },
      });
      if (!sub) return null;
      return {
        userId: sub.userId,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubId: sub.stripeSubId,
        planId: sub.planId as PlanId,
        status: sub.status as SubscriptionStatus,
        interval: sub.interval as BillingInterval,
        currentPeriodStart: new Date(sub.currentPeriodStart),
        currentPeriodEnd: new Date(sub.currentPeriodEnd),
        trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
      };
    } catch (err) {
      console.warn("Prisma query failed, falling back to in-memory store:", err);
    }
  }

  return memoryStore.get(userId) ?? null;
}

// ---------------------------------------------------------------------------
// getSubscriptionByStripeSubId
// ---------------------------------------------------------------------------

export async function getSubscriptionByStripeSubId(
  stripeSubId: string,
): Promise<SubscriptionRecord | null> {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId },
      });
      if (!sub) return null;
      return {
        userId: sub.userId,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubId: sub.stripeSubId,
        planId: sub.planId as PlanId,
        status: sub.status as SubscriptionStatus,
        interval: sub.interval as BillingInterval,
        currentPeriodStart: new Date(sub.currentPeriodStart),
        currentPeriodEnd: new Date(sub.currentPeriodEnd),
        trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
      };
    } catch (err) {
      console.warn("Prisma query failed, falling back to in-memory store:", err);
    }
  }

  const userId = memoryStoreByStripeSubId.get(stripeSubId);
  if (!userId) return null;
  return memoryStore.get(userId) ?? null;
}

// ---------------------------------------------------------------------------
// getSubscriptionByCustomerId
// ---------------------------------------------------------------------------

export async function getSubscriptionByCustomerId(
  stripeCustomerId: string,
): Promise<SubscriptionRecord | null> {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const sub = await prisma.subscription.findFirst({
        where: { stripeCustomerId },
      });
      if (!sub) return null;
      return {
        userId: sub.userId,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubId: sub.stripeSubId,
        planId: sub.planId as PlanId,
        status: sub.status as SubscriptionStatus,
        interval: sub.interval as BillingInterval,
        currentPeriodStart: new Date(sub.currentPeriodStart),
        currentPeriodEnd: new Date(sub.currentPeriodEnd),
        trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
      };
    } catch (err) {
      console.warn("Prisma query failed, falling back to in-memory store:", err);
    }
  }

  const userId = memoryStoreByCustomerId.get(stripeCustomerId);
  if (!userId) return null;
  return memoryStore.get(userId) ?? null;
}

// ---------------------------------------------------------------------------
// cancelSubscription
// ---------------------------------------------------------------------------

export async function cancelSubscription(stripeSubId: string): Promise<void> {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      await prisma.subscription.updateMany({
        where: { stripeSubId },
        data: { status: "canceled" },
      });
      return;
    } catch (err) {
      console.warn("Prisma update failed, falling back to in-memory store:", err);
    }
  }

  const userId = memoryStoreByStripeSubId.get(stripeSubId);
  if (userId) {
    const record = memoryStore.get(userId);
    if (record) {
      record.status = "canceled";
    }
  }
}

// ---------------------------------------------------------------------------
// updateSubscriptionStatus
// ---------------------------------------------------------------------------

export async function updateSubscriptionStatus(
  stripeSubId: string,
  status: SubscriptionStatus,
): Promise<void> {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      await prisma.subscription.updateMany({
        where: { stripeSubId },
        data: { status },
      });
      return;
    } catch (err) {
      console.warn("Prisma update failed, falling back to in-memory store:", err);
    }
  }

  const userId = memoryStoreByStripeSubId.get(stripeSubId);
  if (userId) {
    const record = memoryStore.get(userId);
    if (record) {
      record.status = status;
    }
  }
}

// ---------------------------------------------------------------------------
// checkAccess
// ---------------------------------------------------------------------------

export async function checkAccess(userId: string): Promise<AccessCheck> {
  const sub = await getSubscription(userId);

  if (!sub) {
    return { hasAccess: false, planId: null, isTrialing: false };
  }

  const activeStatuses: SubscriptionStatus[] = ["active", "trialing"];
  const hasAccess = activeStatuses.includes(sub.status);
  const isTrialing = sub.status === "trialing";

  return {
    hasAccess,
    planId: hasAccess ? sub.planId : null,
    isTrialing,
  };
}
