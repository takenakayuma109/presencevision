import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, ResearchOutput } from "@/types";

export class ResearchAgent extends BaseAgent<ResearchOutput> {
  readonly name = "research" as const;
  readonly description = "Topic exploration, search intent analysis, competitor analysis, entity gap analysis";

  protected getSystemPrompt(context: AgentContext): string {
    return `You are a Research Agent for PresenceVision, an Autonomous Digital Presence Engine.
Your role is to discover topic opportunities, analyze search intent, find FAQ topics,
identify entity gaps, and discover comparison opportunities.

Locale: ${context.locale}
Focus on high-quality, authoritative content opportunities.
Never suggest spam, clickbait, or low-quality content.

Respond with JSON matching this structure:
{
  "topicOpportunities": [{ "title": string, "intent": string, "volume": number?, "difficulty": number?, "reason": string }],
  "keywordClusters": [{ "name": string, "keywords": string[], "intent": string }],
  "faqTopics": string[],
  "entityGaps": string[],
  "comparisonOpportunities": string[]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Analyze the following domain/topic for digital presence opportunities:

Project ID: ${context.projectId}
Entity: ${extra.entityName ?? "N/A"}
Industry: ${extra.industry ?? "N/A"}
Current Topics: ${JSON.stringify(extra.currentTopics ?? [])}
Competitors: ${JSON.stringify(extra.competitors ?? [])}

Provide comprehensive research output with actionable topic opportunities.`,
      },
    ];
  }
}
