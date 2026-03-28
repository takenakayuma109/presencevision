/**
 * AI Provider — Ollama (local LLM) first, Anthropic as optional fallback
 *
 * Ollama runs locally or on a self-hosted server.
 * Zero per-request cost. Supports any GGUF model.
 */

const MAX_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 600_000; // 600 seconds (VPS CPU-only inference needs more time)

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  timeoutMs?: number;
}

export interface AIProvider {
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
  completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T>;
}

// ---------------------------------------------------------------------------
// JSON extraction helpers
// ---------------------------------------------------------------------------

function extractJSON(raw: string): unknown {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  // Strategy 2: Extract from markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Strategy 3: Find first { to last } (object)
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  // Strategy 4: Find first [ to last ] (array)
  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(raw.slice(firstBracket, lastBracket + 1));
    } catch {
      // continue
    }
  }

  throw new Error(`Failed to extract JSON from response: ${raw.slice(0, 200)}`);
}

// ---------------------------------------------------------------------------
// Ollama Provider — local LLM, no API cost
// ---------------------------------------------------------------------------
class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.defaultModel = process.env.OLLAMA_MODEL ?? "llama3.1";
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const model = options?.model ?? this.defaultModel;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const ollamaMessages = [
      ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
      ...messages.map((m) => ({ role: m.role as string, content: m.content })),
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.3,
            num_predict: options?.maxTokens ?? 4096,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error (${response.status}): ${text}`);
      }

      const data = (await response.json()) as { message?: { content?: string } };
      return data.message?.content ?? "";
    } finally {
      clearTimeout(timer);
    }
  }

  async completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T> {
    const model = options?.model ?? this.defaultModel;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Ollama] Attempt ${attempt}/${MAX_RETRIES}...`);

      const systemPrompt = [
        options?.system ?? "",
        "You MUST respond with valid JSON only. No markdown, no explanations, just JSON.",
      ]
        .filter(Boolean)
        .join("\n\n");

      // On retry, add a stronger reminder to the user prompt
      const retryMessages =
        attempt > 1
          ? messages.map((m, i) =>
              i === messages.length - 1
                ? { ...m, content: m.content + "\n\nRemember: respond with ONLY valid JSON, no other text." }
                : m,
            )
          : messages;

      const ollamaMessages = [
        { role: "system" as const, content: systemPrompt },
        ...retryMessages.map((m) => ({ role: m.role as string, content: m.content })),
      ];

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: ollamaMessages,
            stream: false,
            format: "json",
            options: {
              temperature: options?.temperature ?? 0.3,
              num_predict: options?.maxTokens ?? 4096,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ollama error (${response.status}): ${text}`);
        }

        const data = (await response.json()) as { message?: { content?: string } };
        const raw = data.message?.content ?? "{}";
        return extractJSON(raw) as T;
      } catch (error) {
        clearTimeout(timer);

        const isTimeout = error instanceof DOMException && error.name === "AbortError";
        const label = isTimeout ? "timeout" : "JSON parse/request error";
        console.warn(`[Ollama] Attempt ${attempt}/${MAX_RETRIES} failed (${label}):`, error);

        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // Brief pause before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        clearTimeout(timer);
      }
    }

    // TypeScript: unreachable, but keeps the compiler happy
    throw new Error("[Ollama] completeJSON exhausted all retries");
  }
}

// ---------------------------------------------------------------------------
// Anthropic Provider — Claude Haiku for high-quality content generation
// ---------------------------------------------------------------------------
class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    this.defaultModel = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? 30_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options?.model ?? this.defaultModel,
          max_tokens: options?.maxTokens ?? 4096,
          temperature: options?.temperature ?? 0.3,
          ...(options?.system ? { system: options.system } : {}),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic error (${response.status}): ${text}`);
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      return data.content?.[0]?.text ?? "";
    } finally {
      clearTimeout(timer);
    }
  }

  async completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Anthropic] Attempt ${attempt}/${MAX_RETRIES}...`);

      const systemPrompt = [
        options?.system ?? "",
        "You MUST respond with valid JSON only. No markdown, no explanations, just JSON.",
      ]
        .filter(Boolean)
        .join("\n\n");

      try {
        const raw = await this.complete(messages, {
          ...options,
          system: systemPrompt,
          timeoutMs: options?.timeoutMs ?? 30_000,
        });

        return extractJSON(raw) as T;
      } catch (error) {
        console.warn(`[Anthropic] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        if (attempt === MAX_RETRIES) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    throw new Error("[Anthropic] completeJSON exhausted all retries");
  }
}

// ---------------------------------------------------------------------------
// Singleton — Anthropic if API key is set, otherwise Ollama
// ---------------------------------------------------------------------------
let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    if (process.env.ANTHROPIC_API_KEY) {
      providerInstance = new AnthropicProvider();
      console.log("[AI] Using Anthropic Claude Haiku (high-quality, fast)");
    } else {
      providerInstance = new OllamaProvider();
      console.log("[AI] Using Ollama (local, no API cost)");
    }
  }
  return providerInstance;
}
