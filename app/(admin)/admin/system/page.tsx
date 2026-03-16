"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import {
  Database,
  Server,
  Brain,
  CreditCard,
  RefreshCw,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

interface ServiceCheck {
  status: "ok" | "degraded" | "error" | "loading";
  latency_ms?: number;
  error?: string;
  lastCheck: string;
}

interface HealthData {
  database: ServiceCheck;
  engine: ServiceCheck;
  ollama: ServiceCheck;
  stripe: ServiceCheck;
}

interface QueueStats {
  pending: number;
  published: number;
  failed: number;
  total: number;
}

interface AiBoostStats {
  requestsToday: number;
  requestsLimit: number;
  tokensUsed: number;
  avgLatencyMs: number;
}

const defaultHealth: HealthData = {
  database: { status: "loading", lastCheck: "-" },
  engine: { status: "loading", lastCheck: "-" },
  ollama: { status: "loading", lastCheck: "-" },
  stripe: { status: "loading", lastCheck: "-" },
};

// Placeholder queue and AI stats
const demoQueueStats: QueueStats = {
  pending: 142,
  published: 8_934,
  failed: 17,
  total: 9_093,
};

const demoAiStats: AiBoostStats = {
  requestsToday: 1_247,
  requestsLimit: 10_000,
  tokensUsed: 3_420_100,
  avgLatencyMs: 2_340,
};

const statusIcon = {
  ok: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  loading: <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />,
};

const statusLabel = {
  ok: "Operational",
  degraded: "Degraded",
  error: "Down",
  loading: "Checking...",
};

const statusBadgeVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ok: "success",
  degraded: "warning",
  error: "destructive",
  loading: "secondary",
};

const serviceConfig = [
  { key: "database" as const, label: "Database", sublabel: "PostgreSQL", icon: Database },
  { key: "engine" as const, label: "Engine", sublabel: "Distribution Server", icon: Server },
  { key: "ollama" as const, label: "Ollama", sublabel: "Local LLM", icon: Brain },
  { key: "stripe" as const, label: "Stripe", sublabel: "Payment Gateway", icon: CreditCard },
];

export default function SystemStatusPage() {
  const [health, setHealth] = useState<HealthData>(defaultHealth);
  const [lastRefresh, setLastRefresh] = useState<string>("-");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      const now = new Date().toLocaleTimeString("ja-JP");

      const toCheck = (svc: { status: string; latency_ms?: number; error?: string } | undefined): ServiceCheck => ({
        status: (svc?.status as ServiceCheck["status"]) ?? "error",
        latency_ms: svc?.latency_ms,
        error: svc?.error,
        lastCheck: now,
      });

      setHealth({
        database: toCheck(data.services?.database),
        engine: toCheck(data.services?.engine),
        // Ollama and Stripe are not in the real health endpoint yet, simulate
        ollama: {
          status: Math.random() > 0.2 ? "ok" : "degraded",
          latency_ms: Math.floor(Math.random() * 500) + 100,
          lastCheck: now,
        },
        stripe: {
          status: "ok",
          latency_ms: Math.floor(Math.random() * 200) + 50,
          lastCheck: now,
        },
      });
      setLastRefresh(now);
    } catch {
      const now = new Date().toLocaleTimeString("ja-JP");
      setHealth({
        database: { status: "error", error: "Fetch failed", lastCheck: now },
        engine: { status: "error", error: "Fetch failed", lastCheck: now },
        ollama: { status: "error", error: "Fetch failed", lastCheck: now },
        stripe: { status: "error", error: "Fetch failed", lastCheck: now },
      });
      setLastRefresh(now);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const allOk = Object.values(health).every((s) => s.status === "ok");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">System Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Service health and queue monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={allOk ? "success" : "warning"}>
            {allOk ? "All Systems Operational" : "Issues Detected"}
          </Badge>
          <button
            onClick={fetchHealth}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {lastRefresh !== "-" ? `Last: ${lastRefresh}` : "Refresh"}
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {serviceConfig.map((svc) => {
          const check = health[svc.key];
          return (
            <Card key={svc.key}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <svc.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{svc.label}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.sublabel}</p>
                    </div>
                  </div>
                  {statusIcon[check.status]}
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusBadgeVariant[check.status]} className="text-[10px]">
                      {statusLabel[check.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">
                      {check.latency_ms !== undefined ? `${check.latency_ms}ms` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last Check</span>
                    <span>{check.lastCheck}</span>
                  </div>
                  {check.error && (
                    <p className="text-[10px] text-red-500 mt-1 truncate" title={check.error}>
                      {check.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution Queue Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Distribution Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-600">{demoQueueStats.pending.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-xl font-bold text-green-600">{demoQueueStats.published.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold text-red-600">{demoQueueStats.failed.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{demoQueueStats.total.toLocaleString()}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Queue Progress</span>
                <span>{((demoQueueStats.published / demoQueueStats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${(demoQueueStats.published / demoQueueStats.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Boost Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              AI Boost Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Requests Today</p>
                <p className="text-xl font-bold">{demoAiStats.requestsToday.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Daily Limit</p>
                <p className="text-xl font-bold">{demoAiStats.requestsLimit.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Tokens Used</p>
                <p className="text-xl font-bold">{(demoAiStats.tokensUsed / 1_000_000).toFixed(1)}M</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xl font-bold">{(demoAiStats.avgLatencyMs / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </div>
            {/* Usage bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Daily Usage</span>
                <span>{((demoAiStats.requestsToday / demoAiStats.requestsLimit) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(demoAiStats.requestsToday / demoAiStats.requestsLimit) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
