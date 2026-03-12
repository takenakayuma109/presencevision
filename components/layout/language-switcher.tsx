"use client";

import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title={t("lang.label")}
    >
      <Globe className="h-3.5 w-3.5" />
      {t("lang.switch")}
    </button>
  );
}
