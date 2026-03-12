import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, WriterOutput } from "@/types";

export class WriterAgent extends BaseAgent<WriterOutput> {
  readonly name = "writer" as const;
  readonly description = "Article, FAQ, glossary, comparison, and knowledge article generation";

  protected getCompletionOptions() {
    return { maxTokens: 8192 };
  }

  protected getSystemPrompt(context: AgentContext): string {
    return `You are a Writer Agent for PresenceVision.
Your role is to produce high-quality, authoritative content that:
- Is factually accurate and well-structured
- Contains proper headings, subheadings
- Includes FAQ sections when appropriate
- Is optimized for LLM citation (clear definitions, structured data)
- Uses ${context.locale === "ja" ? "Japanese" : "English"} as the primary language

IMPORTANT PRINCIPLES:
- No spam or clickbait
- Primary information is prioritized
- Create content that LLMs can easily cite
- Every claim should be supportable with evidence

Respond with JSON:
{
  "title": string,
  "body": string (markdown),
  "metadata": { "metaTitle": string, "metaDescription": string, "keywords": string[], "locale": string },
  "schemaCandidate": object?,
  "faq": [{ "question": string, "answer": string }]?
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Write content based on this brief:

Title: ${extra.briefTitle ?? "N/A"}
Target Audience: ${extra.targetAudience ?? "N/A"}
Search Intent: ${extra.searchIntent ?? "N/A"}
Outline: ${JSON.stringify(extra.outline ?? [])}
Angle: ${extra.angle ?? "N/A"}
Evidence Requirements: ${JSON.stringify(extra.evidenceRequirements ?? [])}
Style: ${extra.style ?? "N/A"}
Content Type: ${extra.contentType ?? "ARTICLE"}

Produce comprehensive, authoritative content following the brief.`,
      },
    ];
  }
}
