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
import { analyzeSite } from "./tasks/site-analyzer.js";
import { checkSerp, type SerpResult } from "./tasks/serp-checker.js";
import { checkLlm, type LlmCheckResult } from "./tasks/llm-checker.js";
import {
  generateSeoArticle,
  generateFaq,
  generateSchema,
  translateContent,
  type GeneratedContent,
} from "./tasks/content-generator.js";
import {
  publishToWordPress,
  type CmsConfig,
} from "./tasks/cms-publisher.js";
import {
  distributeContent,
  type DistributionResult,
} from "./tasks/presence-distributor.js";
import { getChannelsForCountry, isChannelReady } from "./channels/channel-registry.js";
import {
  getActivities,
  getActivityStats,
  type ActivityEntry,
} from "./activity-logger.js";
import { getBrowserPool } from "./browser-pool.js";
import { saveProject, removeProject, getActiveProjectsFromDB, saveArticle } from "../db/index.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTENT_GEN_MAX_FAILURES = 3;
const OLLAMA_COOLDOWN_MS = 1000;

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
  cmsConfig?: CmsConfig;
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
  tasksSkipped: number;
  countries: string[];
  results: {
    siteAnalysis?: Record<string, unknown>;
    serpResults: SerpResult[];
    llmResults: LlmCheckResult[];
    contentGenerated: GeneratedContent[];
    distributionResults: DistributionResult[];
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
// Helper: run a task with retry (for content-gen tasks that hit Ollama)
// ---------------------------------------------------------------------------
async function runWithRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxFailures: number = CONTENT_GEN_MAX_FAILURES,
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxFailures; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`[Engine] ${label} — attempt ${attempt}/${maxFailures} failed:`, error);
      if (attempt === maxFailures) {
        console.warn(`[Engine] ${label} — skipping after ${maxFailures} failures`);
        return null;
      }
      // Brief cooldown before retry
      await sleep(OLLAMA_COOLDOWN_MS);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1サイクルの実行
