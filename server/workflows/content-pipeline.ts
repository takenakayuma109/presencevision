import { orchestrator } from "../agents";
import { prisma } from "@/lib/db";
import type { AgentContext, AgentName } from "@/types";

const CONTENT_PIPELINE_STEPS: AgentName[] = [
  "brief",
  "writer",
  "editor",
  "evidence",
  "compliance",
  "schema",
];

export async function runContentPipeline(
  projectId: string,
  topicId: string,
  workspaceId: string,
) {
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
    include: { project: true },
  });

  const context: AgentContext = {
    projectId,
    workspaceId,
    locale: topic.project.locale,
    topicId,
    extra: {
      topicTitle: topic.title,
      intent: topic.intent,
    },
  };

  const workflow = await orchestrator.runWorkflow(
    "content-pipeline",
    CONTENT_PIPELINE_STEPS,
    context,
  );

  if (workflow.status === "completed") {
    const briefStep = workflow.steps.find((s) => s.agent === "brief");
    const writerStep = workflow.steps.find((s) => s.agent === "writer");
    const editorStep = workflow.steps.find((s) => s.agent === "editor");
    const schemaStep = workflow.steps.find((s) => s.agent === "schema");

    if (briefStep?.output && writerStep?.output) {
      const briefOutput = briefStep.output as Record<string, unknown>;
      const writerOutput = writerStep.output as Record<string, unknown>;
      const editorOutput = editorStep?.output as Record<string, unknown> | undefined;

      const brief = await prisma.contentBrief.create({
        data: {
          projectId,
          topicId,
          title: (briefOutput.title as string) ?? topic.title,
          targetAudience: briefOutput.targetAudience as string,
          searchIntent: briefOutput.searchIntent as string,
          outline: briefOutput.outline as object,
          angle: briefOutput.angle as string,
          evidenceReqs: (briefOutput.evidenceRequirements as string[])?.join("\n"),
          style: briefOutput.style as string,
          status: "COMPLETED",
        },
      });

      const asset = await prisma.contentAsset.create({
        data: {
          projectId,
          briefId: brief.id,
          type: "ARTICLE",
          title: (writerOutput.title as string) ?? topic.title,
          status: "REVIEW",
          metadata: writerOutput.metadata as object,
        },
      });

      const body = (editorOutput?.body as string) ?? (writerOutput.body as string);

      await prisma.contentVersion.create({
        data: {
          assetId: asset.id,
          version: 1,
          body,
          schemaOrg: schemaStep?.output as object,
        },
      });

      await prisma.topic.update({
        where: { id: topicId },
        data: { status: "completed" },
      });

      return { workflow, briefId: brief.id, assetId: asset.id };
    }
  }

  return { workflow };
}

export async function runResearchWorkflow(
  projectId: string,
  workspaceId: string,
) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      entities: true,
      competitors: true,
      topics: true,
    },
  });

  const context: AgentContext = {
    projectId,
    workspaceId,
    locale: project.locale,
    extra: {
      entities: project.entities.map((e) => ({ name: e.name, type: e.type })),
      competitors: project.competitors.map((c) => ({ name: c.name, domain: c.domain })),
      currentTopics: project.topics.map((t) => t.title),
    },
  };

  return orchestrator.runWorkflow("research", ["research", "strategy"], context);
}

export async function runMonitoringWorkflow(
  projectId: string,
  workspaceId: string,
) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      entities: true,
      contentAssets: { where: { status: "PUBLISHED" } },
      mentions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  const context: AgentContext = {
    projectId,
    workspaceId,
    locale: project.locale,
    extra: {
      entities: project.entities.map((e) => ({ name: e.name, type: e.type })),
      currentContent: project.contentAssets.map((a) => ({ title: a.title, type: a.type })),
      mentions: project.mentions.map((m) => ({
        source: m.source,
        snippet: m.snippet,
        sentiment: m.sentiment,
      })),
    },
  };

  return orchestrator.runWorkflow("monitoring", ["monitor", "report"], context);
}
