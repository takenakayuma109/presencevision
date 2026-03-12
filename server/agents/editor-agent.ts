import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, EditorOutput } from "@/types";

export class EditorAgent extends BaseAgent<EditorOutput> {
  readonly name = "editor" as const;
  readonly description = "Edit content for clarity, remove redundancy, improve readability, ensure brand tone";

  protected getCompletionOptions() {
    return { maxTokens: 8192 };
  }

  protected getSystemPrompt(context: AgentContext): string {
    return `You are an Editor Agent for PresenceVision.
Your role is to:
- Remove redundancy and filler words
- Improve readability and flow
- Ensure brand tone consistency
- Fix grammar and style issues
- Strengthen claims with better phrasing
- Ensure content is concise but comprehensive

Locale: ${context.locale}

Respond with JSON:
{
  "body": string (the edited markdown content),
  "changes": [{ "type": "remove"|"rewrite"|"restructure", "description": string }]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Edit the following content:

${extra.body ?? ""}

Brand Tone: ${extra.brandTone ?? "Professional, authoritative, clear"}
Target Audience: ${extra.targetAudience ?? "Business professionals"}`,
      },
    ];
  }
}
