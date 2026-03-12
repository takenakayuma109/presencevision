import type { Job } from "bullmq";
import type { JobPayload } from "@/lib/jobs";
import {
  runContentPipeline,
  runResearchWorkflow,
  runMonitoringWorkflow,
} from "@/server/workflows";
import { ReportAgent } from "@/server/agents";
import { prisma } from "@/lib/db";

export async function processJob(job: Job<JobPayload>): Promise<void> {
  const { type, projectId, workspaceId, data } = job.data;

  console.log(`[Worker] Processing job: ${type} for project ${projectId}`);

  switch (type) {
    case "content-pipeline": {
      const topicId = data?.topicId as string;
      if (!topicId) throw new Error("topicId required for content-pipeline");
      await runContentPipeline(projectId, topicId, workspaceId);
      break;
    }

    case "research": {
      await runResearchWorkflow(projectId, workspaceId);
      break;
    }

    case "monitoring": {
      await runMonitoringWorkflow(projectId, workspaceId);
      break;
    }

    case "weekly-report": {
      const reportAgent = new ReportAgent();
      const project = await prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          contentAssets: { where: { status: "PUBLISHED" }, take: 20 },
          entities: true,
          mentions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });

      const result = await reportAgent.run({
        projectId,
        workspaceId,
        locale: project.locale,
        extra: {
          reportType: "weekly",
          period: "last 7 days",
          contentPublished: project.contentAssets.map((a) => a.title),
          entityUpdates: project.entities.map((e) => e.name),
          mentions: project.mentions.map((m) => ({
            source: m.source,
            snippet: m.snippet,
          })),
        },
      });

      if (result.success && result.data) {
        const reportData = result.data as { title: string; body: string; data: object };
        await prisma.report.create({
          data: {
            projectId,
            type: "weekly",
            title: reportData.title,
            body: reportData.body,
            data: reportData.data,
          },
        });
      }
      break;
    }

    case "scheduled-task": {
      console.log(`[Worker] Scheduled task for project ${projectId}`);
      break;
    }

    default:
      console.warn(`[Worker] Unknown job type: ${type}`);
  }

  console.log(`[Worker] Completed job: ${type} for project ${projectId}`);
}
