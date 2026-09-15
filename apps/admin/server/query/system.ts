import { loadAdminConfig } from "@sohappypdf/config";
import { billingSubscriptions, getDb, pingDatabase } from "@sohappypdf/db";
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

export function workerHttpHealth(input: {
  configured: boolean;
  ok: boolean;
  latencyMs: number | null;
}): ServiceHealth | null {
  if (!input.configured) {
    return null;
  }

  return {
    name: "Worker HTTP",
    status: input.ok ? "healthy" : "unavailable",
    latencyMs: input.latencyMs,
    detail: input.ok
      ? "Configured worker endpoint is ready."
      : "Configured worker endpoint is not ready.",
  };
}

export function billingRecordsHealth(result: {
  ok: boolean;
  latencyMs: number;
}): ServiceHealth {
  return {
    name: "Billing",
    status: result.ok ? "healthy" : "unavailable",
    latencyMs: result.latencyMs,
    detail: result.ok
      ? "Local subscription records are readable. Polar checkout and webhooks run on the API."
      : "Unable to read local billing records.",
  };
}

async function pingBillingRecords(): Promise<void> {
  await getDb()
    .select({ id: billingSubscriptions.id })
    .from(billingSubscriptions)
    .limit(1);
}

export async function getAdminSystemHealth(): Promise<{
  generatedAt: string;
  services: ServiceHealth[];
}> {
  const admin = loadAdminConfig();

  const [database, redis, storage, queues, workers, workerHttp, billing] =
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
      timed(() => pingBillingRecords()),
    ]);

  const workerHttpCard = workerHttpHealth({
    configured: admin.workerHealthUrl !== undefined,
    ok: workerHttp.ok,
    latencyMs: workerHttp.latencyMs,
  });

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
    ...(workerHttpCard === null ? [] : [workerHttpCard]),
    billingRecordsHealth(billing),
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
