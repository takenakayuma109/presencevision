"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PublishGuardResult } from "@/lib/types/trust";

interface PublishGuardDialogProps {
  open: boolean;
  onClose: () => void;
  result: PublishGuardResult;
}

function CheckRow({ label, failed }: { label: string; failed: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {failed ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs">
          !!
        </span>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success text-xs">
          OK
        </span>
      )}
      <span className={failed ? "text-destructive" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

export function PublishGuardDialog({ open, onClose, result }: PublishGuardDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="公開ガードチェック">
      <div className="space-y-4">
        {/* Overall status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">ステータス:</span>
          {result.allowed ? (
            <Badge variant="success">公開可能</Badge>
          ) : (
            <Badge variant="destructive">公開不可</Badge>
          )}
        </div>

        {/* Individual checks */}
        <ul className="space-y-2">
          <CheckRow label="エンティティ認証" failed={result.entityNotVerified} />
          <CheckRow label="エビデンス確認" failed={result.missingEvidence} />
          <CheckRow label="トラストスコア基準" failed={result.trustScoreTooLow} />
        </ul>

        {/* Failure reasons */}
        {result.reasons.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="mb-1 text-xs font-medium text-destructive">未達成項目:</p>
            <ul className="space-y-1">
              {result.reasons.map((reason, i) => (
                <li key={i} className="text-xs text-destructive/80">
                  - {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
