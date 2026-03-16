"use client";

import { Badge } from "@/components/ui/badge";
import type { VerificationStatus } from "@/lib/types/trust";

interface EntityTrustBadgeProps {
  status: VerificationStatus;
  score?: number;
  className?: string;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  verified: { label: "認証済み", variant: "success" },
  pending: { label: "審査中", variant: "warning" },
  rejected: { label: "却下", variant: "destructive" },
  suspended: { label: "停止中", variant: "destructive" },
};

function scoreTier(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "高信頼", color: "text-success" };
  if (score >= 50) return { label: "標準", color: "text-info" };
  if (score >= 30) return { label: "制限付き", color: "text-warning" };
  return { label: "公開不可", color: "text-destructive" };
}

export function EntityTrustBadge({ status, score, className }: EntityTrustBadgeProps) {
  const config = STATUS_CONFIG[status];
  const tier = score != null ? scoreTier(score) : null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <Badge variant={config.variant}>{config.label}</Badge>
      {tier && (
        <span className={`text-xs font-medium ${tier.color}`}>
          {tier.label} ({score})
        </span>
      )}
    </span>
  );
}
