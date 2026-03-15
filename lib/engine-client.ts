/**
 * Engine Client — フロントエンドからPresence Engineを制御するAPI
 *
 * Next.js API Route (/api/engine/*) 経由でVPSエンジンにプロキシ。
 * これによりhttps→httpのMixed Content問題を回避。
 * Engine APIのレスポンスをUI型（PlanTask, TaskExecution等）に変換する。
 */

import type {
  PresenceMethod,
  TaskExecution,
  ExecutionArtifact,
  TaskActivity,
  ArtifactType,
} from "./store";

// ---------------------------------------------------------------------------
// Engine URL / Auth
// ---------------------------------------------------------------------------

export function getEngineBaseUrl(): string {
  // ブラウザからはNext.js API Routeプロキシ経由でアクセス
  if (typeof window !== "undefined") {
    return "/api/engine";
  }
  // サーバーサイドからは直接VPSにアクセス
  return (
    process.env.NEXT_PUBLIC_ENGINE_URL?.replace(/\/+$/, "") ??
    "http://localhost:4000"
  );
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // プロキシ経由の場合はAPI keyはサーバーサイドで付与されるので不要
  if (typeof window === "undefined") {
    const apiKey = process.env.NEXT_PUBLIC_ENGINE_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
  }
  return headers;
}

