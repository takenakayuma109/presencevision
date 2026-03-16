"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  DollarSign,
  ArrowRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Total Users", value: "1,247", icon: Users, trend: "+12%", trendUp: true },
  { title: "Active Projects", value: "3,891", icon: FolderOpen, trend: "+8%", trendUp: true },
  { title: "Pending Reviews", value: "23", icon: ClipboardCheck, trend: "-5%", trendUp: false },
  { title: "Revenue (MRR)", value: "¥2,340,000", icon: DollarSign, trend: "+15%", trendUp: true },
];

const recentActivity = [
  { id: 1, action: "New user registered", detail: "tanaka@example.com", time: "3 minutes ago", type: "user" },
  { id: 2, action: "Entity verification submitted", detail: "株式会社ABC - abc-corp.jp", time: "15 minutes ago", type: "review" },
  { id: 3, action: "Plan upgraded", detail: "sato@example.com → Pro plan", time: "1 hour ago", type: "billing" },
  { id: 4, action: "Entity approved", detail: "XYZ Technologies - xyz-tech.com", time: "2 hours ago", type: "review" },
  { id: 5, action: "New project created", detail: "example-shop.jp by yamada@example.com", time: "3 hours ago", type: "project" },
  { id: 6, action: "Engine error reported", detail: "Ollama connection timeout", time: "5 hours ago", type: "system" },
];

const quickLinks = [
  { title: "Entity Reviews", description: "Review pending entity verifications", href: "/admin/reviews", count: 23 },
  { title: "User Management", description: "Manage users and subscriptions", href: "/admin/users", count: 1247 },
  { title: "System Status", description: "Monitor service health and queues", href: "/admin/system" },
];

const activityTypeStyles: Record<string, string> = {
  user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  billing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  project: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  system: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and recent activity</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className={`text-xs font-medium ${stat.trendUp ? "text-green-600" : "text-red-600"}`}>
                    {stat.trend} from last week
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${activityTypeStyles[item.type]}`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Links
          </h3>
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
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
