/**
 * Content Generator — ローカルLLM（Ollama）でSEO/AEO最適化コンテンツ生成
 *
 * - SEO記事（キーワード最適化済み）
 * - FAQ（People Also Ask対応）
 * - Schema.org JSON-LD
 * - 多言語展開
 *
 * 全てローカルLLMで処理。API従量課金ゼロ。
 */

import { getAIProvider } from "../../ai/provider.js";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger.js";

export interface GeneratedContent {
  type: "article" | "faq" | "schema" | "meta_tags" | "multilingual";
  title: string;
  body: string;
  language: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// SEO記事生成
// ---------------------------------------------------------------------------
export async function generateSeoArticle(params: {
  projectId: string;
  taskId: string;
  topic: string;
  keywords: string[];
  targetUrl: string;
  country: string;
  language: string;
  brandName: string;
}): Promise<GeneratedContent> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_generation",
    country: params.country,
    language: params.language,
    method: "SEO",
    description: `SEO記事生成: "${params.topic}" (${params.language})`,
  });

  try {
    const ai = getAIProvider();

    const article = await ai.completeJSON<{
      title: string;
      body: string;
      metaTitle: string;
      metaDescription: string;
    }>([
      {
        role: "user",
        content: `Write an SEO article in ${params.language}.

Topic: ${params.topic}
Keywords: ${params.keywords.join(", ")}
Brand: ${params.brandName}
Country: ${params.country}

Write 300-500 words. Include keywords naturally. Use H2/H3 headings in the body.

Example output format:
{"title": "Your Title Here", "body": "## Heading\\n\\nArticle text...", "metaTitle": "Short Meta Title", "metaDescription": "A 150-char description."}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 4096 });

    const result: GeneratedContent = {
      type: "article",
      title: article.title,
      body: article.body,
      language: params.language,
      metadata: {
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        keywords: params.keywords,
      },
    };

    addArtifact(activity.id, {
      type: "text",
      title: `SEO記事: ${article.title}`,
      content: article.body,
    });

    completeActivity(activity.id, {
      metrics: { wordCount: article.body.split(/\s+/).length },
      details: { metaTitle: article.metaTitle },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ---------------------------------------------------------------------------
// FAQ生成（AEO — Answer Engine Optimization）
// ---------------------------------------------------------------------------
export async function generateFaq(params: {
  projectId: string;
  taskId: string;
  topic: string;
  existingQuestions: string[];
  country: string;
  language: string;
  brandName: string;
}): Promise<GeneratedContent> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "content_generation",
    country: params.country,
    language: params.language,
    method: "AEO",
    description: `FAQ生成: "${params.topic}" (${params.language})`,
  });

  try {
    const ai = getAIProvider();

    const faq = await ai.completeJSON<{
      questions: { question: string; answer: string }[];
    }>([
      {
        role: "user",
        content: `Generate 5 FAQ questions and answers about "${params.topic}" for ${params.brandName} in ${params.language}.
Each answer should be 40-60 words.
${params.existingQuestions.length ? `Do not repeat these: ${params.existingQuestions.join(", ")}` : ""}

Example output format:
{"questions": [{"question": "What is X?", "answer": "X is a..."}]}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 2048 });

    const body = faq.questions
      .map((q) => `## ${q.question}\n\n${q.answer}`)
      .join("\n\n");

    const result: GeneratedContent = {
      type: "faq",
      title: `FAQ: ${params.topic}`,
      body,
      language: params.language,
      metadata: { questionCount: faq.questions.length, questions: faq.questions },
    };

    addArtifact(activity.id, {
      type: "json",
      title: "FAQデータ",
      content: JSON.stringify(faq.questions, null, 2),
    });

    completeActivity(activity.id, {
      metrics: { questionCount: faq.questions.length },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Schema.org JSON-LD生成
// ---------------------------------------------------------------------------
export async function generateSchema(params: {
  projectId: string;
  taskId: string;
  pageUrl: string;
  pageTitle: string;
  pageType: "article" | "faq" | "product" | "organization" | "local_business";
  content?: string;
  country: string;
  language: string;
  brandName: string;
}): Promise<GeneratedContent> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "schema_generation",
    country: params.country,
    language: params.language,
    method: "Schema.org",
    description: `Schema.org生成: ${params.pageType} (${params.language})`,
  });

  try {
    const ai = getAIProvider();

    const schema = await ai.completeJSON<Record<string, unknown>>([
      {
        role: "user",
        content: `Generate Schema.org JSON-LD for:

URL: ${params.pageUrl}
Title: ${params.pageTitle}
Type: ${params.pageType}
Brand: ${params.brandName}
Language: ${params.language}
${params.content ? `Content: ${params.content.slice(0, 500)}` : ""}

Include @context, @type, and recommended properties.

Example for Organization type:
{"@context": "https://schema.org", "@type": "Organization", "name": "Brand", "url": "https://example.com", "logo": "https://example.com/logo.png"}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 2048 });

    const jsonLd = { "@context": "https://schema.org", ...schema };

    const result: GeneratedContent = {
      type: "schema",
      title: `Schema.org: ${params.pageType}`,
      body: JSON.stringify(jsonLd, null, 2),
      language: params.language,
      metadata: { schemaType: params.pageType, pageUrl: params.pageUrl },
    };

    addArtifact(activity.id, {
      type: "code",
      title: `Schema.org JSON-LD (${params.pageType})`,
      content: `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`,
    });

    completeActivity(activity.id, {
      metrics: { schemaProperties: Object.keys(schema).length },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 多言語展開
// ---------------------------------------------------------------------------
export async function translateContent(params: {
  projectId: string;
  taskId: string;
  sourceContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetCountry: string;
  contentType: string;
  brandName: string;
}): Promise<GeneratedContent> {
  const activity = startActivity({
    projectId: params.projectId,
    taskId: params.taskId,
    type: "multilingual_expansion",
    country: params.targetCountry,
    language: params.targetLanguage,
    method: "Multilingual",
    description: `翻訳: ${params.sourceLanguage} → ${params.targetLanguage}`,
  });

  try {
    const ai = getAIProvider();

    const translated = await ai.completeJSON<{
      title: string;
      body: string;
    }>([
      {
        role: "user",
        content: `Translate from ${params.sourceLanguage} to ${params.targetLanguage} for ${params.targetCountry}.
Keep "${params.brandName}" unchanged. Localize for the target market.

Content:
${params.sourceContent.slice(0, 3000)}

Example output format:
{"title": "Translated Title", "body": "Translated body text..."}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 4096 });

    const result: GeneratedContent = {
      type: "multilingual",
      title: translated.title,
      body: translated.body,
      language: params.targetLanguage,
      metadata: {
        sourceLanguage: params.sourceLanguage,
        targetLanguage: params.targetLanguage,
        targetCountry: params.targetCountry,
      },
    };

    addArtifact(activity.id, {
      type: "text",
      title: `翻訳済み (${params.targetLanguage})`,
      content: translated.body.slice(0, 1000),
    });

    completeActivity(activity.id, {
      metrics: { wordCount: translated.body.split(/\s+/).length },
    });

    return result;
  } catch (error) {
    failActivity(activity.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
