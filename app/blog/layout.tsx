"use client";

import { useEffect } from "react";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force light mode for public blog pages
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");

    return () => {
      if (wasDark) {
        html.classList.add("dark");
      }
    };
  }, []);

  return <>{children}</>;
}
