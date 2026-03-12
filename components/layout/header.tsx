"use client";

import { usePathname } from "next/navigation";
import { Input } from "@/components/ui";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import type { TranslationKey } from "@/lib/i18n";

const pageTitleKeys: Record<string, TranslationKey> = {
  "/dashboard": "header.dashboard",
  "/projects": "header.projects",
  "/entities": "header.entities",
  "/topics": "header.topics",
  "/research": "header.research",
  "/briefs": "header.briefs",
  "/content": "header.content",
  "/approvals": "header.approvals",
  "/publish": "header.publish",
  "/reports": "header.reports",
  "/monitoring": "header.monitoring",
  "/compliance": "header.compliance",
  "/channels": "header.channels",
  "/jobs": "header.jobs",
  "/audit-logs": "header.auditLogs",
  "/settings": "header.settings",
};

export function Header() {
  const pathname = usePathname();
  const t = useT();
  const titleKey = Object.entries(pageTitleKeys).find(([path]) => pathname?.startsWith(path))?.[1];
  const title = titleKey ? t(titleKey) : "PresenceVision";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-8 w-56 pl-8 text-xs" placeholder={t("common.search")} />
        </div>
      </div>
    </header>
  );
}
