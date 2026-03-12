import { createWorker } from "@/lib/jobs";
import { processJob } from "./jobs/processor";

const worker = createWorker(processJob);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Worker] Error:", err.message);
});

console.log("[Worker] PresenceVision worker started");