/** Wrapper around fetch that points at the engine and adds auth headers */
async function engineFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${getEngineBaseUrl()}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...getHeaders(), ...(init?.headers as Record<string, string>) },
    });
    if (!res.ok) {
      throw new Error(`Engine responded ${res.status}: ${res.statusText}`);
    }
    return res;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(
        `Engine is unreachable at ${getEngineBaseUrl()}. Is the server running?`,
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Engine API types
// ---------------------------------------------------------------------------
interface EngineActivity {
  id: string;
  projectId: string;
  taskId: string;
  type: string;
  status: "running" | "completed" | "failed" | "skipped";
  country: string;
  language: string;
  method: string;
  description: string;
  details?: Record<string, unknown>;
  artifacts: {
    type: "screenshot" | "html" | "json" | "text" | "url" | "code";
    title: string;
    content: string;
    mimeType?: string;
  }[];
  metrics?: Record<string, number>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

interface EngineStatus {
  running: number;
  projects: {
    id: string;
    name: string;
    targetUrl: string;
    status: string;
    countries: string[];
    methods: string[];
  }[];
}

interface EngineStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  byCountry: Record<string, number>;
  byMethod: Record<string, number>;
  totalDurationMs: number;
}

export interface EngineHealthResponse {
  status: "ok" | "degraded" | "error";
  version?: string;
  uptime?: number;
  ollama?: {
    connected: boolean;
    model?: string;
  };
  activeProjects?: number;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function startEngine(project: {
  id: string;
  name: string;
  url: string;
  brandName: string;
  keywords: string[];
  targetCountries: string[];
  methods: string[];
}): Promise<{ message: string; projectId: string }> {
  const res = await engineFetch("/engine/start", {
    method: "POST",
    body: JSON.stringify({
      project: {
        id: project.id,
        name: project.name,
        targetUrl: project.url,
        brandName: project.brandName,
        keywords: project.keywords,
        targetCountries: project.targetCountries,
        methods: mapMethodsToEngine(project.methods),
        status: "active",
        createdAt: new Date(),
      },
    }),
  });
  return res.json();
}

export async function stopEngine(projectId: string): Promise<void> {
  await engineFetch("/engine/stop", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export async function runCycle(project: {
  id: string;
  name: string;
  url: string;
  brandName: string;
  keywords: string[];
  targetCountries: string[];
  methods: string[];
}): Promise<unknown> {
  const res = await engineFetch("/engine/run-cycle", {
    method: "POST",
    body: JSON.stringify({
      project: {
        id: project.id,
        name: project.name,
        targetUrl: project.url,
        brandName: project.brandName,
        keywords: project.keywords,
        targetCountries: project.targetCountries,
        methods: mapMethodsToEngine(project.methods),
        status: "active",
        createdAt: new Date(),
      },
    }),
  });
  return res.json();
}

export async function getEngineStatus(): Promise<EngineStatus> {
  const res = await engineFetch("/engine/status");
  return res.json();
}

export async function getActivities(
  projectId: string,
  limit = 50,
): Promise<{ activities: EngineActivity[]; total: number }> {
  const res = await engineFetch(
    `/activities?projectId=${projectId}&limit=${limit}`,
  );
  return res.json();
}

export async function getStats(projectId: string): Promise<EngineStats> {
  const res = await engineFetch(
    `/activities/stats?projectId=${projectId}`,
  );
  return res.json();
}

export async function getEngineHealth(): Promise<EngineHealthResponse> {
  const res = await engineFetch("/health");
  return res.json();
}

// ---------------------------------------------------------------------------
// SSE — real-time activity stream
// ---------------------------------------------------------------------------

export type SSEActivityHandler = (activity: EngineActivity) => void;

/**
 * Open an SSE connection to the engine's activity stream.
 * Returns a close function to tear down the connection.
 */
export function connectActivityStream(
  projectId: string,
  onActivity: SSEActivityHandler,
  onError?: (err: Event) => void,
  onOpen?: () => void,
): () => void {
  const base = getEngineBaseUrl();
  // SSEはブラウザから直接接続。プロキシ経由の場合はプロキシURLを使う
  const sseBase = base.startsWith("/api/") ? base : base;
  const url = new URL(`${sseBase}/activities/stream`, window.location.origin);
  url.searchParams.set("projectId", projectId);

  const es = new EventSource(url.toString());

  es.onopen = () => {
    onOpen?.();
  };

  es.onmessage = (event) => {
    try {
      const activity = JSON.parse(event.data) as EngineActivity;
      onActivity(activity);
    } catch {
      // ignore parse errors on heartbeats / comments
    }
  };

  es.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    es.close();
  };
}

// ---------------------------------------------------------------------------
// Transform engine activities → UI types
// ---------------------------------------------------------------------------

function mapArtifactType(engineType: string): ArtifactType {
  const map: Record<string, ArtifactType> = {
    screenshot: "screenshot",
    html: "content",
    json: "data",
    text: "content",
    url: "link",
    code: "code",
  };
  return map[engineType] ?? "data";
}

function mapMethodFromEngine(engineMethod: string): PresenceMethod {
  const map: Record<string, PresenceMethod> = {
    SEO: "seo",
    AEO: "aeo",
    GEO: "geo",
    "Schema.org": "schema_markup",
    ContentMarketing: "content_marketing",
    KnowledgeGraph: "knowledge_graph",
    FAQ: "faq_optimization",
    Multilingual: "multilingual",
  };
  return map[engineMethod] ?? "seo";
}

function mapMethodsToEngine(uiMethods: string[]): string[] {
  const map: Record<string, string> = {
    seo: "SEO",
    aeo: "AEO",
    geo: "GEO",
    schema_markup: "Schema.org",
    content_marketing: "ContentMarketing",
    knowledge_graph: "KnowledgeGraph",
    faq_optimization: "FAQ",
    multilingual: "Multilingual",
  };
  return uiMethods.map((m) => map[m] ?? m);
}

export function activitiesToExecutions(
  activities: EngineActivity[],
): TaskExecution[] {
  // Group by taskId
  const byTask = new Map<string, EngineActivity[]>();
  for (const a of activities) {
    const list = byTask.get(a.taskId) ?? [];
    list.push(a);
    byTask.set(a.taskId, list);
  }

  const executions: TaskExecution[] = [];
  let cycleNum = 0;

  for (const [, taskActivities] of byTask) {
    cycleNum++;
    for (const act of taskActivities) {
      const artifacts: ExecutionArtifact[] = act.artifacts.map((a, i) => ({
        id: `${act.id}-art-${i}`,
        type: mapArtifactType(a.type),
        title: a.title,
        description: a.title,
        content: a.type !== "screenshot" ? a.content : undefined,
        thumbnailUrl:
          a.type === "screenshot"
            ? `data:image/png;base64,${a.content}`
            : undefined,
        url:
          a.type === "screenshot"
            ? `data:image/png;base64,${a.content}`
            : undefined,
      }));

      executions.push({
        id: act.id,
        cycleNumber: cycleNum,
        startedAt: new Date(act.startedAt),
        completedAt: act.completedAt
          ? new Date(act.completedAt)
          : new Date(),
        status: act.status === "completed" ? "success" : act.status === "failed" ? "error" : "partial",
        targetRegion: act.country,
        targetLanguage: act.language,
        actions: [act.description],
        results: act.error
          ? [`Error: ${act.error}`]
          : [`${act.type} completed`],
        metrics: act.metrics
          ? {
              itemsProcessed: act.metrics.itemsProcessed ?? 0,
              itemsGenerated: act.metrics.itemsGenerated ?? 0,
            }
          : undefined,
        artifacts,
      });
    }
  }

  return executions.sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime(),
  );
}

export function activitiesToTaskActivities(
  activities: EngineActivity[],
): TaskActivity[] {
  return activities.map((a) => ({
    timestamp: new Date(a.startedAt),
    message: a.description,
    type:
      a.status === "completed"
        ? "success"
        : a.status === "failed"
          ? "error"
          : a.status === "running"
            ? "info"
            : "warning",
  }));
}
