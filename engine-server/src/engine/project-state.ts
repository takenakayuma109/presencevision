/**
 * Project State Manager — キーワードキュー・公開コンテンツ追跡
 *
 * プロジェクトごとのインメモリ状態管理。
 * 発見キーワードのキュー、処理済みトラッキング、公開コンテンツ記録。
 */

import type { DiscoveredKeyword } from "./tasks/keyword-discoverer.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishedContentRecord {
  keyword: string;
  url: string;
  publishedAt: Date;
  language: string;
}

interface DailyCounter {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ProjectContentState {
  discoveredKeywords: DiscoveredKeyword[];
  processedKeywords: Set<string>;
  publishedContent: PublishedContentRecord[];
  lastDiscoveryAt: Date | null;
  cycleCount: number;
  /** コンテンツ生成を1日N回に制限するための日次カウンタ（コスト制御） */
  dailyContentRuns: DailyCounter;
  /** Opus(pillar)生成を1日N本に制限するための日次カウンタ（コスト制御） */
  dailyPillars: DailyCounter;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// In-memory state store
// ---------------------------------------------------------------------------

const projectStates = new Map<string, ProjectContentState>();

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Get or create project state.
 */
export function getProjectState(projectId: string): ProjectContentState {
  let state = projectStates.get(projectId);
  if (!state) {
    state = {
      discoveredKeywords: [],
      processedKeywords: new Set<string>(),
      publishedContent: [],
      lastDiscoveryAt: null,
      cycleCount: 0,
      dailyContentRuns: { date: todayStr(), count: 0 },
      dailyPillars: { date: todayStr(), count: 0 },
    };
    projectStates.set(projectId, state);
  }
  return state;
}

/**
 * Get the next batch of unprocessed keywords from the queue.
 */
export function getNextKeywordBatch(
  projectId: string,
  batchSize: number,
): DiscoveredKeyword[] {
  const state = getProjectState(projectId);
  const unprocessed = state.discoveredKeywords.filter(
    (kw) => !state.processedKeywords.has(kw.keyword.toLowerCase()),
  );
  return unprocessed.slice(0, batchSize);
}

/**
 * Mark a keyword as processed (content generated).
 */
export function markKeywordProcessed(
  projectId: string,
  keyword: string,
): void {
  const state = getProjectState(projectId);
  state.processedKeywords.add(keyword.toLowerCase());
}

/**
 * 戦略調整による再投入: 処理済みフラグを外し、キューに無ければ追加する。
 * 順位が落ちた/あと一歩のキーワードを次サイクルで再生成（re-optimize/prioritize/expand）するため。
 */
export function requeueKeyword(
  projectId: string,
  keyword: string,
  meta?: { language?: string; country?: string },
): void {
  const state = getProjectState(projectId);
  state.processedKeywords.delete(keyword.toLowerCase());
  const exists = state.discoveredKeywords.some(
    (k) => k.keyword.toLowerCase() === keyword.toLowerCase(),
  );
  if (!exists) {
    state.discoveredKeywords.push({
      keyword,
      source: "llm_expansion",
      intent: "informational",
      language: meta?.language ?? "ja",
      country: meta?.country ?? "JP",
      parentKeyword: keyword,
    });
  }
}

/**
 * Add discovered keywords to the project queue (deduplicates).
 */
export function addDiscoveredKeywords(
  projectId: string,
  keywords: DiscoveredKeyword[],
): number {
  const state = getProjectState(projectId);
  const existingSet = new Set(
    state.discoveredKeywords.map((k) => k.keyword.toLowerCase()),
  );

  let added = 0;
  for (const kw of keywords) {
    const normalized = kw.keyword.toLowerCase();
    if (!existingSet.has(normalized)) {
      state.discoveredKeywords.push(kw);
      existingSet.add(normalized);
      added++;
    }
  }

  state.lastDiscoveryAt = new Date();
  return added;
}

/**
 * Record published content.
 */
export function addPublishedContent(
  projectId: string,
  content: PublishedContentRecord,
): void {
  const state = getProjectState(projectId);
  state.publishedContent.push(content);
}

/**
 * Determine if keyword discovery should run based on cycle interval.
 * Returns true if discovery has never run or enough cycles have passed.
 */
export function shouldRunDiscovery(
  projectId: string,
  intervalCycles: number,
): boolean {
  const state = getProjectState(projectId);

  // Never run before
  if (state.lastDiscoveryAt === null) return true;

  // Check if enough cycles have elapsed
  return state.cycleCount % intervalCycles === 0;
}

/**
 * Increment the cycle counter for this project.
 */
export function incrementCycleCount(projectId: string): number {
  const state = getProjectState(projectId);
  state.cycleCount++;
  return state.cycleCount;
}

// ---------------------------------------------------------------------------
// 日次の生成制限（コスト制御）
// ---------------------------------------------------------------------------

/** 今日まだコンテンツ生成サイクルを実行できるか（1日 maxPerDay 回まで） */
export function canGenerateContent(projectId: string, maxPerDay: number): boolean {
  const state = getProjectState(projectId);
  if (state.dailyContentRuns.date !== todayStr()) return true;
  return state.dailyContentRuns.count < maxPerDay;
}

/** コンテンツ生成サイクルを1回消費する */
export function recordContentRun(projectId: string): void {
  const state = getProjectState(projectId);
  const d = todayStr();
  if (state.dailyContentRuns.date !== d) state.dailyContentRuns = { date: d, count: 0 };
  state.dailyContentRuns.count++;
}

/** 今日まだ pillar(Opus) を生成できるか（1日 maxPerDay 本まで） */
export function canGeneratePillar(projectId: string, maxPerDay: number): boolean {
  const state = getProjectState(projectId);
  if (state.dailyPillars.date !== todayStr()) return true;
  return state.dailyPillars.count < maxPerDay;
}

/** pillar(Opus) を1本消費する */
export function recordPillar(projectId: string): void {
  const state = getProjectState(projectId);
  const d = todayStr();
  if (state.dailyPillars.date !== d) state.dailyPillars = { date: d, count: 0 };
  state.dailyPillars.count++;
}

/**
 * Get summary statistics for a project's content pipeline.
 */
export function getProjectPipelineStats(projectId: string): {
  totalDiscovered: number;
  totalProcessed: number;
  totalPublished: number;
  queueRemaining: number;
  cycleCount: number;
  lastDiscoveryAt: Date | null;
} {
  const state = getProjectState(projectId);
  const queueRemaining = state.discoveredKeywords.filter(
    (kw) => !state.processedKeywords.has(kw.keyword.toLowerCase()),
  ).length;

  return {
    totalDiscovered: state.discoveredKeywords.length,
    totalProcessed: state.processedKeywords.size,
    totalPublished: state.publishedContent.length,
    queueRemaining,
    cycleCount: state.cycleCount,
    lastDiscoveryAt: state.lastDiscoveryAt,
  };
}

/**
 * Clear all state for a project (useful for testing / reset).
 */
export function clearProjectState(projectId: string): void {
  projectStates.delete(projectId);
}
