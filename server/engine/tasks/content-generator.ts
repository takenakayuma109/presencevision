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

import { getAIProvider } from "@/lib/ai/provider";
import {
  startActivity,
  completeActivity,
  failActivity,
  addArtifact,
} from "../activity-logger";

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
      metaTitle: string;
      metaDescription: string;
      body: string;
      headings: string[];
    }>([
      {
        role: "user",
        content: `Write an SEO-optimized article in ${params.language} language.

Topic: ${params.topic}
Target keywords: ${params.keywords.join(", ")}
Brand: ${params.brandName}
Target URL: ${params.targetUrl}
Target country: ${params.country}

Requirements:
- Write in ${params.language} language
- Include target keywords naturally (2-3% density)
- Use proper heading hierarchy (H2, H3)
- Include internal linking suggestions
- Write 800-1200 words
- Include meta title (50-60 chars) and meta description (150-160 chars)

Return JSON with: title, metaTitle, metaDescription, body (markdown), headings (array)`,
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
        headings: article.headings,
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
        content: `Generate FAQ content optimized for Google's "People Also Ask" and featured snippets.

Topic: ${params.topic}
Brand: ${params.brandName}
Language: ${params.language}
Country: ${params.country}
${params.existingQuestions.length ? `Existing questions (generate NEW ones): ${params.existingQuestions.join(", ")}` : ""}

Requirements:
- Generate 8-12 questions and answers in ${params.language}
- Each answer: 40-60 words (optimal for featured snippets)
- Start answers with direct, concise statements
- Include the question's keywords in the answer
- Cover: what, how, why, when, comparison, cost, best practices
- Make answers factual and authoritative

Return JSON with: questions (array of {question, answer})`,
      },
    ], { maxTokens: 4096 });

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
        content: `Generate a Schema.org JSON-LD structured data for:

Page URL: ${params.pageUrl}
Page Title: ${params.pageTitle}
Type: ${params.pageType}
Brand: ${params.brandName}
Language: ${params.language}
${params.content ? `Content summary: ${params.content.slice(0, 500)}` : ""}

Generate a complete, valid JSON-LD object with @context, @type, and all recommended properties.
For FAQ type, include FAQPage schema with Question/Answer items.
For Article type, include author, datePublished, publisher, image placeholder.
For Organization type, include logo, contactPoint, sameAs.

Return the JSON-LD object directly.`,
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
      metaTitle: string;
      metaDescription: string;
    }>([
      {
        role: "user",
        content: `Translate and localize the following content from ${params.sourceLanguage} to ${params.targetLanguage}.

Important:
- This is not just translation — localize for ${params.targetCountry} market
- Adapt cultural references, units, examples to local context
- Keep SEO keywords relevant for ${params.targetLanguage} search
- Maintain the brand name "${params.brandName}" as-is (don't translate)
- Keep the same markdown structure

Content to translate:
${params.sourceContent.slice(0, 3000)}

Return JSON with: title, body (markdown), metaTitle, metaDescription`,
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
        metaTitle: translated.metaTitle,
        metaDescription: translated.metaDescription,
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
