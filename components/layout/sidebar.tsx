"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  CreditCard,
  Share2,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Building2,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import { useState, useEffect, useCallback } from "react";

interface SidebarProject {
  id: string;
  name: string;
  status: string;
}

const projectSubNav = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { key: "content", label: "コンテンツ", icon: FileText },
  { key: "reports", label: "レポート", icon: BarChart3 },
  { key: "channels", label: "チャネル", icon: Share2 },
  { key: "settings", label: "設定", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<SidebarProject[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch projects for sidebar
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.map((p: any) => ({ id: p.id, name: p.name, status: p.status })));
    } catch {
      // silently fail – sidebar still usable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-expand the project that matches the current route
  useEffect(() => {
    const match = pathname?.match(/^\/projects\/([^/]+)/);
    if (match) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(match[1]);
        return next;
      });
    }
  }, [pathname]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Determine active project id and sub-page from pathname
  const activeProjectId = pathname?.match(/^\/projects\/([^/]+)/)?.[1] ?? null;
  const activeSubPage = pathname?.match(/^\/projects\/[^/]+\/([^/]+)/)?.[1] ?? null;

  const workspaceItems = [
    { label: "企業登録", href: "/company-registration", icon: Building2 },
    { label: "請求管理", href: "/billing", icon: CreditCard },
    { label: "ワークスペース設定", href: "/settings", icon: Settings },
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
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/" className="flex items-center gap-2.5 flex-1" onClick={onClose}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
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

        {/* Scrollable nav area */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Projects list link */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            プロジェクト一覧
          </Link>

          {/* Divider */}
          <div className="my-3 border-t" />

          {/* Project list */}
          {loading ? (
            <div className="space-y-2 px-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">プロジェクトがありません</p>
          ) : (
            <ul className="space-y-0.5">
              {projects.map((project) => {
                const isExpanded = expandedIds.has(project.id);
                const isActiveProject = activeProjectId === project.id;

                return (
                  <li key={project.id}>
                    {/* Project header – click to toggle */}
                    <button
                      onClick={() => toggleExpand(project.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                        isActiveProject
                          ? "text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{project.name}</span>
                    </button>

                    {/* Sub-navigation */}
                    {isExpanded && (
                      <ul className="ml-5 mt-0.5 space-y-0.5 border-l pl-3">
                        {projectSubNav.map((sub) => {
                          const href = `/projects/${project.id}/${sub.key}`;
                          const isActive =
                            isActiveProject && activeSubPage === sub.key;
                          const Icon = sub.icon;
                          return (
                            <li key={sub.key}>
                              <Link
                                href={href}
                                onClick={onClose}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                                  isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                )}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Divider */}
          <div className="my-3 border-t" />

          {/* Workspace-level items */}
          <ul className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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

        {/* Bottom workspace info */}
        <div className="border-t p-3 space-y-2">
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
