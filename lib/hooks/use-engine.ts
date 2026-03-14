"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getActivities,
  getStats,
  activitiesToExecutions,
  activitiesToTaskActivities,
  connectActivityStream,
} from "@/lib/engine-client";
import type { TaskExecution, TaskActivity } from "@/lib/store";

interface EngineStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  byCountry: Record<string, number>;
  byMethod: Record<string, number>;
  totalDurationMs: number;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface UseEngineResult {
  executions: TaskExecution[];
  activities: TaskActivity[];
  stats: EngineStats | null;
  isLive: boolean;
  lastUpdated: Date | null;
  error: string | null;
  connectionStatus: ConnectionStatus;
  refresh: () => void;
}

/**
 * エンジンのリアルタイムアクティビティを取得するフック
 *
 * SSE（Server-Sent Events）を優先し、接続失敗時はポーリングにフォールバック。
 *
 * @param projectId - 監視するプロジェクトID
 * @param enabled - 監視を有効にするか
 * @param intervalMs - フォールバック時のポーリング間隔（デフォルト: 5秒）
 */
export function useEngineActivities(
  projectId: string | undefined,
  enabled = true,
  intervalMs = 5000,
): UseEngineResult {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseCloseRef = useRef<(() => void) | null>(null);
  const usingSSERef = useRef(false);

  // -----------------------------------------------------------------------
  // Fetch full data (used for initial load + polling fallback)
  // -----------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      const [activitiesRes, statsRes] = await Promise.all([
        getActivities(projectId, 100),
        getStats(projectId),
      ]);

      if (activitiesRes.activities && activitiesRes.activities.length > 0) {
        setExecutions(activitiesToExecutions(activitiesRes.activities));
        setActivities(activitiesToTaskActivities(activitiesRes.activities));
        setIsLive(true);
      }

      setStats(statsRes);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      // Engine not running yet — not an error, just means no live data
      setIsLive(false);
      setError(null);
    }
  }, [projectId]);

  // -----------------------------------------------------------------------
  // Start polling fallback
  // -----------------------------------------------------------------------
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // already polling
    intervalRef.current = setInterval(fetchData, intervalMs);
  }, [fetchData, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // SSE connection (primary) with polling fallback
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !projectId) {
      setConnectionStatus("disconnected");
      return;
    }

    // Always do an initial full fetch
    fetchData();

    // Try SSE first
    setConnectionStatus("connecting");

    const closeSSE = connectActivityStream(
      projectId,
      // onActivity — incremental update
      (activity) => {
        setActivities((prev) => {
          const mapped = activitiesToTaskActivities([activity]);
          return [...mapped, ...prev].slice(0, 200);
        });
        setExecutions((prev) => {
          const mapped = activitiesToExecutions([activity]);
          return [...mapped, ...prev].slice(0, 200);
        });
        setLastUpdated(new Date());
        setIsLive(true);
      },
      // onError — fall back to polling
      () => {
        usingSSERef.current = false;
        setConnectionStatus("disconnected");
        setIsLive(false);
        // Start polling as fallback
        startPolling();
      },
      // onOpen — SSE connected
      () => {
        usingSSERef.current = true;
        setConnectionStatus("connected");
        setIsLive(true);
        // Stop polling if it was running
        stopPolling();
      },
    );

    sseCloseRef.current = closeSSE;

    // If SSE doesn't connect within 3 seconds, start polling as fallback
    const fallbackTimer = setTimeout(() => {
      if (!usingSSERef.current) {
        startPolling();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      closeSSE();
      sseCloseRef.current = null;
      usingSSERef.current = false;
      stopPolling();
    };
  }, [enabled, projectId, fetchData, startPolling, stopPolling]);

  return {
    executions,
    activities,
    stats,
    isLive,
    lastUpdated,
    error,
    connectionStatus,
    refresh: fetchData,
  };
}
