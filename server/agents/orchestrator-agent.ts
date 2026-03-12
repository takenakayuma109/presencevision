import type { AgentContext, AgentName, WorkflowState, WorkflowStep } from "@/types";
import { ResearchAgent } from "./research-agent";
import { StrategyAgent } from "./strategy-agent";
import { BriefAgent } from "./brief-agent";
import { WriterAgent } from "./writer-agent";
import { EditorAgent } from "./editor-agent";
import { EvidenceAgent } from "./evidence-agent";
import { ComplianceAgent } from "./compliance-agent";
import { SchemaAgent } from "./schema-agent";
import { PublisherAgent } from "./publisher-agent";
import { MonitorAgent } from "./monitor-agent";
import { ReportAgent } from "./report-agent";
import type { BaseAgent } from "./base-agent";
import { v4 as uuidv4 } from "uuid";

const agentRegistry: Record<AgentName, () => BaseAgent> = {
  research: () => new ResearchAgent(),
  strategy: () => new StrategyAgent(),
  brief: () => new BriefAgent(),
  writer: () => new WriterAgent(),
  editor: () => new EditorAgent(),
  evidence: () => new EvidenceAgent(),
  compliance: () => new ComplianceAgent(),
  schema: () => new SchemaAgent(),
  publisher: () => new PublisherAgent(),
  monitor: () => new MonitorAgent(),
  report: () => new ReportAgent(),
  orchestrator: () => { throw new Error("Orchestrator cannot be self-invoked"); },
};

export function getAgent(name: AgentName): BaseAgent {
  const factory = agentRegistry[name];
  if (!factory) throw new Error(`Unknown agent: ${name}`);
  return factory();
}

export class OrchestratorAgent {
  async runWorkflow(
    name: string,
    agentSequence: AgentName[],
    context: AgentContext,
  ): Promise<WorkflowState> {
    const state: WorkflowState = {
      id: uuidv4(),
      name,
      projectId: context.projectId,
      steps: agentSequence.map((agent) => ({
        agent,
        status: "pending" as const,
      })),
      currentStep: 0,
      status: "running",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    for (let i = 0; i < state.steps.length; i++) {
      state.currentStep = i;
      const step = state.steps[i];
      step.status = "running";
      step.startedAt = new Date();

      try {
        const agent = getAgent(step.agent);
        const result = await agent.run({
          ...context,
          extra: {
            ...context.extra,
            ...this.buildStepInput(state, i),
          },
        });

        if (result.success) {
          step.status = "completed";
          step.output = result.data as Record<string, unknown>;
        } else {
          step.status = "failed";
          step.error = result.error;
          state.status = "failed";
          break;
        }
      } catch (error) {
        step.status = "failed";
        step.error = error instanceof Error ? error.message : String(error);
        state.status = "failed";
        break;
      }

      step.completedAt = new Date();
      state.updatedAt = new Date();
    }

    if (state.status !== "failed") {
      state.status = "completed";
    }

    return state;
  }

  async runSingleAgent(
    agentName: AgentName,
    context: AgentContext,
  ) {
    const agent = getAgent(agentName);
    return agent.run(context);
  }

  private buildStepInput(state: WorkflowState, currentIndex: number): Record<string, unknown> {
    const input: Record<string, unknown> = {};
    for (let i = 0; i < currentIndex; i++) {
      const prevStep = state.steps[i];
      if (prevStep.status === "completed" && prevStep.output) {
        input[`${prevStep.agent}Output`] = prevStep.output;
      }
    }
    return input;
  }
}

export const orchestrator = new OrchestratorAgent();
