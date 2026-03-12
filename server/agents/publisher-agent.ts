import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext } from "@/types";

interface PublishPlan {
  actions: PublishAction[];
  schedule?: string;
}

interface PublishAction {
  channel: string;
  format: string;
  adaptations: string[];
}

export class PublisherAgent extends BaseAgent<PublishPlan> {
  readonly name = "publisher" as const;
  readonly description = "Publish content to approved channels, export markdown, schedule publishing";

  protected getSystemPrompt(_context: AgentContext): string {
    return `You are a Publisher Agent for PresenceVision.
Your role is to plan content publishing:
- Determine the best format for each channel
- Adapt content for different platforms
- Plan publishing schedule
- Only publish to approved channels

RESTRICTION: Only publish to authorized owned media channels.

Respond with JSON:
{
  "actions": [{ "channel": string, "format": string, "adaptations": string[] }],
  "schedule": string?
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Plan publishing for this content:

Title: ${extra.title ?? "N/A"}
Content Type: ${extra.contentType ?? "Article"}
Available Channels: ${JSON.stringify(extra.channels ?? [])}
Preferred Schedule: ${extra.schedule ?? "immediate"}

Plan the publishing actions for each available channel.`,
      },
    ];
  }
}
