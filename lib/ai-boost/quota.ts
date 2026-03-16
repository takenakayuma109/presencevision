import type { AIBoostQuota } from "@/lib/types/ai-boost";
import type { PlanId } from "@/lib/types/billing";

// ---------------------------------------------------------------------------
// Plan limits
// ---------------------------------------------------------------------------
const PLAN_LIMITS: Record<PlanId, number> = {
  starter: 5,
  professional: 20,
  enterprise: 50,
};

// ---------------------------------------------------------------------------
// In-memory storage (keyed by projectId)
// ---------------------------------------------------------------------------
interface QuotaRecord {
  planId: PlanId;
  used: number;
  resetAt: string; // ISO date string, start of next month
}

const store = new Map<string, QuotaRecord>();

function getResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

function ensureRecord(projectId: string, planId: PlanId): QuotaRecord {
  let record = store.get(projectId);

  // Reset if past the reset date
  if (record && new Date(record.resetAt) <= new Date()) {
    record = undefined;
    store.delete(projectId);
  }

  if (!record) {
    record = { planId, used: 0, resetAt: getResetDate() };
    store.set(projectId, record);
  }

  // Update plan if it changed (e.g. user upgraded)
  record.planId = planId;
  return record;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getQuota(projectId: string, planId: PlanId): AIBoostQuota {
  const record = ensureRecord(projectId, planId);
  const limit = PLAN_LIMITS[record.planId];
  const remaining = Math.max(0, limit - record.used);

  return {
    planId: record.planId,
    monthlyLimit: limit,
    used: record.used,
    remaining,
    resetAt: record.resetAt,
  };
}

export function checkQuota(
  projectId: string,
  planId: PlanId
): { allowed: boolean; reason?: string } {
  const quota = getQuota(projectId, planId);

  if (quota.remaining <= 0) {
    return {
      allowed: false,
      reason: `月間生成上限（${quota.monthlyLimit}件）に達しました。プランをアップグレードするか、${new Date(quota.resetAt).toLocaleDateString("ja-JP")}のリセットをお待ちください。`,
    };
  }

  return { allowed: true };
}

export function consumeQuota(projectId: string): void {
  const record = store.get(projectId);
  if (!record) {
    throw new Error(`No quota record found for project ${projectId}`);
  }
  record.used += 1;
}
