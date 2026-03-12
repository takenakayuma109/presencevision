"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 pl-[var(--sidebar-width)]">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
