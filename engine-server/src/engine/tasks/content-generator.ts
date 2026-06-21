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

import { getAIProvider, getModelForPlan, getFlagshipModel } from "../../ai/provider.js";
import {
  startActivity,
  completeActivity,
  addArtifact,
} from "../activity-logger.js";

/** 言語コード → 自然言語名マッピング（LLMが確実に理解できる形式） */
const languageNames: Record<string, string> = {
  ja: "Japanese (日本語)",
  en: "English",
  zh: "Chinese (中文)",
  ko: "Korean (한국어)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  pt: "Portuguese (Português)",
  ru: "Russian (Русский)",
  ar: "Arabic (العربية)",
  hi: "Hindi (हिन्दी)",
};

function getLanguageName(code: string): string {
  return languageNames[code] ?? code;
}

/** 会社プロフィールから記事プロンプト用の「検証済み事実」サマリーを作る（E-E-A-T・捏造防止） */
function summarizeCompanyProfile(p?: Record<string, unknown>): string {
  if (!p) return "";
  const f = (k: string): string =>
    typeof p[k] === "string" && p[k] ? String(p[k]) : "";
  const lines = [
    f("representative") && `代表者: ${f("representative")}`,
    f("foundedDate") && `設立: ${f("foundedDate")}`,
    f("industry") && `業種: ${f("industry")}`,
    f("headquarters") && `所在地: ${f("headquarters")}`,
    f("employeeCount") && `従業員数: ${f("employeeCount")}`,
    f("capital") && `資本金: ${f("capital")}`,
    f("description") && `事業内容: ${f("description")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// LLM出力品質バリデーション（日本語ガベージ検出）
// ---------------------------------------------------------------------------
function validateContent(
  text: string,
  language: string,
): { valid: boolean; reason?: string } {
  // Too short for meaningful content（全言語）
  if (text.length < 100) {
    return { valid: false, reason: "生成されたテキストが短すぎます" };
  }

  // Count character types
  const hiraganaCount = (text.match(/[\u3040-\u309F]/g) || []).length;
  const katakanaCount = (text.match(/[\u30A0-\u30FF]/g) || []).length;
  const kanjiCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
  const totalKana = hiraganaCount + katakanaCount;

  // Japanese-only: 多くの漢字に対しかなが極端に少ない＝中国語/ゴミの可能性
  if (language.startsWith("ja") && kanjiCount > 10 && totalKana < kanjiCount * 0.3) {
    return {
      valid: false,
      reason: "日本語として不正なテキスト（ひらがな/カタカナが不足）",
    };
  }

  // Check for repetition loops (same 20+ char phrase appearing 4+ times)
  const sample = text.slice(0, 500);
  for (let len = 20; len < 60 && len < sample.length; len++) {
    for (let i = 0; i <= sample.length - len; i++) {
      const phrase = sample.slice(i, i + len);
      const count = sample.split(phrase).length - 1;
      if (count >= 8) {
        return {
          valid: false,
          reason: "テキストにループ（同じフレーズの繰り返し）が検出されました",
        };
      }
    }
  }

  // HTML tags mixed with content (sign of broken output)
  const htmlTagCount = (text.match(/<[a-z][a-z0-9]*[^>]*>/gi) || []).length;
  if (htmlTagCount > 5 && kanjiCount + totalKana < text.length * 0.2) {
    return {
      valid: false,
      reason: "HTMLタグ混在の不正な出力が検出されました",
    };
  }

  return { valid: true };
}

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
  planId?: string;
  /** "flagship" は pillar記事として Opus 4.8 で高品質生成（量産は "bulk" = Haiku等） */
  tier?: "bulk" | "flagship";
  /** 会社プロフィール（検証済み事実をプロンプトに供給し、E-E-A-T向上＆捏造防止） */
  companyProfile?: Record<string, unknown>;
  /** 顧客サイトの最新ニュース要約（自社サイト発の一次情報＝最新かつ検証済みの事実） */
  siteNews?: string;
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
    // pillar(flagship)は Opus 4.8、量産(bulk)はプラン既定モデル。
    // ANTHROPIC_API_KEY未設定時は getFlagshipModel()=undefined → 既定(Ollama)へフォールバック。
    const isFlagship = params.tier === "flagship";
    const model = isFlagship
      ? getFlagshipModel() ?? getModelForPlan(params.planId)
      : getModelForPlan(params.planId);
    const ai = getAIProvider(model);
    const wordTarget = isFlagship
      ? "1000-1500 words of comprehensive, original pillar content with concrete examples, data, and clear expertise (E-E-A-T)"
      : "300-500 words";
    const profileSummary = summarizeCompanyProfile(params.companyProfile);

    const langName = getLanguageName(params.language);

    // 検証済みの正式社名（会社プロフィール優先）。キーワードの綴りより常に優先する。
    const verifiedName =
      (typeof params.companyProfile?.companyName === "string" &&
        params.companyProfile.companyName.trim()) ||
      params.brandName;

    const article = await ai.completeJSON<{
      title: string;
      body: string;
      metaTitle: string;
      metaDescription: string;
    }>([
      {
        role: "user",
        content: `Write an SEO-optimized article entirely in ${langName} about the company described below.

CRITICAL ACCURACY RULES — these OVERRIDE every other instruction:
1. The company's official name is exactly "${verifiedName}". Always write it with this EXACT spelling. NEVER change the spelling, even if a keyword is misspelled.
2. Write ONLY about "${verifiedName}"'s real business and the verified facts below. Invent nothing — no fake people, partnerships, history, quotes, or numbers.
3. Keywords may contain typos or unrelated terms (people, places, other brands). NEVER fabricate any relationship between "${verifiedName}" and an unrelated person, company, event, or place. If a keyword is NOT genuinely about this company's business, IGNORE that keyword entirely and write about the company's genuinely relevant topics instead.
4. The entire output (title, body, metaTitle, metaDescription) MUST be written in ${langName}.

Company (use this exact name): ${verifiedName}
Country: ${params.country}
Suggested topic (use ONLY if genuinely relevant to this company; otherwise ignore it): ${params.topic}
Candidate keywords (use only the genuinely relevant ones; ignore typos/unrelated noise): ${params.keywords.join(", ")}
${profileSummary ? `\nVerified company facts (use ONLY these; invent nothing else):\n${profileSummary}\n` : ""}${params.siteNews ? `\nLatest news/updates published on the company's OWN website (these are current, first-party verified facts — prefer reflecting the most recent and relevant of these so the article stays up to date; never contradict them, and do not invent details beyond them):\n${params.siteNews}\n` : ""}
Write ${wordTarget}. Use H2/H3 headings. Prioritize factual accuracy over keyword inclusion. When the company's latest news above is relevant to the topic, weave it in so the content reflects what is currently happening at the company.

Example output format:
{"title": "Your Title Here", "body": "## Heading\\n\\nArticle text...", "metaTitle": "Short Meta Title", "metaDescription": "A 150-char description."}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: isFlagship ? 5000 : 4096 });

    // LLM出力品質チェック
    const articleValidation = validateContent(article.body, params.language);
    if (!articleValidation.valid) {
      throw new Error(`LLMの出力品質が低い: ${articleValidation.reason}`);
    }

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
    // リトライされるので、ここではactivityをスキップ完了にする（赤エラーにしない）
    const msg = error instanceof Error ? error.message : String(error);
    completeActivity(activity.id, {
      metrics: { wordCount: 0 },
      details: { note: `スキップ: ${msg.slice(0, 200)}` },
    });
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
  planId?: string;
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
    const ai = getAIProvider(getModelForPlan(params.planId));

    const langName = getLanguageName(params.language);

    const faq = await ai.completeJSON<{
      questions: { question: string; answer: string }[];
    }>([
      {
        role: "user",
        content: `Generate 5 FAQ questions and answers about "${params.topic}" for ${params.brandName}.

IMPORTANT: Write ALL questions and answers entirely in ${langName}. Do NOT write in English unless the target language is English.

Each answer should be 40-60 words.
${params.existingQuestions.length ? `Do not repeat these: ${params.existingQuestions.join(", ")}` : ""}

Example output format:
{"questions": [{"question": "What is X?", "answer": "X is a..."}]}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 2048 });

    // LLM出力品質チェック（最初の回答で判定）
    if (faq.questions.length > 0) {
      const faqValidation = validateContent(
        faq.questions[0].answer,
        params.language,
      );
      // FAQ answers are shorter, so skip the length check — only catch gibberish/loops
      if (!faqValidation.valid && faqValidation.reason !== "生成されたテキストが短すぎます") {
        throw new Error(`LLMの出力品質が低い: ${faqValidation.reason}`);
      }
    }

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
    const msg = error instanceof Error ? error.message : String(error);
    completeActivity(activity.id, {
      details: { note: `スキップ: ${msg.slice(0, 200)}` },
    });
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
  planId?: string;
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
    const ai = getAIProvider(getModelForPlan(params.planId));

    const langName = getLanguageName(params.language);

    const schema = await ai.completeJSON<Record<string, unknown>>([
      {
        role: "user",
        content: `Generate Schema.org JSON-LD for:

URL: ${params.pageUrl}
Title: ${params.pageTitle}
Type: ${params.pageType}
Brand: ${params.brandName}
Language: ${langName}
${params.content ? `Content: ${params.content.slice(0, 500)}` : ""}

Include @context, @type, and recommended properties. Use the correct language for text fields.

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
    const msg = error instanceof Error ? error.message : String(error);
    completeActivity(activity.id, {
      details: { note: `スキップ: ${msg.slice(0, 200)}` },
    });
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
  planId?: string;
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
    const ai = getAIProvider(getModelForPlan(params.planId));

    const sourceLangName = getLanguageName(params.sourceLanguage);
    const targetLangName = getLanguageName(params.targetLanguage);

    const translated = await ai.completeJSON<{
      title: string;
      body: string;
    }>([
      {
        role: "user",
        content: `Translate from ${sourceLangName} to ${targetLangName} for ${params.targetCountry}.
Keep "${params.brandName}" unchanged. Localize for the target market.

IMPORTANT: The output MUST be entirely in ${targetLangName}.

Content:
${params.sourceContent.slice(0, 3000)}

Example output format:
{"title": "Translated Title", "body": "Translated body text..."}

Respond with ONLY valid JSON. No markdown, no explanation.`,
      },
    ], { maxTokens: 4096 });

    // LLM出力品質チェック
    const transValidation = validateContent(translated.body, params.targetLanguage);
    if (!transValidation.valid) {
      throw new Error(`LLMの出力品質が低い: ${transValidation.reason}`);
    }

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
    const msg = error instanceof Error ? error.message : String(error);
    completeActivity(activity.id, {
      details: { note: `スキップ: ${msg.slice(0, 200)}` },
    });
    throw error;
  }
}
