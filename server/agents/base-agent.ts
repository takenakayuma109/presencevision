import { getAIProvider, type AIMessage, type AICompletionOptions } from "@/lib/ai";
import type { AgentContext, AgentName, AgentResult } from "@/types";

export abstract class BaseAgent<TOutput = unknown> {
  abstract readonly name: AgentName;
  abstract readonly description: string;

  protected abstract buildMessages(context: AgentContext): AIMessage[];
  protected abstract getSystemPrompt(context: AgentContext): string;

  protected getCompletionOptions(): Partial<AICompletionOptions> {
    return {};
  }

  async run(context: AgentContext): Promise<AgentResult<TOutput>> {
    const start = Date.now();
    try {
      const ai = getAIProvider();
      const messages = this.buildMessages(context);
      const system = this.getSystemPrompt(context);
      const options = { ...this.getCompletionOptions(), system };

      const data = await ai.completeJSON<TOutput>(messages, options);

      return {
        agent: this.name,
        success: true,
        data,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        agent: this.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      };
    }
  }

  async runText(context: AgentContext): Promise<AgentResult<string>> {
    const start = Date.now();
    try {
      const ai = getAIProvider();
      const messages = this.buildMessages(context);
      const system = this.getSystemPrompt(context);
      const options = { ...this.getCompletionOptions(), system };

      const data = await ai.complete(messages, options);

      return {
        agent: this.name,
        success: true,
        data,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        agent: this.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      };
    }
  }
}
