"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Sun, Moon, Settings, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { useThemeStore } from "@/lib/store/theme";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { dark, toggleTheme } = useThemeStore();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitles: Record<string, string> = {
    "/dashboard": t("nav.projects"),
    "/reports": t("nav.reports"),
    "/settings": t("nav.settings"),
  };

  let title = "PresenceVision";
  if (pathname?.startsWith("/projects/")) {
    title = t("header.projectDetail");
  } else {
    title = Object.entries(pageTitles).find(([path]) => pathname?.startsWith(path))?.[1] ?? "PresenceVision";
  }

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const initial = (session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        onClick={onMenuClick}
        className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <LanguageSwitch position="bottom" />
        <button
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {session?.user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-primary/50"
            >
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initial}
                </div>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-background shadow-lg">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-medium">{session.user.name || "ユーザー"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    アカウント設定
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                    onClick={() => setShowMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    ダッシュボード
                  </Link>
                </div>
                <div className="border-t py-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