// ---------------------------------------------------------------------------
async function runCycle(project: PresenceProject): Promise<CycleResult> {
  const cycleId = uuidv4();
  const startedAt = new Date();
  let tasksExecuted = 0;
  let tasksFailed = 0;
  let tasksSkipped = 0;

  const serpResults: SerpResult[] = [];
  const llmResults: LlmCheckResult[] = [];
  const contentGenerated: GeneratedContent[] = [];
  const distributionResults: DistributionResult[] = [];

  console.log(`[Engine] Cycle ${cycleId} starting for project "${project.name}"`);

  // ブラウザをリセットして新しいサイクルをクリーンな状態で開始
  try {
    await getBrowserPool().resetBrowser();
    console.log(`[Engine] Browser reset successful for cycle ${cycleId}`);
  } catch (error) {
    console.error(`[Engine] Browser reset failed for cycle ${cycleId}:`, error);
  }

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
      await sleep(OLLAMA_COOLDOWN_MS);
      const faq = await runWithRetry(`FAQ generation (${country})`, () =>
        generateFaq({
          projectId: project.id,
          taskId: `${cycleId}-faq-${country}`,
          topic: project.keywords[0] ?? project.brandName,
          existingQuestions: [],
          country,
          language,
          brandName: project.brandName,
        }),
      );
      if (faq) {
        contentGenerated.push(faq);
        tasksExecuted++;

        // CMS公開
        if (project.cmsConfig) {
          try {
            await publishToWordPress({
              projectId: project.id,
              taskId: `${cycleId}-cms-faq-${country}`,
              content: {
                title: faq.title,
                body: faq.body,
                type: "faq",
                keyword: project.keywords[0],
                language,
              },
              cmsConfig: project.cmsConfig,
              country,
              language,
            });
            console.log(`[Engine] FAQ published to WordPress (${country})`);
          } catch (error) {
            console.error(`[Engine] FAQ CMS publish failed (${country}):`, error);
          }
        }
      } else {
        tasksSkipped++;
      }
    }

    // --- Schema.org ---
    if (project.methods.includes("Schema.org")) {
      await sleep(OLLAMA_COOLDOWN_MS);
      const schema = await runWithRetry(`Schema generation (${country})`, () =>
        generateSchema({
          projectId: project.id,
          taskId: `${cycleId}-schema-${country}`,
          pageUrl: project.targetUrl,
          pageTitle: project.name,
          pageType: "organization",
          country,
          language,
          brandName: project.brandName,
        }),
      );
      if (schema) {
        contentGenerated.push(schema);
        tasksExecuted++;

        // CMS公開（ページとして）
        if (project.cmsConfig) {
          try {
            await publishToWordPress({
              projectId: project.id,
              taskId: `${cycleId}-cms-schema-${country}`,
              content: {
                title: schema.title,
                body: schema.body,
                type: "schema",
                language,
                schemaJsonLd: schema.body,
              },
              cmsConfig: project.cmsConfig,
              country,
              language,
            });
            console.log(`[Engine] Schema published to WordPress (${country})`);
          } catch (error) {
            console.error(`[Engine] Schema CMS publish failed (${country}):`, error);
          }
        }
      } else {
        tasksSkipped++;
      }
    }

    // --- SEOコンテンツ生成 ---
    if (project.methods.includes("SEO") || project.methods.includes("ContentMarketing")) {
      for (const keyword of project.keywords.slice(0, 3)) {
        await sleep(OLLAMA_COOLDOWN_MS);
        const article = await runWithRetry(`SEO article "${keyword}" (${country})`, () =>
          generateSeoArticle({
            projectId: project.id,
            taskId: `${cycleId}-content-${country}`,
            topic: keyword,
            keywords: project.keywords,
            targetUrl: project.targetUrl,
            country,
            language,
            brandName: project.brandName,
          }),
        );

        if (article) {
          contentGenerated.push(article);
          tasksExecuted++;

          // Hub公開（自サイトブログに保存）
          try {
            await saveArticle({
              id: `${cycleId}-article-${country}-${keyword.slice(0, 30)}`,
              projectId: project.id,
              title: article.title,
              body: article.body,
              metaTitle: article.metadata?.metaTitle as string,
              metaDescription: article.metadata?.metaDescription as string,
              keyword,
              language,
              country,
              brandName: project.brandName,
            });
            console.log(`[Engine] Article "${keyword}" saved to Hub blog (${country})`);
          } catch (err) {
            console.warn(`[Engine] Failed to save article to Hub:`, err);
          }

          // CMS公開
          if (project.cmsConfig) {
            try {
              await publishToWordPress({
                projectId: project.id,
                taskId: `${cycleId}-cms-article-${country}`,
                content: {
                  title: article.title,
                  body: article.body,
                  type: "article",
                  keyword,
                  language,
                },
                cmsConfig: project.cmsConfig,
                country,
                language,
              });
              console.log(`[Engine] Article "${keyword}" published to WordPress (${country})`);
            } catch (error) {
              console.error(`[Engine] Article CMS publish failed (${country}):`, error);
            }
          }

          // --- Multilingual: 他言語への展開 ---
          if (project.methods.includes("Multilingual")) {
            const otherCountries = project.targetCountries.filter((c) => c !== country);
            for (const otherCountry of otherCountries) {
              const otherLang = COUNTRY_LANGUAGES[otherCountry] ?? "en";
              if (otherLang === language) continue; // 同じ言語ならスキップ

              await sleep(OLLAMA_COOLDOWN_MS);
              const translated = await runWithRetry(
                `Translation ${language}->${otherLang} (${otherCountry})`,
                () =>
                  translateContent({
                    projectId: project.id,
                    taskId: `${cycleId}-translate-${otherCountry}`,
                    sourceContent: article.body,
                    sourceLanguage: language,
                    targetLanguage: otherLang,
                    targetCountry: otherCountry,
                    contentType: "article",
                    brandName: project.brandName,
                  }),
              );
              if (translated) {
                contentGenerated.push(translated);
                tasksExecuted++;
              } else {
                tasksSkipped++;
              }
            }
          }
        } else {
          tasksSkipped++;
        }
      }
    }

    // --- Distributed Presence: 各プラットフォームへ配信 ---
    if (contentGenerated.length > 0) {
      const channels = getChannelsForCountry(country);
      const readyChannels = channels.filter((c) => isChannelReady(c));

      if (readyChannels.length === 0) {
        console.log(`[Engine] Skipping distribution — no configured channels for ${country}`);
      } else {
        // サイクルあたり最大2コンテンツまで配信（レート制限回避）
        const contentsToDistribute = contentGenerated
          .filter((c) => c.type === "article")
          .slice(0, 2);

        for (const content of contentsToDistribute) {
          try {
            const distResult = await distributeContent({
              projectId: project.id,
              taskId: `${cycleId}-distribute-${country}`,
              content: {
                article: {
                  title: content.title,
                  body: content.body,
                  tags: (content.metadata?.keywords as string[]) ?? project.keywords.slice(0, 5),
                },
                keyword: project.keywords[0] ?? project.brandName,
                language,
              },
              channels: readyChannels,
              brandName: project.brandName,
              targetUrl: project.targetUrl,
              country,
            });

            distributionResults.push(distResult);
            tasksExecuted++;

            console.log(
              `[Engine] Distribution for ${country}: ${distResult.totalSucceeded}/${distResult.totalAttempted} channels succeeded`,
            );
          } catch (error) {
            console.error(`[Engine] Distribution failed (${country}):`, error);
            tasksFailed++;
          }

          // レート制限回避
          await sleep(5000);
        }
      }
    }
  }

  const completedAt = new Date();
  console.log(
    `[Engine] Cycle ${cycleId} completed: ${tasksExecuted} tasks, ${tasksFailed} failures, ${tasksSkipped} skipped, ${completedAt.getTime() - startedAt.getTime()}ms`,
  );

  return {
    cycleId,
    projectId: project.id,
    startedAt,
    completedAt,
    tasksExecuted,
    tasksFailed,
    tasksSkipped,
    countries: project.targetCountries,
    results: { serpResults, llmResults, contentGenerated, distributionResults },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** プロジェクトを開始（24/7ループ） */
export function startProject(project: PresenceProject, skipInitialCycle = false): void {
  if (activeProjects.has(project.id)) {
    console.log(`[Engine] Project "${project.name}" is already running`);
    return;
  }

  const state = { project, intervalId: null as ReturnType<typeof setInterval> | null, running: true };
  activeProjects.set(project.id, state);

  // DBに保存（再起動時に復帰できるように）
  saveProject(project.id, project as unknown as Record<string, unknown>).catch((err) =>
    console.error(`[Engine] Failed to save project to DB:`, err),
  );

  // 初回実行（復帰時はスキップ可能）
  if (!skipInitialCycle) {
    runCycle(project).catch((err) =>
      console.error(`[Engine] Initial cycle failed:`, err),
    );
  }

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

  // DBからも停止状態にする
  removeProject(projectId).catch((err) =>
    console.error(`[Engine] Failed to remove project from DB:`, err),
  );

  console.log(`[Engine] Project "${state.project.name}" stopped`);
}

/** エンジン起動時にDBから稼働中プロジェクトを復帰 */
export async function restoreProjects(): Promise<void> {
  try {
    const projects = await getActiveProjectsFromDB();
    if (projects.length === 0) {
      console.log("[Engine] No projects to restore");
      return;
    }
    console.log(`[Engine] Restoring ${projects.length} project(s) from DB...`);
    for (const data of projects) {
      const project = data as unknown as PresenceProject;
      project.createdAt = new Date(project.createdAt);
      project.status = "active";
      // 復帰時は初回サイクルをスキップ（次のインターバルで実行）
      startProject(project, true);
      console.log(`[Engine] Restored project "${project.name}"`);
    }
  } catch (error) {
    console.error("[Engine] Failed to restore projects:", error);
  }
}

/** 手動で1サイクル実行 */
export async function runSingleCycle(project: PresenceProject): Promise<CycleResult> {
  return runCycle(project);
}

/** プロジェクトのアクティビティを取得 */
export async function getProjectActivities(
  projectId: string,
  options?: { limit?: number; taskId?: string },
): Promise<ActivityEntry[]> {
  return getActivities(projectId, options);
}

/** プロジェクトの統計を取得 */
export async function getProjectStats(projectId: string) {
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
