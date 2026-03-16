"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "@/components/ui";
import { Search, ChevronLeft, Mail, Calendar, FolderOpen, CreditCard } from "lucide-react";

type Plan = "free" | "starter" | "pro" | "enterprise";
type UserStatus = "active" | "suspended" | "trial";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  status: UserStatus;
  projectsCount: number;
  createdAt: string;
  lastLogin: string;
  revenue: string;
}

const demoUsers: UserRecord[] = [
  { id: "u1", name: "田中太郎", email: "tanaka@abc-corp.jp", plan: "pro", status: "active", projectsCount: 5, createdAt: "2025-11-02", lastLogin: "2026-03-17", revenue: "¥9,800/mo" },
  { id: "u2", name: "佐藤花子", email: "sato@example.com", plan: "starter", status: "active", projectsCount: 2, createdAt: "2026-01-15", lastLogin: "2026-03-16", revenue: "¥4,980/mo" },
  { id: "u3", name: "John Smith", email: "john@xyz-tech.com", plan: "enterprise", status: "active", projectsCount: 12, createdAt: "2025-09-20", lastLogin: "2026-03-17", revenue: "¥49,800/mo" },
  { id: "u4", name: "山田一郎", email: "yamada@shop.jp", plan: "free", status: "trial", projectsCount: 1, createdAt: "2026-03-10", lastLogin: "2026-03-15", revenue: "¥0" },
  { id: "u5", name: "鈴木次郎", email: "suzuki@design.co.jp", plan: "pro", status: "active", projectsCount: 3, createdAt: "2025-12-01", lastLogin: "2026-03-14", revenue: "¥9,800/mo" },
  { id: "u6", name: "Emily Chen", email: "emily@startup.io", plan: "starter", status: "active", projectsCount: 2, createdAt: "2026-02-05", lastLogin: "2026-03-13", revenue: "¥4,980/mo" },
  { id: "u7", name: "高橋美咲", email: "takahashi@corp.co.jp", plan: "pro", status: "suspended", projectsCount: 4, createdAt: "2025-10-15", lastLogin: "2026-02-28", revenue: "¥9,800/mo" },
  { id: "u8", name: "渡辺健", email: "watanabe@tech.jp", plan: "free", status: "trial", projectsCount: 1, createdAt: "2026-03-12", lastLogin: "2026-03-16", revenue: "¥0" },
];

const planStyles: Record<Plan, string> = {
  free: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  starter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pro: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  enterprise: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const statusStyles: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const filtered = demoUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to users
        </button>

        <div>
          <h1 className="text-2xl font-bold">{selectedUser.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedUser.email}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planStyles[selectedUser.plan]}`}>
                    {selectedUser.plan}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projects</p>
                  <p className="text-lg font-bold">{selectedUser.projectsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{selectedUser.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-sm font-bold">{selectedUser.revenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[selectedUser.status]}`}>
                    {selectedUser.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Login</dt>
                <dd className="mt-0.5 font-medium">{selectedUser.lastLogin}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-0.5 font-medium">{selectedUser.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="mt-0.5 font-mono text-xs">{selectedUser.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user accounts ({demoUsers.length} total)
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planStyles[user.plan]}`}>
                    {user.plan}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[user.status]}`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">{user.projectsCount}</TableCell>
                <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
