/**
 * Activity Logger — 全アクション・全結果をリアルタイム記録
 *
 * 何をしたか、いつ、どの国/言語で、結果はどうだったか。
 * これがPVの「エビデンス」の本体。
 */

import { v4 as uuidv4 } from "uuid";

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

// インメモリストア（後でDB移行）
const activityLog: ActivityEntry[] = [];
const listeners: Set<(entry: ActivityEntry) => void> = new Set();

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
  return entry;
}

export function addArtifact(id: string, artifact: ActivityArtifact): void {
  const entry = activityLog.find((e) => e.id === id);
  if (entry) {
    entry.artifacts.push(artifact);
    notifyListeners(entry);
  }
}

export function getActivities(projectId: string, options?: {
  limit?: number;
  taskId?: string;
  type?: ActivityType;
  country?: string;
  status?: ActivityStatus;
}): ActivityEntry[] {
  let result = activityLog.filter((e) => e.projectId === projectId);

  if (options?.taskId) result = result.filter((e) => e.taskId === options.taskId);
  if (options?.type) result = result.filter((e) => e.type === options.type);
  if (options?.country) result = result.filter((e) => e.country === options.country);
  if (options?.status) result = result.filter((e) => e.status === options.status);

  result.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  if (options?.limit) result = result.slice(0, options.limit);
  return result;
}

export function getActivityStats(projectId: string): {
  total: number;
  completed: number;
  failed: number;
  running: number;
  byCountry: Record<string, number>;
  byMethod: Record<string, number>;
  totalDurationMs: number;
} {
  const entries = activityLog.filter((e) => e.projectId === projectId);
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
