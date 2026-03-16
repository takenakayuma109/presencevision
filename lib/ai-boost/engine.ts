import type {
  AIBoostProvider,
  AIBoostModel,
  AIBoostConfig,
  AIBoostArticle,
} from "@/lib/types/ai-boost";

// ---------------------------------------------------------------------------
// Cost rates (JPY per 1K tokens)
// ---------------------------------------------------------------------------
const COST_TABLE: Record<AIBoostModel, { input: number; output: number }> = {
  "gpt-4o": { input: 2, output: 8 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
};

const DEFAULT_MODEL: Record<AIBoostProvider, AIBoostModel> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
};

// ---------------------------------------------------------------------------
// SEO Prompt
// ---------------------------------------------------------------------------
function buildSEOPrompt(keyword: string, context?: string): string {
  return [
    "あなたはSEO記事のプロフェッショナルライターです。",
    `以下のキーワードをテーマに、検索上位に表示される高品質な日本語記事を生成してください。`,
    "",
    `## ターゲットキーワード: ${keyword}`,
    context ? `\n## 追加コンテキスト:\n${context}` : "",
    "",
    "## 記事の要件:",
    "- タイトルはキーワードを自然に含み、クリックしたくなる見出しにする",
    "- H2/H3見出しを使い、論理的に構成する",
    "- キーワードを記事内に自然に散りばめる（詰め込みはNG）",
    "- 具体的なデータや事例を含める",
    "- 読者のペインポイントに応える内容にする",
    "- 記事の最後にFAQセクション（3〜5問）を含める",
    "- 約2000〜3000文字の長さを目安にする",
    "",
    "## 出力形式:",
    "Markdown形式で出力してください。最初の行は # タイトル にしてください。",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// OpenAI API call
// ---------------------------------------------------------------------------
async function callOpenAI(
  prompt: string,
  config: AIBoostConfig
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("OpenAI returned no choices");
  }

  return {
    content: choice.message?.content ?? "",
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Anthropic API call
// ---------------------------------------------------------------------------
async function callAnthropic(
  prompt: string,
  config: AIBoostConfig
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === "text"
  );
  if (!textBlock) {
    throw new Error("Anthropic returned no text content");
  }

  return {
    content: textBlock.text ?? "",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------
function estimateCostJpy(
  model: AIBoostModel,
  inputTokens: number,
  outputTokens: number
): number {
  const rate = COST_TABLE[model];
  return Math.round(
    (rate.input * inputTokens) / 1000 + (rate.output * outputTokens) / 1000
  );
}

// ---------------------------------------------------------------------------
// Extract title from Markdown
// ---------------------------------------------------------------------------
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateArticle(
  keyword: string,
  context: string | undefined,
  config: Partial<AIBoostConfig> & { provider?: AIBoostProvider }
): Promise<Omit<AIBoostArticle, "id" | "projectId" | "createdAt">> {
  const provider: AIBoostProvider = config.provider ?? "openai";
  const model: AIBoostModel = config.model ?? DEFAULT_MODEL[provider];
  const maxTokens = config.maxTokens ?? 4096;
  const temperature = config.temperature ?? 0.7;

  const fullConfig: AIBoostConfig = { provider, model, maxTokens, temperature };
  const prompt = buildSEOPrompt(keyword, context);

  // Try primary provider, fall back to the other on failure
  let result: { content: string; inputTokens: number; outputTokens: number };
  let usedProvider = provider;
  let usedModel = model;

  try {
    if (provider === "openai") {
      result = await callOpenAI(prompt, fullConfig);
    } else {
      result = await callAnthropic(prompt, fullConfig);
    }
  } catch (primaryError) {
    console.warn(
      `AI Boost: ${provider} failed, attempting fallback:`,
      primaryError
    );

    // Fallback to the other provider
    const fallbackProvider: AIBoostProvider =
      provider === "openai" ? "anthropic" : "openai";
    const fallbackModel = DEFAULT_MODEL[fallbackProvider];
    const fallbackConfig: AIBoostConfig = {
      ...fullConfig,
      provider: fallbackProvider,
      model: fallbackModel,
    };

    try {
      if (fallbackProvider === "openai") {
        result = await callOpenAI(prompt, fallbackConfig);
      } else {
        result = await callAnthropic(prompt, fallbackConfig);
      }
      usedProvider = fallbackProvider;
      usedModel = fallbackModel;
    } catch (fallbackError) {
      console.error("AI Boost: Both providers failed", fallbackError);
      throw new Error(
        `AI Boost generation failed: primary (${provider}) and fallback (${fallbackProvider}) both returned errors`
      );
    }
  }

  const tokensUsed = result.inputTokens + result.outputTokens;
  const estimatedCostJpy = estimateCostJpy(
    usedModel,
    result.inputTokens,
    result.outputTokens
  );

  return {
    keyword,
    title: extractTitle(result.content),
    content: result.content,
    provider: usedProvider,
    model: usedModel,
    tokensUsed,
    estimatedCostJpy,
  };
}
