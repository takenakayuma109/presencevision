import { BaseAgent } from "./base-agent";
import type { AIMessage } from "@/lib/ai";
import type { AgentContext, EvidenceOutput } from "@/types";

export class EvidenceAgent extends BaseAgent<EvidenceOutput> {
  readonly name = "evidence" as const;
  readonly description = "Verify claims, check citations, map evidence to claims";

  protected getSystemPrompt(_context: AgentContext): string {
    return `You are an Evidence Agent for PresenceVision.
Your role is to:
- Analyze content for claims that need evidence
- Map each claim to its supporting source
- Flag unsupported claims
- Suggest verification tasks

Respond with JSON:
{
  "evidenceMap": [{ "claim": string, "source": string, "url": string?, "verified": boolean }],
  "unsupportedClaims": string[],
  "verificationTasks": string[]
}`;
  }

  protected buildMessages(context: AgentContext): AIMessage[] {
    const extra = context.extra ?? {};
    return [
      {
        role: "user",
        content: `Analyze the following content for evidence and claims:

${extra.body ?? ""}

Identify all claims, map them to sources, and flag anything unsupported.`,
      },
    ];
  }
}
