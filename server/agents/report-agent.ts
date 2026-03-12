import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, ReportOutput } from "@/types";

export class ReportAgent extends BaseAgent<ReportOutput> {
  readonly name = "report" as const;
  readonly description = "Generate daily, weekly, monthly reports and executive summaries";

  protected getCompletionOptions() {
    return { maxTokens: 8192 };
  }

  protected getSystemPrompt(context: AgentContext): string {
    return `You are a Report Agent for PresenceVision.
Your role is to generate comprehensive reports on digital presence performance.

Report types: daily, weekly, monthly, executive
Locale: ${context.locale}

Structure reports with:
- Executive summary
- Key metrics
- Content performance
- Entity coverage changes
- Recommendations
- Action items

Respond with JSON:
{
  "type": "daily"|"weekly"|"monthly"|"executive",
  "title": string,
  "body": string (markdown),
  "data": { key metrics as object }
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Generate a ${extra.reportType ?? "weekly"} report:

Period: ${extra.period ?? "last 7 days"}
Metrics: ${JSON.stringify(extra.metrics ?? {})}
Content Published: ${JSON.stringify(extra.contentPublished ?? [])}
Entity Updates: ${JSON.stringify(extra.entityUpdates ?? [])}
Mentions: ${JSON.stringify(extra.mentions ?? [])}
Previous Report: ${extra.previousReport ?? "N/A"}

Create a comprehensive report with actionable insights.`,
      },
    ];
  }
}
