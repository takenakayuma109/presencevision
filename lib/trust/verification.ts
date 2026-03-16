import type {
  EntityVerification,
  ContentEvidence,
  EntityTrustScore,
  PublishGuardResult,
  VerificationStatus,
} from "@/lib/types/trust";
import { buildTrustScore, type TrustSignals } from "./score-engine";

// ---------------------------------------------------------------------------
// Entity verification
// ---------------------------------------------------------------------------

export interface VerificationChecks {
  corporateRegistration: boolean;
  officialWebsite: boolean;
  activeService: boolean;
  domainOwnership: boolean;
}

/**
 * Runs entity verification checks and returns an EntityVerification record.
 *
 * An entity is considered verified when ALL four checks pass.
 */
export function verifyEntity(
  projectId: string,
  checks: VerificationChecks,
): EntityVerification {
  const allPassed =
    checks.corporateRegistration &&
    checks.officialWebsite &&
    checks.activeService &&
    checks.domainOwnership;

  const status: VerificationStatus = allPassed ? "verified" : "pending";

  const failedChecks: string[] = [];
  if (!checks.corporateRegistration) failedChecks.push("法人登記が未確認です");
  if (!checks.officialWebsite) failedChecks.push("公式サイトが未確認です");
  if (!checks.activeService) failedChecks.push("サービス実在が未確認です");
  if (!checks.domainOwnership) failedChecks.push("ドメイン所有が未確認です");

  return {
    id: crypto.randomUUID(),
    projectId,
    status,
    corporateRegistration: checks.corporateRegistration,
    officialWebsite: checks.officialWebsite,
    activeService: checks.activeService,
    domainOwnership: checks.domainOwnership,
    verifiedAt: allPassed ? new Date().toISOString() : undefined,
    rejectedReason: failedChecks.length > 0 ? failedChecks.join("; ") : undefined,
  };
}

// ---------------------------------------------------------------------------
// Evidence validation
// ---------------------------------------------------------------------------

/** Minimum number of valid evidence items required for publication */
const MIN_EVIDENCE_COUNT = 2;

/**
 * Validates that content has sufficient evidence backing.
 *
 * Returns `true` when the artifact has at least `MIN_EVIDENCE_COUNT` valid
 * evidence items from distinct sources.
 */
export function checkEvidence(
  artifactId: string,
  evidences: ContentEvidence[],
): { sufficient: boolean; validCount: number; reasons: string[] } {
  const relevant = evidences.filter((e) => e.artifactId === artifactId && e.isValid);

  // Deduplicate by URL to avoid counting the same source twice
  const uniqueUrls = new Set(relevant.map((e) => e.url));

  const reasons: string[] = [];
  if (uniqueUrls.size < MIN_EVIDENCE_COUNT) {
    reasons.push(
      `エビデンスが不足しています（${uniqueUrls.size}/${MIN_EVIDENCE_COUNT}件）`,
    );
  }

  return {
    sufficient: uniqueUrls.size >= MIN_EVIDENCE_COUNT,
    validCount: uniqueUrls.size,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Trust score calculation
// ---------------------------------------------------------------------------

/**
 * Calculates and returns the EntityTrustScore for a project.
 */
export function calculateTrustScore(
  projectId: string,
  signals: TrustSignals,
): EntityTrustScore {
  return buildTrustScore(projectId, signals);
}

// ---------------------------------------------------------------------------
// Publish guard
// ---------------------------------------------------------------------------

export interface PublishGuardInput {
  entityVerification: EntityVerification;
  evidences: ContentEvidence[];
  trustScore: EntityTrustScore;
}

/**
 * Checks whether content can be published by verifying three conditions:
 * 1. The entity is verified
 * 2. Sufficient evidence exists for the artifact
 * 3. The trust score meets the minimum publish threshold
 */
export function publishGuard(
  artifactId: string,
  input: PublishGuardInput,
): PublishGuardResult {
  const { entityVerification, evidences, trustScore } = input;

  const reasons: string[] = [];

  const entityNotVerified = entityVerification.status !== "verified";
  if (entityNotVerified) {
    reasons.push("エンティティが未認証です");
  }

  const evidenceResult = checkEvidence(artifactId, evidences);
  const missingEvidence = !evidenceResult.sufficient;
  if (missingEvidence) {
    reasons.push(...evidenceResult.reasons);
  }

  const trustScoreTooLow = !trustScore.canPublish;
  if (trustScoreTooLow) {
    reasons.push(
      `トラストスコアが公開基準を下回っています（${trustScore.overallScore}/30）`,
    );
  }

  const allowed = !entityNotVerified && !missingEvidence && !trustScoreTooLow;

  return {
    allowed,
    reasons,
    missingEvidence,
    trustScoreTooLow,
    entityNotVerified,
  };
}
