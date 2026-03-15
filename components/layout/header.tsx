"use client";

import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { useState, useEffect } from "react";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
      </div>
    </header>
  );
}
