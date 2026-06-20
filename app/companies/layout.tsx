"use client";

import { useEffect } from "react";

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force light mode for knowledge base pages
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");

    return () => {
      // Restore previous theme when leaving
      if (wasDark) {
        html.classList.add("dark");
      }
    };
  }, []);

  return <>{children}</>;
}
