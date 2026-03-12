import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, BriefOutput } from "@/types";

export class BriefAgent extends BaseAgent<BriefOutput> {
  readonly name = "brief" as const;
  readonly description = "Content brief generation with audience, intent, outline, evidence requirements";

  protected getSystemPrompt(context: AgentContext): string {
    return `You are a Brief Agent for PresenceVision.
Your role is to create comprehensive content briefs that guide the Writer Agent.

Each brief must include:
- Target audience definition
- Search intent analysis
- Detailed outline with headings
- Content angle
- Evidence requirements
- Style guidelines

Locale: ${context.locale}
Focus on creating briefs that produce LLM-citable, authoritative content.

Respond with JSON:
{
  "title": string,
  "targetAudience": string,
  "searchIntent": string,
  "outline": [{ "heading": string, "subheadings": string[]?, "notes": string? }],
  "angle": string,
  "evidenceRequirements": string[],
  "style": string
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Create a content brief for the following topic:

Topic: ${extra.topicTitle ?? "N/A"}
Intent: ${extra.intent ?? "N/A"}
Entity: ${extra.entityName ?? "N/A"}
Competitor Coverage: ${JSON.stringify(extra.competitorCoverage ?? [])}

Generate a detailed brief that ensures high-quality, authoritative content.`,
      },
    ];
  }
}
