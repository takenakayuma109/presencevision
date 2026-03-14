"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "プロジェクト", href: "/dashboard", icon: LayoutDashboard },
  { label: "レポート", href: "/reports", icon: BarChart3 },
  { label: "設定", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname?.startsWith("/projects/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">マイワークスペース</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
