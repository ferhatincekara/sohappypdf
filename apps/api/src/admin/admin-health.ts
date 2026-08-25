import { getOptionalEnv } from "@repo/config";
import { pingDatabase } from "@repo/db";
import { pingQueueConnection } from "@repo/queue";
import { getStorage } from "@repo/storage";

export type AdminHealthStatus = "ok" | "error" | "not_configured";

export type AdminSystemHealth = {
  api: AdminHealthStatus;
  database: AdminHealthStatus;
  queue: AdminHealthStatus;
  storage: AdminHealthStatus;
  worker: AdminHealthStatus;
  processingFailures: number;
};

async function probe(check: () => Promise<void>): Promise<"ok" | "error"> {
  try {
    await check();
    return "ok";
  } catch {
    return "error";
  }
}

async function probeWorker(): Promise<AdminHealthStatus> {
  const baseUrl = getOptionalEnv("WORKER_HEALTH_URL");

  if (baseUrl === undefined) {
    return "not_configured";
  }

  return probe(async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      throw new Error("worker_unhealthy");
    }
  });
}

export async function collectSystemHealth(input: {
  getProcessingFailures: () => Promise<number>;
}): Promise<AdminSystemHealth> {
  const [database, queue, storage, worker, processingFailures] =
    await Promise.all([
      probe(() => pingDatabase()),
      probe(() => pingQueueConnection("producer")),
      probe(() => getStorage().ping()),
      probeWorker(),
      input.getProcessingFailures(),
    ]);

  return {
    api: "ok",
    database,
    queue,
    storage,
    worker,
    processingFailures,
  };
}
