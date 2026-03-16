import type { EntityTrustScore } from "@/lib/types/trust";

/** Maximum points per signal category */
const WEIGHTS = {
  newsMentions: 25,
  externalLinks: 20,
  socialMentions: 20,
  corporateVerification: 20,
  contentQuality: 15,
} as const;

/** Distribution thresholds */
const THRESHOLDS = {
  publish: 30,
  distribute: 50,
  fullDistribute: 70,
} as const;

export interface TrustSignals {
  /** Number of news articles mentioning the entity */
  newsMentionCount: number;
  /** Number of external backlinks to entity content */
  externalLinkCount: number;
  /** Number of social media mentions */
  socialMentionCount: number;
  /** Whether the corporate entity has been verified */
  corporateVerified: boolean;
  /** Content quality score from the editor agent (0-1 normalized) */
  contentQualityRatio: number;
}

/**
 * Calculates a sub-score using a logarithmic curve so early signals
 * matter more and returns are diminishing.
 *
 * For example, going from 0 to 5 mentions is worth more than 50 to 55.
 */
function logScore(count: number, maxPoints: number, halfwayAt: number): number {
  if (count <= 0) return 0;
  // ln-based curve: reaches ~50% of max at `halfwayAt` items
  const raw = Math.log(1 + count) / Math.log(1 + halfwayAt) * (maxPoints / 2);
  return Math.min(Math.round(raw * 10) / 10, maxPoints);
}

/**
 * Computes individual signal scores.
 */
export function computeSignalScores(signals: TrustSignals) {
  const newsMentions = logScore(signals.newsMentionCount, WEIGHTS.newsMentions, 10);
  const externalLinks = logScore(signals.externalLinkCount, WEIGHTS.externalLinks, 20);
  const socialMentions = logScore(signals.socialMentionCount, WEIGHTS.socialMentions, 30);
  const corporateVerification = signals.corporateVerified ? WEIGHTS.corporateVerification : 0;
  const contentQuality = Math.min(
    Math.round(signals.contentQualityRatio * WEIGHTS.contentQuality * 10) / 10,
    WEIGHTS.contentQuality,
  );

  return { newsMentions, externalLinks, socialMentions, corporateVerification, contentQuality };
}

/**
 * Build a full EntityTrustScore from raw signals.
 */
export function buildTrustScore(projectId: string, signals: TrustSignals): EntityTrustScore {
  const scores = computeSignalScores(signals);

  const overallScore = Math.round(
    scores.newsMentions +
    scores.externalLinks +
    scores.socialMentions +
    scores.corporateVerification +
    scores.contentQuality,
  );

  return {
    projectId,
    overallScore,
    newsMentions: scores.newsMentions,
    externalLinks: scores.externalLinks,
    socialMentions: scores.socialMentions,
    corporateVerified: signals.corporateVerified,
    contentQuality: scores.contentQuality,
    canPublish: overallScore >= THRESHOLDS.publish,
    canDistribute: overallScore >= THRESHOLDS.distribute,
    canFullDistribute: overallScore >= THRESHOLDS.fullDistribute,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns a human-readable distribution tier label.
 */
export function distributionTier(score: number): "blocked" | "limited" | "normal" | "full" {
  if (score < THRESHOLDS.publish) return "blocked";
  if (score < THRESHOLDS.distribute) return "limited";
  if (score < THRESHOLDS.fullDistribute) return "normal";
  return "full";
}

export { WEIGHTS, THRESHOLDS };
