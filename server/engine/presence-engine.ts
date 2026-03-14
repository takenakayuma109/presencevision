/**
 * Presence Engine — PVの心臓部
 *
 * プロジェクトごとに24/7で以下を自律実行:
 * 1. サイト分析 → 現状把握
 * 2. SERP順位チェック → 検索順位を定点観測
 * 3. LLMチェック → AI検索での言及確認
 * 4. コンテンツ生成 → SEO/AEO最適化コンテンツ
 * 5. Schema.org生成 → 構造化データ
 * 6. 多言語展開 → 全ターゲット国/言語で実行
 * 7. レポート生成 → 何をしたか全て記録
 *
 * 全て対象国×対象言語の組み合わせで同時実行。
 */

import { v4 as uuidv4 } from "uuid";
import { analyzeSite } from "./tasks/site-analyzer";
import { checkSerp, type SerpResult } from "./tasks/serp-checker";
import { checkLlm, type LlmCheckResult } from "./tasks/llm-checker";
import {
  generateSeoArticle,
  generateFaq,
  generateSchema,
  translateContent,
  type GeneratedContent,
} from "./tasks/content-generator";
import {
  getActivities,
  getActivityStats,
  type ActivityEntry,
} from "./activity-logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PresenceProject {
  id: string;
  name: string;
  targetUrl: string;
  brandName: string;
  keywords: string[];
  targetCountries: string[];
  methods: PresenceMethod[];
  status: "active" | "paused" | "completed";
  createdAt: Date;
}

export type PresenceMethod =
  | "SEO"
  | "AEO"
  | "GEO"
  | "Schema.org"
  | "ContentMarketing"
  | "KnowledgeGraph"
  | "FAQ"
  | "Multilingual";

interface CycleResult {
  cycleId: string;
  projectId: string;
  startedAt: Date;
  completedAt: Date;
  tasksExecuted: number;
  tasksFailed: number;
  countries: string[];
  results: {
    siteAnalysis?: Record<string, unknown>;
    serpResults: SerpResult[];
    llmResults: LlmCheckResult[];
    contentGenerated: GeneratedContent[];
  };
}

// 国 → 言語マッピング
const COUNTRY_LANGUAGES: Record<string, string> = {
  JP: "ja", US: "en", GB: "en", DE: "de", FR: "fr",
  KR: "ko", CN: "zh", TW: "zh-TW", BR: "pt",
  IN: "hi", AU: "en", CA: "en", ES: "es", IT: "it",
  NL: "nl", SE: "sv", SG: "en", ID: "id", TH: "th", VN: "vi",
};

// ---------------------------------------------------------------------------
// Engine State
// ---------------------------------------------------------------------------
const activeProjects = new Map<string, {
  project: PresenceProject;
  intervalId: ReturnType<typeof setInterval> | null;
  running: boolean;
}>();

