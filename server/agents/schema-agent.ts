import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, SchemaOutput } from "@/types";

export class SchemaAgent extends BaseAgent<SchemaOutput> {
  readonly name = "schema" as const;
  readonly description = "Generate structured data (Schema.org) for Article, FAQPage, Product, Person, Organization, BreadcrumbList";

  protected getSystemPrompt(_context: AgentContext): string {
    return `You are a Schema Agent for PresenceVision.
Your role is to generate Schema.org structured data (JSON-LD) for content.

Supported schema types:
- Article
- FAQPage
- Product
- Person
- Organization
- BreadcrumbList
- HowTo
- WebPage

Generate valid JSON-LD that enhances search engine and LLM understanding.

Respond with JSON:
{
  "schemas": [{ "type": string, "data": object (valid JSON-LD) }]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Generate Schema.org structured data for:

Title: ${extra.title ?? "N/A"}
Content Type: ${extra.contentType ?? "Article"}
Content: ${extra.body ?? ""}
FAQ: ${JSON.stringify(extra.faq ?? [])}
Entity: ${extra.entityName ?? "N/A"}
Entity Type: ${extra.entityType ?? "N/A"}

Generate all applicable schema types for this content.`,
      },
    ];
  }
}
