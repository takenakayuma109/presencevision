"use client";

import { useState } from "react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, TechTerm } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  NEEDS_REVISION: "info",
};

const statusLabel: Record<string, string> = {
  PENDING: "保留中",
  APPROVED: "承認済",
  REJECTED: "却下",
  NEEDS_REVISION: "修正必要",
};

export default function ApprovalsPage() {
  const t = useT();
  const { approvals, updateApproval } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          <TechTerm term="承認キュー">{t("approvals.title")}</TechTerm>
        </h2>
        <p className="text-sm text-muted-foreground">{t("approvals.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("approvals.pendingRecent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("approvals.contentTitle")}</TableHead>
                <TableHead>{t("approvals.requester")}</TableHead>
                <TableHead>{t("approvals.status")}</TableHead>
                <TableHead>{t("approvals.created")}</TableHead>
                <TableHead className="w-[120px]">{t("approvals.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.contentTitle}</TableCell>
                  <TableCell>{a.requester}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[a.status]}>
                      {statusLabel[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(a.created)}</TableCell>
                  <TableCell>
                    {a.status === "PENDING" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateApproval(a.id, { status: "APPROVED" })}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateApproval(a.id, { status: "REJECTED" })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
