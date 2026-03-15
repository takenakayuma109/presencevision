/**
 * Content Strategy Adjuster — 順位データとOllamaで戦略を最適化
 *
 * 順位変動の分析に基づき、キーワードの優先度変更、
 * 再最適化、翻訳展開、拡張などのアクションを提案。
 */

import { getAIProvider } from "../../ai/provider.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";
import type { RankingRecord } from "./ranking-monitor.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StrategyAdjustment {
  action: "prioritize" | "re-optimize" | "translate" | "expand" | "deprioritize";
  keyword: string;
  reason: string;
  suggestedContent?: string;
}

export interface StrategyParams {
  projectId: string;
  taskId: string;
  rankingHistory: RankingRecord[];
  processedKeywords: string[];
  brandName: string;
  country: string;
  language: string;
}

// ---------------------------------------------------------------------------
// Rule-based analysis (before LLM)
// ---------------------------------------------------------------------------

interface KeywordAnalysis {
  keyword: string;
  latestPosition: number | null;
  previousPosition: number | null;
  delta: number;
  featuredSnippet: boolean;
  trend: "improving" | "declining" | "stable" | "new" | "lost";
  nearPageOne: boolean; // position 11-20 (page 2, close to page 1)
}

function analyzeRankings(records: RankingRecord[]): KeywordAnalysis[] {
  // Group by keyword (take latest record per keyword)
  const latestByKeyword = new Map<string, RankingRecord>();
  for (const record of records) {
    const existing = latestByKeyword.get(record.keyword);
    if (!existing || record.checkedAt > existing.checkedAt) {
      latestByKeyword.set(record.keyword, record);
    }
  }

  const analyses: KeywordAnalysis[] = [];

  for (const [keyword, record] of latestByKeyword) {
    let trend: KeywordAnalysis["trend"] = "stable";

    if (record.previousPosition === null && record.position !== null) {
      trend = "new";
    } else if (record.previousPosition !== null && record.position === null) {
      trend = "lost";
    } else if (record.delta > 0) {
      trend = "improving";
    } else if (record.delta < 0) {
      trend = "declining";
    }

    const nearPageOne =
      record.position !== null && record.position >= 11 && record.position <= 20;

    analyses.push({
      keyword,
      latestPosition: record.position,
      previousPosition: record.previousPosition,
      delta: record.delta,
      featuredSnippet: record.featuredSnippet,
      trend,
      nearPageOne,
    });
  }

  return analyses;
}

// ---------------------------------------------------------------------------
// Main: adjustStrategy
// ---------------------------------------------------------------------------

