"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  DollarSign,
  ArrowRight,
  Activity,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  pendingReviews: number;
  mrr: number;
  activeSubscriptions: number;
}

function formatJPY(amount: number): string {
  return `\u00a5${amount.toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users },
        { title: "Active Projects", value: stats.totalProjects.toLocaleString(), icon: FolderOpen },
        { title: "Pending Reviews", value: stats.pendingReviews.toLocaleString(), icon: ClipboardCheck },
        { title: "Revenue (MRR)", value: formatJPY(stats.mrr), icon: DollarSign },
      ]
    : [];

  const quickLinks = [
    {
      title: "Content Reviews",
      description: "Review pending content approvals",
      href: "/admin/content",
      count: stats?.pendingReviews,
    },
    {
      title: "User Management",
      description: "Manage users and subscriptions",
      href: "/admin/users",
      count: stats?.totalUsers,
    },
    {
      title: "System Status",
      description: "Monitor service health and queues",
      href: "/admin/system",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System overview and quick actions
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading stats...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-red-600">
            Failed to load stats: {error}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Links
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{link.title}</p>
                        {link.count !== undefined && (
                          <Badge variant="secondary" className="text-[10px]">
                            {link.count.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
