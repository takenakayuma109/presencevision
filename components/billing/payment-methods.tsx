"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/hooks/use-translation";
import { ShieldCheck } from "lucide-react";

export function PaymentMethods() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        <span>{t("landing.pricing.billing.paymentMethods")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
          Stripe
        </Badge>
        <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
          Apple Pay
        </Badge>
        <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
          Google Pay
        </Badge>
      </div>
    </div>
  );
}
