"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import {
  LayoutDashboard,
  FolderKanban,
  Box,
  FileText,
  PenTool,
  CheckCircle2,
  Send,
  BarChart3,
  Eye,
  Shield,
  Radio,
  Settings,
  ScrollText,
  Zap,
  Search,
  CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navItems: { labelKey: TranslationKey; href: string; icon: LucideIcon }[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.projects", href: "/projects", icon: FolderKanban },
  { labelKey: "nav.entities", href: "/entities", icon: Box },
  { labelKey: "nav.topics", href: "/topics", icon: FileText },
  { labelKey: "nav.research", href: "/research", icon: Search },
  { labelKey: "nav.calendar", href: "/briefs", icon: CalendarDays },
  { labelKey: "nav.contentStudio", href: "/content", icon: PenTool },
  { labelKey: "nav.approvals", href: "/approvals", icon: CheckCircle2 },
  { labelKey: "nav.publish", href: "/publish", icon: Send },
  { labelKey: "nav.reports", href: "/reports", icon: BarChart3 },
  { labelKey: "nav.monitoring", href: "/monitoring", icon: Eye },
  { labelKey: "nav.compliance", href: "/compliance", icon: Shield },
  { labelKey: "nav.channels", href: "/channels", icon: Radio },
  { labelKey: "nav.jobs", href: "/jobs", icon: Zap },
  { labelKey: "nav.auditLogs", href: "/audit-logs", icon: ScrollText },
  { labelKey: "nav.settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-bold">
            PV
          </div>
          <span className="text-sm font-semibold tracking-tight">PresenceVision</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
          <div className="h-7 w-7 rounded-full bg-muted" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{t("common.demoWorkspace")}</p>
            <p className="text-xs text-muted-foreground truncate">admin@presencevision.dev</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
