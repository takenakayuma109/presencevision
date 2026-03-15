"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { LanguageSwitch } from "@/components/ui/language-switch";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.projects"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.reports"), href: "/reports", icon: BarChart3 },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-card transition-transform duration-200",
          // Desktop: always visible
          "md:translate-x-0",
          // Mobile: off-screen by default, slide in when open
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1" onClick={onClose}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-bold">
              PV
            </div>
            <span className="text-sm font-semibold tracking-tight">PresenceVision</span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname?.startsWith("/projects/"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t p-3 space-y-2">
          <LanguageSwitch />
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{t("common.myWorkspace")}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
