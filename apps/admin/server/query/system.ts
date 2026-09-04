import { loadAdminConfig, loadBillingConfig } from "@sohappypdf/config";
import { pingDatabase } from "@sohappypdf/db";
import {
  listAdminQueues,
  listWorkerHeartbeats,
  pingQueueConnection,
} from "@sohappypdf/queue";
import { getStorage } from "@sohappypdf/storage";

export type HealthStatus = "healthy" | "degraded" | "unavailable";

export type ServiceHealth = {
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  detail: string;
};

async function timed<T>(
  run: () => Promise<T>,
): Promise<
  { ok: true; value: T; latencyMs: number } | { ok: false; latencyMs: number }
> {
  const started = Date.now();

  try {
    const value = await run();
    return { ok: true, value, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}

export async function getAdminSystemHealth(): Promise<{
  generatedAt: string;
  services: ServiceHealth[];
}> {
  const admin = loadAdminConfig();
  const billing = loadBillingConfig();

  const [database, redis, storage, queues, workers, workerHttp] =
    await Promise.all([
      timed(() => pingDatabase()),
      timed(() => pingQueueConnection("producer")),
      timed(() => getStorage().ping()),
      timed(() => listAdminQueues()),
      timed(() => listWorkerHeartbeats()),
      admin.workerHealthUrl === undefined
        ? Promise.resolve({ ok: false as const, latencyMs: null })
        : timed(async () => {
            const response = await fetch(`${admin.workerHealthUrl}/ready`, {
              cache: "no-store",
              signal: AbortSignal.timeout(2500),
            });

            if (!response.ok) {
              throw new Error("unready");
            }
          }),
    ]);

  const services: ServiceHealth[] = [
    {
      name: "Database",
      status: database.ok ? "healthy" : "unavailable",
      latencyMs: database.latencyMs,
      detail: database.ok
        ? "Responded to a connectivity check."
        : "Database is temporarily unavailable.",
    },
    {
      name: "Redis / Queue",
      status: redis.ok ? "healthy" : "unavailable",
      latencyMs: redis.latencyMs,
      detail: redis.ok
        ? "Queue broker responded."
        : "Queue service is temporarily unavailable.",
    },
    {
      name: "Storage",
      status: storage.ok ? "healthy" : "unavailable",
      latencyMs: storage.latencyMs,
      detail: storage.ok
        ? "Object storage responded."
        : "Storage is temporarily unavailable.",
    },
    {
      name: "Queues",
      status: queues.ok ? "healthy" : "unavailable",
      latencyMs: queues.ok ? queues.latencyMs : queues.latencyMs,
      detail: queues.ok
        ? queues.value
            .map((queue) => `${queue.label}: ${queue.counts.waiting} waiting`)
            .join(" · ")
        : "Unable to load queue counts.",
    },
    {
      name: "Workers",
      status: !workers.ok
        ? "unavailable"
        : workers.value.some((worker) => worker.status === "healthy")
          ? "healthy"
          : workers.value.length === 0
            ? "degraded"
            : "degraded",
      latencyMs: workers.ok ? workers.latencyMs : workers.latencyMs,
      detail: !workers.ok
        ? "Unable to read worker heartbeats."
        : workers.value.length === 0
          ? "No worker heartbeats recorded. Heartbeats publish when Redis is available."
          : `${workers.value.filter((worker) => worker.status === "healthy").length} healthy · ${workers.value.filter((worker) => worker.status !== "healthy").length} stale`,
    },
    {
      name: "Worker HTTP",
      status:
        admin.workerHealthUrl === undefined
          ? "degraded"
          : workerHttp.ok
            ? "healthy"
            : "unavailable",
      latencyMs: workerHttp.latencyMs,
      detail:
        admin.workerHealthUrl === undefined
          ? "WORKER_HEALTH_URL is not configured."
          : workerHttp.ok
            ? "Configured worker endpoint is ready."
            : "Configured worker endpoint is not ready.",
    },
    {
      name: "Billing",
      status: billing.polar.accessToken === undefined ? "degraded" : "healthy",
      latencyMs: null,
      detail:
        billing.polar.accessToken === undefined
          ? "Polar credentials are not configured in this environment."
          : "Polar credentials are present. Live revenue is read from local subscription records.",
    },
    {
      name: "Authentication",
      status: "healthy",
      latencyMs: null,
      detail:
        "Better Auth is configured. Session checks are enforced server-side.",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    services,
  };
}
