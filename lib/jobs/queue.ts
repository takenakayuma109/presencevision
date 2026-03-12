import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
};

export const presenceQueue = new Queue("presence-vision", { connection });

export type JobType =
  | "content-pipeline"
  | "research"
  | "monitoring"
  | "weekly-report"
  | "scheduled-task";

export interface JobPayload {
  type: JobType;
  projectId: string;
  workspaceId: string;
  data?: Record<string, unknown>;
}

export async function enqueueJob(payload: JobPayload) {
  return presenceQueue.add(payload.type, payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export async function enqueueScheduledJob(
  payload: JobPayload,
  cron: string,
) {
  return presenceQueue.add(payload.type, payload, {
    repeat: { pattern: cron },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export function createWorker(
  processor: (job: Job<JobPayload>) => Promise<void>,
) {
  return new Worker<JobPayload>("presence-vision", processor, {
    connection,
    concurrency: 3,
  });
}