export async function adjustStrategy(params: StrategyParams): Promise<StrategyAdjustment[]> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "strategy_adjustment",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `戦略調整: ${params.rankingHistory.length}件の順位データ分析 (${params.country})`,
  });

  try {
    const analyses = analyzeRankings(params.rankingHistory);

    // Build rule-based adjustments first
    const ruleBasedAdjustments: StrategyAdjustment[] = [];

    for (const analysis of analyses) {
      // Keywords near page 1 (positions 11-20) → prioritize
      if (analysis.nearPageOne) {
        ruleBasedAdjustments.push({
          action: "prioritize",
          keyword: analysis.keyword,
          reason: `Position ${analysis.latestPosition} — close to page 1. Additional content could push to top 10.`,
        });
      }

      // Keywords that dropped significantly → re-optimize
      if (analysis.trend === "declining" && analysis.delta <= -3) {
        ruleBasedAdjustments.push({
          action: "re-optimize",
          keyword: analysis.keyword,
          reason: `Dropped ${Math.abs(analysis.delta)} positions (${analysis.previousPosition} → ${analysis.latestPosition}). Content needs refreshing.`,
        });
      }

      // Keywords that fell out of top 100 → re-optimize urgently
      if (analysis.trend === "lost") {
        ruleBasedAdjustments.push({
          action: "re-optimize",
          keyword: analysis.keyword,
          reason: `Lost from top 100 (was #${analysis.previousPosition}). Urgent re-optimization needed.`,
        });
      }

      // Keywords with featured snippet opportunity → expand with FAQ
      if (analysis.latestPosition !== null && analysis.latestPosition <= 5 && !analysis.featuredSnippet) {
        ruleBasedAdjustments.push({
          action: "expand",
          keyword: analysis.keyword,
          reason: `Ranking #${analysis.latestPosition} without featured snippet. FAQ/structured content could capture snippet.`,
        });
      }
    }

    // Prepare ranking summary for LLM
    const rankingSummary = analyses.map((a) => ({
      keyword: a.keyword,
      position: a.latestPosition,
      previousPosition: a.previousPosition,
      delta: a.delta,
      trend: a.trend,
      featuredSnippet: a.featuredSnippet,
      nearPageOne: a.nearPageOne,
    }));

    // Use Ollama for deeper strategy insights
    const ai = getAIProvider();

    const llmResult = await ai.completeJSON<{
      adjustments: {
        action: string;
        keyword: string;
        reason: string;
        suggestedContent?: string;
      }[];
    }>([
      {
        role: "user",
        content: `You are an SEO strategist for "${params.brandName}" targeting ${params.country} (${params.language}).

Analyze these keyword rankings and provide strategic recommendations:

${JSON.stringify(rankingSummary, null, 2)}

Already processed keywords: ${params.processedKeywords.join(", ") || "none"}

For each keyword, decide one action:
- "prioritize": keyword is close to page 1 or has high potential
- "re-optimize": keyword dropped or needs content refresh
- "translate": keyword should be expanded to other languages
- "expand": keyword needs more supporting content (FAQ, guides)
- "deprioritize": keyword is not worth more effort

Provide 3-5 specific recommendations with reasons and suggested content ideas.

Example output format:
{"adjustments": [{"action": "prioritize", "keyword": "example keyword", "reason": "Close to page 1 with growing trend", "suggestedContent": "Create a comprehensive guide about..."}]}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 2048 });

    // Merge rule-based and LLM adjustments (deduplicate by keyword+action)
    const seen = new Set<string>();
    const allAdjustments: StrategyAdjustment[] = [];

    // Rule-based first (higher confidence)
    for (const adj of ruleBasedAdjustments) {
      const key = `${adj.keyword}::${adj.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        allAdjustments.push(adj);
      }
    }

    // Then LLM suggestions
    for (const adj of llmResult.adjustments) {
      const action = adj.action as StrategyAdjustment["action"];
      const validActions = ["prioritize", "re-optimize", "translate", "expand", "deprioritize"];
      if (!validActions.includes(action)) continue;

      const key = `${adj.keyword}::${action}`;
      if (!seen.has(key)) {
        seen.add(key);
        allAdjustments.push({
          action,
          keyword: adj.keyword,
          reason: adj.reason,
          suggestedContent: adj.suggestedContent,
        });
      }
    }

    // Build strategy report
    const reportLines = allAdjustments.map((a) => {
      const content = a.suggestedContent ? `\n    提案: ${a.suggestedContent}` : "";
      return `[${a.action.toUpperCase()}] ${a.keyword}\n    理由: ${a.reason}${content}`;
    });

    addArtifact(activity.id, {
      type: "text",
      title: `戦略調整レポート (${params.country})`,
      content: reportLines.join("\n\n"),
    });

    addArtifact(activity.id, {
      type: "json",
      title: "戦略調整データ (JSON)",
      content: JSON.stringify(allAdjustments, null, 2),
    });

    const actionCounts = allAdjustments.reduce(
      (acc, a) => {
        acc[a.action] = (acc[a.action] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    completeActivity(activity.id, {
      metrics: {
        totalAdjustments: allAdjustments.length,
        prioritize: actionCounts.prioritize ?? 0,
        reOptimize: actionCounts["re-optimize"] ?? 0,
        translate: actionCounts.translate ?? 0,
        expand: actionCounts.expand ?? 0,
        deprioritize: actionCounts.deprioritize ?? 0,
      },
      details: {
        analyzedKeywords: analyses.length,
        ruleBasedCount: ruleBasedAdjustments.length,
        llmSuggestionCount: llmResult.adjustments.length,
      },
    });

    return allAdjustments;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
