"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "プロジェクト",
  "/reports": "レポート",
  "/settings": "設定",
};

export function Header() {
  const pathname = usePathname();

  let title = "PresenceVision";
  if (pathname?.startsWith("/projects/")) {
    title = "プロジェクト詳細";
  } else {
    title = Object.entries(pageTitles).find(([path]) => pathname?.startsWith(path))?.[1] ?? "PresenceVision";
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}
