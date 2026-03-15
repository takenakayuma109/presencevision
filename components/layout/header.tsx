"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "プロジェクト",
  "/reports": "レポート",
  "/settings": "設定",
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  let title = "PresenceVision";
  if (pathname?.startsWith("/projects/")) {
    title = "プロジェクト詳細";
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
    </header>
  );
}
