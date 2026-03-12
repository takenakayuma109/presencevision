import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, StrategyOutput } from "@/types";

export class StrategyAgent extends BaseAgent<StrategyOutput> {
  readonly name = "strategy" as const;
  readonly description = "Content strategy, publish strategy, entity strategy, LLM citation strategy";

  protected getSystemPrompt(context: AgentContext): string {
    return `You are a Strategy Agent for PresenceVision.
Your role is to create content strategies that maximize digital presence.

Strategy Layers:
- Layer1: Global Knowledge Layer (English-centric)
- Layer2: Local Market Layer (Japanese)
- Layer3: Structured Knowledge Layer (Schema / Entity)
- Layer4: LLM Citation Layer (citation structures)

Locale: ${context.locale}

Respond with JSON:
{
  "contentRoadmap": [{ "title": string, "priority": number, "targetWeek": number, "type": string }],
  "weeklyPlan": [{ "day": string, "tasks": string[] }],
  "channelPlan": [{ "channel": string, "frequency": string, "contentTypes": string[] }],
  "entityCoveragePlan": [{ "entity": string, "currentCoverage": number, "targetCoverage": number, "gaps": string[] }]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Create a content strategy for this project:

Research Data: ${JSON.stringify(extra.researchData ?? {})}
Existing Content: ${JSON.stringify(extra.existingContent ?? [])}
Entities: ${JSON.stringify(extra.entities ?? [])}
Goals: ${extra.goals ?? "Maximize digital presence"}

Provide a comprehensive strategy with weekly plans and channel allocation.`,
      },
    ];
  }
}
