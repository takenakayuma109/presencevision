/**
 * Activity Logger — 全アクション・全結果をリアルタイム記録
 *
 * 何をしたか、いつ、どの国/言語で、結果はどうだったか。
 * これがPVの「エビデンス」の本体。
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db/index.js";

export type ActivityType =
  | "site_analysis"
  | "serp_check"
  | "llm_check"
  | "content_generation"
  | "content_distribution"
  | "schema_generation"
  | "schema_deployment"
  | "multilingual_expansion"
  | "faq_optimization"
  | "keyword_research"
  | "backlink_submission"
  | "directory_submission"
  | "social_posting"
  | "report_generation";

export type ActivityStatus = "running" | "completed" | "failed" | "skipped";

export interface ActivityArtifact {
  type: "screenshot" | "html" | "json" | "text" | "url" | "code";
  title: string;
  content: string;
  mimeType?: string;
}

export interface ActivityEntry {
  id: string;
  projectId: string;
  taskId: string;
  type: ActivityType;
  status: ActivityStatus;
  country: string;
  language: string;
  method: string;
  description: string;
  details?: Record<string, unknown>;
  artifacts: ActivityArtifact[];
  metrics?: Record<string, number>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

// インメモリストア（SSEリアルタイム配信用に維持）
const activityLog: ActivityEntry[] = [];
const listeners: Set<(entry: ActivityEntry) => void> = new Set();

// DB利用可否フラグ
let dbAvailable = false;
let dbWarningLogged = false;

export function setDBAvailable(available: boolean): void {
  dbAvailable = available;
}

// ---------------------------------------------------------------------------
// DB persistence helpers (non-blocking)
// ---------------------------------------------------------------------------

function persistToDB(entry: ActivityEntry): void {
  if (!dbAvailable) {
    if (!dbWarningLogged) {
      console.log("[DB] No DATABASE_URL, using in-memory only");
      dbWarningLogged = true;
    }
    return;
  }
  const db = getDB();
  db.query(
    `INSERT INTO activities (id, project_id, task_id, type, status, country, language, method, description, details, artifacts, metrics, error, started_at, completed_at, duration_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       details = EXCLUDED.details,
       artifacts = EXCLUDED.artifacts,
       metrics = EXCLUDED.metrics,
       error = EXCLUDED.error,
       completed_at = EXCLUDED.completed_at,
       duration_ms = EXCLUDED.duration_ms`,
    [
      entry.id,
      entry.projectId,
      entry.taskId,
      entry.type,
      entry.status,
      entry.country,
      entry.language,
      entry.method,
      entry.description,
      entry.details ? JSON.stringify(entry.details) : null,
      JSON.stringify(entry.artifacts),
      entry.metrics ? JSON.stringify(entry.metrics) : null,
      entry.error ?? null,
      entry.startedAt.toISOString(),
      entry.completedAt?.toISOString() ?? null,
      entry.durationMs ?? null,
    ],
  ).catch((err) => {
    console.error("[DB] Failed to persist activity:", err.message);
  });
}

function rowToEntry(row: Record<string, unknown>): ActivityEntry {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    taskId: row.task_id as string,
    type: row.type as ActivityType,
    status: row.status as ActivityStatus,
    country: row.country as string,
    language: row.language as string,
    method: row.method as string,
    description: row.description as string,
    details: row.details as Record<string, unknown> | undefined,
    artifacts: (row.artifacts as ActivityArtifact[]) ?? [],
    metrics: row.metrics as Record<string, number> | undefined,
    error: row.error as string | undefined,
    startedAt: new Date(row.started_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    durationMs: row.duration_ms as number | undefined,
  };
}

export async function loadActivities(projectId: string): Promise<ActivityEntry[]> {
  if (!dbAvailable) return [];
  const db = getDB();
  const { rows } = await db.query(
    "SELECT * FROM activities WHERE project_id = $1 ORDER BY started_at DESC",
    [projectId],
  );
  return rows.map(rowToEntry);
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

export function startActivity(params: {
  projectId: string;
  taskId: string;
  type: ActivityType;
  country: string;
  language: string;
  method: string;
  description: string;
}): ActivityEntry {
  const entry: ActivityEntry = {
    id: uuidv4(),
    ...params,
    status: "running",
    artifacts: [],
    startedAt: new Date(),
  };
  activityLog.push(entry);
  notifyListeners(entry);
  persistToDB(entry);
  return entry;
}

export function completeActivity(
  id: string,
  result: {
    artifacts?: ActivityArtifact[];
    metrics?: Record<string, number>;
    details?: Record<string, unknown>;
  },
): ActivityEntry | null {
  const entry = activityLog.find((e) => e.id === id);
  if (!entry) return null;

  entry.status = "completed";
  entry.completedAt = new Date();
  entry.durationMs = entry.completedAt.getTime() - entry.startedAt.getTime();
  if (result.artifacts) entry.artifacts.push(...result.artifacts);
  if (result.metrics) entry.metrics = { ...entry.metrics, ...result.metrics };
  if (result.details) entry.details = { ...entry.details, ...result.details };

  notifyListeners(entry);
  persistToDB(entry);
  return entry;
}

export function failActivity(id: string, error: string): ActivityEntry | null {
  const entry = activityLog.find((e) => e.id === id);
  if (!entry) return null;

  entry.status = "failed";
  entry.error = error;
  entry.completedAt = new Date();
  entry.durationMs = entry.completedAt.getTime() - entry.startedAt.getTime();

  notifyListeners(entry);
  persistToDB(entry);
  return entry;
}

export function addArtifact(id: string, artifact: ActivityArtifact): void {
  const entry = activityLog.find((e) => e.id === id);
  if (entry) {
    entry.artifacts.push(artifact);
    notifyListeners(entry);
    persistToDB(entry);
  }
}

export async function getActivities(projectId: string, options?: {
  limit?: number;
  taskId?: string;
  type?: ActivityType;
  country?: string;
  status?: ActivityStatus;
}): Promise<ActivityEntry[]> {
  // Try in-memory first
  let result = activityLog.filter((e) => e.projectId === projectId);

  // If in-memory is empty for this project, try loading from DB
  if (result.length === 0 && dbAvailable) {
    try {
      result = await loadActivities(projectId);
    } catch (err) {
      console.error("[DB] Failed to load activities:", (err as Error).message);
    }
  }

  if (options?.taskId) result = result.filter((e) => e.taskId === options.taskId);
  if (options?.type) result = result.filter((e) => e.type === options.type);
  if (options?.country) result = result.filter((e) => e.country === options.country);
  if (options?.status) result = result.filter((e) => e.status === options.status);

  result.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  if (options?.limit) result = result.slice(0, options.limit);
  return result;
}

export async function getActivityStats(projectId: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  running: number;
  byCountry: Record<string, number>;
  byMethod: Record<string, number>;
  totalDurationMs: number;
}> {
  let entries = activityLog.filter((e) => e.projectId === projectId);

  // If in-memory is empty for this project, try loading from DB
  if (entries.length === 0 && dbAvailable) {
    try {
      entries = await loadActivities(projectId);
    } catch (err) {
      console.error("[DB] Failed to load activities for stats:", (err as Error).message);
    }
  }

  const stats = {
    total: entries.length,
    completed: 0,
    failed: 0,
    running: 0,
    byCountry: {} as Record<string, number>,
    byMethod: {} as Record<string, number>,
    totalDurationMs: 0,
  };

  for (const e of entries) {
    if (e.status === "completed") stats.completed++;
    else if (e.status === "failed") stats.failed++;
    else if (e.status === "running") stats.running++;

    stats.byCountry[e.country] = (stats.byCountry[e.country] ?? 0) + 1;
    stats.byMethod[e.method] = (stats.byMethod[e.method] ?? 0) + 1;
    stats.totalDurationMs += e.durationMs ?? 0;
  }

  return stats;
}

// リアルタイム通知用
export function onActivity(listener: (entry: ActivityEntry) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(entry: ActivityEntry): void {
  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {
      // リスナーエラーは無視
    }
  }
}
