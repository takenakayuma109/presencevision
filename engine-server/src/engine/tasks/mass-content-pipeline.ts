/**
 * Mass Content Pipeline — 発見キーワードからバッチでコンテンツを量産
 *
 * キーワードキューから batchSize 件ずつ取り出し、
 * SEO記事 + FAQ + Schema.org + 多言語展開を一括生成。
 * API課金ゼロ（ローカルOllama）。
 */

import {
  generateSeoArticle,
  generateFaq,
  generateSchema,
  translateContent,
} from "./content-generator.js";
import type { DiscoveredKeyword } from "./keyword-discoverer.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MassContentParams {
  projectId: string;
  taskId: string;
  keywords: DiscoveredKeyword[];
  brandName: string;
  targetUrl: string;
  batchSize?: number; // default 5 per cycle
  targetLanguages?: string[]; // for translation
}

export interface GeneratedContentItem {
  keyword: string;
  language: string;
  article: { title: string; body: string; metaDescription: string };
  faq?: { questions: { q: string; a: string }[] };
  schemaJsonLd?: string;
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OLLAMA_COOLDOWN_MS = 1500;

// ---------------------------------------------------------------------------
// Main: runMassContentPipeline
// ---------------------------------------------------------------------------

export async function runMassContentPipeline(
  params: MassContentParams,
): Promise<GeneratedContentItem[]> {
  const batchSize = params.batchSize ?? 5;
  const batch = params.keywords.slice(0, batchSize);

  if (batch.length === 0) {
    console.log("[MassContent] No keywords to process");
    return [];
  }

  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_generation",
    country: batch[0].country,
    language: batch[0].language,
    method: "ContentMarketing",
    description: `バッチコンテンツ生成: ${batch.length}件のキーワード`,
  });

  const results: GeneratedContentItem[] = [];
  let successCount = 0;
  let failCount = 0;

  try {
    for (const kw of batch) {
      console.log(
        `[MassContent] Generating content for: "${kw.keyword}" (${kw.language})`,
      );

      try {
        // 1. SEO Article
        await sleep(OLLAMA_COOLDOWN_MS);
        const article = await generateSeoArticle({
          projectId: params.projectId,
          taskId: `${params.taskId}-article-${sanitize(kw.keyword)}`,
          topic: kw.keyword,
          keywords: [kw.keyword, kw.parentKeyword],
          targetUrl: params.targetUrl,
          country: kw.country,
          language: kw.language,
          brandName: params.brandName,
        });

        // 2. FAQ
        await sleep(OLLAMA_COOLDOWN_MS);
        let faqData: { q: string; a: string }[] | undefined;
        try {
          const faq = await generateFaq({
            projectId: params.projectId,
            taskId: `${params.taskId}-faq-${sanitize(kw.keyword)}`,
            topic: kw.keyword,
            existingQuestions: [],
            country: kw.country,
            language: kw.language,
            brandName: params.brandName,
          });
          // Extract questions from FAQ metadata
          const questions = faq.metadata.questions as
            | { question: string; answer: string }[]
            | undefined;
          if (questions) {
            faqData = questions.map((item) => ({
              q: item.question,
              a: item.answer,
            }));
          }
        } catch (error) {
          console.warn(
            `[MassContent] FAQ generation failed for "${kw.keyword}":`,
            error,
          );
        }

        // 3. Schema.org JSON-LD
        await sleep(OLLAMA_COOLDOWN_MS);
        let schemaJsonLd: string | undefined;
        try {
          const schema = await generateSchema({
            projectId: params.projectId,
            taskId: `${params.taskId}-schema-${sanitize(kw.keyword)}`,
            pageUrl: params.targetUrl,
            pageTitle: article.title,
            pageType: "article",
            content: article.body.slice(0, 500),
            country: kw.country,
            language: kw.language,
            brandName: params.brandName,
          });
          schemaJsonLd = schema.body;
        } catch (error) {
          console.warn(
            `[MassContent] Schema generation failed for "${kw.keyword}":`,
            error,
          );
        }

        const contentItem: GeneratedContentItem = {
          keyword: kw.keyword,
          language: kw.language,
          article: {
            title: article.title,
            body: article.body,
            metaDescription:
              (article.metadata.metaDescription as string) ?? "",
          },
          faq: faqData ? { questions: faqData } : undefined,
          schemaJsonLd,
          generatedAt: new Date(),
        };

        results.push(contentItem);
        successCount++;

        // 4. Multilingual translations
        if (params.targetLanguages && params.targetLanguages.length > 0) {
          for (const targetLang of params.targetLanguages) {
            if (targetLang === kw.language) continue;

            await sleep(OLLAMA_COOLDOWN_MS);
            try {
              const translated = await translateContent({
                projectId: params.projectId,
                taskId: `${params.taskId}-translate-${sanitize(kw.keyword)}-${targetLang}`,
                sourceContent: `# ${article.title}\n\n${article.body}`,
                sourceLanguage: kw.language,
                targetLanguage: targetLang,
                targetCountry: kw.country,
                contentType: "article",
                brandName: params.brandName,
              });

              results.push({
                keyword: kw.keyword,
                language: targetLang,
                article: {
                  title: translated.title,
                  body: translated.body,
                  metaDescription: "",
                },
                generatedAt: new Date(),
              });
            } catch (error) {
              console.warn(
                `[MassContent] Translation to ${targetLang} failed for "${kw.keyword}":`,
                error,
              );
            }
          }
        }

        console.log(
          `[MassContent] Completed: "${kw.keyword}" (${successCount}/${batch.length})`,
        );
      } catch (error) {
        console.error(
          `[MassContent] Failed for "${kw.keyword}":`,
          error,
        );
        failCount++;
      }

      // Cooldown between keywords
      await sleep(OLLAMA_COOLDOWN_MS);
    }

    addArtifact(activity.id, {
      type: "json",
      title: `バッチ生成結果 (${results.length}件)`,
      content: JSON.stringify(
        {
          total: results.length,
          success: successCount,
          failed: failCount,
          items: results.map((r) => ({
            keyword: r.keyword,
            language: r.language,
            title: r.article.title,
            hasFaq: !!r.faq,
            hasSchema: !!r.schemaJsonLd,
          })),
        },
        null,
        2,
      ),
    });

    completeActivity(activity.id, {
      metrics: {
        totalGenerated: results.length,
        articlesGenerated: successCount,
        articlesFailed: failCount,
        translationsGenerated: results.length - successCount,
      },
      details: {
        keywords: batch.map((k) => k.keyword),
        batchSize,
      },
    });

    console.log(
      `[MassContent] Pipeline complete: ${results.length} items generated (${successCount} success, ${failCount} failed)`,
    );
    return results;
  } catch (error) {
    failActivity(
      activity.id,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sanitize a keyword for use in task IDs */
function sanitize(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u3000-\u9fff]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}
