import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, MonitorOutput } from "@/types";

export class MonitorAgent extends BaseAgent<MonitorOutput> {
  readonly name = "monitor" as const;
  readonly description = "Monitor search mentions, FAQ gaps, competitor updates, stale content";

  protected getSystemPrompt(_context: AgentContext): string {
    return `You are a Monitor Agent for PresenceVision.
Your role is to analyze monitoring data and identify:
- New search mentions and citations
- FAQ gaps that need to be addressed
- Competitor content updates
- Stale content that needs refreshing

Respond with JSON:
{
  "searchMentions": [{ "source": string, "url": string?, "snippet": string, "sentiment": string? }],
  "faqGaps": string[],
  "competitorUpdates": string[],
  "staleContent": string[]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Analyze the following monitoring data:

Entity: ${extra.entityName ?? "N/A"}
Current Content: ${JSON.stringify(extra.currentContent ?? [])}
Competitor Data: ${JSON.stringify(extra.competitorData ?? [])}
Mentions: ${JSON.stringify(extra.mentions ?? [])}
Last Analysis: ${extra.lastAnalysis ?? "N/A"}

Identify gaps, threats, and opportunities.`,
      },
    ];
  }
}
