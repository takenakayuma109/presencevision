"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

const statusVariantMap: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  paid: "success",
  open: "warning",
  draft: "secondary",
  void: "destructive",
  uncollectible: "destructive",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "jpy") {
    return `¥${amount.toLocaleString()}`;
  }
  return `${(amount / 100).toLocaleString("en-US", { style: "currency", currency })}`;
}

export function InvoiceHistory() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/stripe/invoices");
        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error("Failed to fetch invoices");
        }
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("billing.error"));
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [t]);

  const statusTranslation: Record<string, string> = {
    paid: t("billing.invoicePaid"),
    open: t("billing.invoiceOpen"),
    draft: t("billing.invoiceDraft"),
    void: t("billing.invoiceVoid"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t("billing.invoiceHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("billing.loading")}
          </p>
        ) : error ? (
          <p className="text-sm text-red-500 py-4 text-center">{error}</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("billing.noInvoices")}
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(invoice.date)}
                    </p>
                  </div>
                  <Badge variant={statusVariantMap[invoice.status] ?? "secondary"}>
                    {statusTranslation[invoice.status] ?? invoice.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {invoice.hostedInvoiceUrl && (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("billing.viewInvoice")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("billing.downloadPdf")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