// ---------------------------------------------------------------------------
// 1サイクルの実行
// ---------------------------------------------------------------------------
async function runCycle(project: PresenceProject): Promise<CycleResult> {
  const cycleId = uuidv4();
  const startedAt = new Date();
  let tasksExecuted = 0;
  let tasksFailed = 0;

  const serpResults: SerpResult[] = [];
  const llmResults: LlmCheckResult[] = [];
  const contentGenerated: GeneratedContent[] = [];

  console.log(`[Engine] Cycle ${cycleId} starting for project "${project.name}"`);

  // 各国×各メソッドで実行
  for (const country of project.targetCountries) {
    const language = COUNTRY_LANGUAGES[country] ?? "en";

    // --- SEO: サイト分析 + SERP順位チェック ---
    if (project.methods.includes("SEO")) {
      // サイト分析（国ごとに1回）
      try {
        await analyzeSite({
          projectId: project.id,
          taskId: `${cycleId}-site-${country}`,
          url: project.targetUrl,
          country,
          language,
        });
        tasksExecuted++;
      } catch (error) {
        console.error(`[Engine] Site analysis failed for ${country}:`, error);
        tasksFailed++;
      }

      // SERP順位チェック（キーワードごと）
      for (const keyword of project.keywords.slice(0, 5)) {
        try {
          const result = await checkSerp({
            projectId: project.id,
            taskId: `${cycleId}-serp-${country}`,
            keyword,
            targetUrl: project.targetUrl,
            country,
            language,
          });
          serpResults.push(result);
          tasksExecuted++;
        } catch (error) {
          console.error(`[Engine] SERP check failed for "${keyword}" (${country}):`, error);
          tasksFailed++;
        }

        // レート制限回避
        await sleep(2000 + Math.random() * 3000);
      }
    }

    // --- GEO: LLMでの言及チェック ---
    if (project.methods.includes("GEO")) {
      const queries = [
        `${project.brandName}について教えて`,
        `${project.keywords[0] ?? project.brandName} おすすめ`,
        `${project.keywords[0] ?? project.brandName} 比較`,
      ];

      for (const query of queries) {
        for (const platform of ["perplexity", "google-ai-overview"] as const) {
          try {
            const result = await checkLlm({
              projectId: project.id,
              taskId: `${cycleId}-llm-${country}`,
              query,
              targetBrand: project.brandName,
              platform,
              country,
              language,
            });
            llmResults.push(result);
            tasksExecuted++;
          } catch (error) {
            console.error(`[Engine] LLM check failed on ${platform} (${country}):`, error);
            tasksFailed++;
          }

          await sleep(3000 + Math.random() * 5000);
        }
      }
    }

    // --- AEO: FAQ生成 ---
    if (project.methods.includes("AEO") || project.methods.includes("FAQ")) {
      try {
        const faq = await generateFaq({
          projectId: project.id,
          taskId: `${cycleId}-faq-${country}`,
          topic: project.keywords[0] ?? project.brandName,
          existingQuestions: [],
          country,
          language,
          brandName: project.brandName,
        });
        contentGenerated.push(faq);
        tasksExecuted++;
      } catch (error) {
        console.error(`[Engine] FAQ generation failed (${country}):`, error);
        tasksFailed++;
      }
    }

    // --- Schema.org ---
    if (project.methods.includes("Schema.org")) {
      try {
        const schema = await generateSchema({
          projectId: project.id,
          taskId: `${cycleId}-schema-${country}`,
          pageUrl: project.targetUrl,
          pageTitle: project.name,
          pageType: "organization",
          country,
          language,
          brandName: project.brandName,
        });
        contentGenerated.push(schema);
        tasksExecuted++;
      } catch (error) {
        console.error(`[Engine] Schema generation failed (${country}):`, error);
        tasksFailed++;
      }
    }

    // --- SEOコンテンツ生成 ---
    if (project.methods.includes("SEO") || project.methods.includes("ContentMarketing")) {
      for (const keyword of project.keywords.slice(0, 3)) {
        try {
          const article = await generateSeoArticle({
            projectId: project.id,
            taskId: `${cycleId}-content-${country}`,
            topic: keyword,
            keywords: project.keywords,
            targetUrl: project.targetUrl,
            country,
            language,
            brandName: project.brandName,
          });
          contentGenerated.push(article);
          tasksExecuted++;

          // --- Multilingual: 他言語への展開 ---
          if (project.methods.includes("Multilingual")) {
            const otherCountries = project.targetCountries.filter((c) => c !== country);
            for (const otherCountry of otherCountries) {
              const otherLang = COUNTRY_LANGUAGES[otherCountry] ?? "en";
              if (otherLang === language) continue; // 同じ言語ならスキップ

              try {
                const translated = await translateContent({
                  projectId: project.id,
                  taskId: `${cycleId}-translate-${otherCountry}`,
                  sourceContent: article.body,
                  sourceLanguage: language,
                  targetLanguage: otherLang,
                  targetCountry: otherCountry,
                  contentType: "article",
                  brandName: project.brandName,
                });
                contentGenerated.push(translated);
                tasksExecuted++;
              } catch (error) {
                console.error(`[Engine] Translation failed (${otherCountry}):`, error);
                tasksFailed++;
              }
            }
          }
        } catch (error) {
          console.error(`[Engine] Content generation failed (${country}):`, error);
          tasksFailed++;
        }
      }
    }
  }

  const completedAt = new Date();
  console.log(
    `[Engine] Cycle ${cycleId} completed: ${tasksExecuted} tasks, ${tasksFailed} failures, ${completedAt.getTime() - startedAt.getTime()}ms`,
  );

  return {
    cycleId,
    projectId: project.id,
    startedAt,
    completedAt,
    tasksExecuted,
    tasksFailed,
    countries: project.targetCountries,
    results: { serpResults, llmResults, contentGenerated },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** プロジェクトを開始（24/7ループ） */
export function startProject(project: PresenceProject): void {
  if (activeProjects.has(project.id)) {
    console.log(`[Engine] Project "${project.name}" is already running`);
    return;
  }

  const state = { project, intervalId: null as ReturnType<typeof setInterval> | null, running: true };
  activeProjects.set(project.id, state);

  // 初回実行
  runCycle(project).catch((err) =>
    console.error(`[Engine] Initial cycle failed:`, err),
  );

  // 定期実行（デフォルト: 6時間ごと）
  const intervalMs = parseInt(process.env.ENGINE_CYCLE_INTERVAL_MS ?? String(6 * 60 * 60 * 1000));
  state.intervalId = setInterval(() => {
    if (state.running) {
      runCycle(project).catch((err) =>
        console.error(`[Engine] Cycle failed:`, err),
      );
    }
  }, intervalMs);

  console.log(`[Engine] Project "${project.name}" started (cycle every ${intervalMs / 1000 / 60}min)`);
}

/** プロジェクトを停止 */
export function stopProject(projectId: string): void {
  const state = activeProjects.get(projectId);
  if (!state) return;

  state.running = false;
  if (state.intervalId) clearInterval(state.intervalId);
  activeProjects.delete(projectId);

  console.log(`[Engine] Project "${state.project.name}" stopped`);
}

/** 手動で1サイクル実行 */
export async function runSingleCycle(project: PresenceProject): Promise<CycleResult> {
  return runCycle(project);
}

/** プロジェクトのアクティビティを取得 */
export function getProjectActivities(
  projectId: string,
  options?: { limit?: number; taskId?: string },
): ActivityEntry[] {
  return getActivities(projectId, options);
}

/** プロジェクトの統計を取得 */
export function getProjectStats(projectId: string) {
  return getActivityStats(projectId);
}

/** 稼働中プロジェクト一覧 */
export function getActiveProjects(): PresenceProject[] {
  return Array.from(activeProjects.values()).map((s) => s.project);
}

/** プロジェクトが稼働中か */
export function isProjectRunning(projectId: string): boolean {
  return activeProjects.has(projectId);
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
