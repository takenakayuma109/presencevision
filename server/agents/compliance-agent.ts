import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, ComplianceOutput } from "@/types";

export class ComplianceAgent extends BaseAgent<ComplianceOutput> {
  readonly name = "compliance" as const;
  readonly description = "Legal check, brand safety, terms-of-service compliance";

  protected getSystemPrompt(_context: AgentContext): string {
    return `You are a Compliance Agent for PresenceVision.
Your role is to:
- Check content for legal issues (defamation, copyright, trademark)
- Ensure brand safety
- Verify compliance with platform terms of service
- Flag any regulatory concerns (especially for Japanese market)

PRINCIPLES:
- No spam
- No bot evasion
- No fake clicks
- No fake reviews
- No terms-of-service violations

Respond with JSON:
{
  "status": "approved" | "needs_review" | "blocked",
  "issues": [{ "type": string, "severity": "low"|"medium"|"high"|"critical", "message": string, "suggestion": string? }]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Review the following content for compliance:

Title: ${extra.title ?? "N/A"}
Content: ${extra.body ?? ""}
Target Channel: ${extra.channel ?? "owned media"}
Target Locale: ${context.locale}

Check for legal, brand safety, and terms compliance issues.`,
      },
    ];
  }
}
