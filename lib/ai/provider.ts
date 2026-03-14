/**
 * AI Provider — Ollama (local LLM) first, Anthropic as optional fallback
 *
 * Ollama runs locally or on a self-hosted server.
 * Zero per-request cost. Supports any GGUF model.
 */

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export interface AIProvider {
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
  completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T>;
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

    const ollamaMessages = [
      ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
      ...messages.map((m) => ({ role: m.role as string, content: m.content })),
    ];

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
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.message?.content ?? "";
  }

  async completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T> {
    const systemPrompt = [
      options?.system ?? "",
      "You MUST respond with valid JSON only. No markdown, no explanations, just JSON.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const model = options?.model ?? this.defaultModel;

    const ollamaMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as string, content: m.content })),
    ];

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
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error (${response.status}): ${text}`);
    }

    const data = await response.json();
    const raw = data.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned) as T;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = new OllamaProvider();
  }
  return providerInstance;
}
