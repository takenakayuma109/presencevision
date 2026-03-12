import Anthropic from "@anthropic-ai/sdk";

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

class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model ?? "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      system: options?.system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const block = response.content[0];
    if (block.type === "text") return block.text;
    throw new Error("Unexpected response type");
  }

  async completeJSON<T>(messages: AIMessage[], options?: AICompletionOptions): Promise<T> {
    const systemPrompt = [
      options?.system ?? "",
      "You MUST respond with valid JSON only. No markdown, no explanations, just JSON.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const raw = await this.complete(messages, { ...options, system: systemPrompt });
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned) as T;
  }
}

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = new ClaudeProvider();
  }
  return providerInstance;
}
