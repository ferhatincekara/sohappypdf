import { hostname } from "node:os";
import { getQueueConnection } from "./queue-connection.js";
import {
  CONVERSION_QUEUE_NAME,
  FILE_CLEANUP_QUEUE_NAME,
} from "./queue-settings.js";

export const WORKER_HEARTBEAT_KEY_PREFIX = "sohappypdf:worker:heartbeat:";
export const WORKER_HEARTBEAT_TTL_SECONDS = 45;
export const WORKER_HEARTBEAT_INTERVAL_MS = 15_000;
const HEALTHY_MS = 20_000;
const WARNING_MS = 45_000;

export type WorkerHeartbeatStatus = "healthy" | "warning" | "offline";

export type WorkerHeartbeat = {
  id: string;
  hostname: string;
  startedAt: string;
  lastSeenAt: string;
  queues: readonly string[];
  processedCount: number;
  failedCount: number;
  currentJobId: string | null;
};

export type WorkerHeartbeatView = WorkerHeartbeat & {
  status: WorkerHeartbeatStatus;
};

export type WorkerHeartbeatWriter = {
  record(heartbeat: WorkerHeartbeat): Promise<void>;
};

function heartbeatKey(id: string): string {
  return `${WORKER_HEARTBEAT_KEY_PREFIX}${id}`;
}

export function resolveWorkerHeartbeatStatus(
  lastSeenAt: Date,
  now: Date = new Date(),
): WorkerHeartbeatStatus {
  const ageMs = now.getTime() - lastSeenAt.getTime();

  if (ageMs <= HEALTHY_MS) {
    return "healthy";
  }

  if (ageMs <= WARNING_MS) {
    return "warning";
  }

  return "offline";
}

export function parseWorkerHeartbeat(
  value: unknown,
): WorkerHeartbeat | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== "string" ||
    typeof record.hostname !== "string" ||
    typeof record.startedAt !== "string" ||
    typeof record.lastSeenAt !== "string" ||
    !Array.isArray(record.queues) ||
    typeof record.processedCount !== "number" ||
    typeof record.failedCount !== "number"
  ) {
    return undefined;
  }

  return {
    id: record.id,
    hostname: record.hostname,
    startedAt: record.startedAt,
    lastSeenAt: record.lastSeenAt,
    queues: record.queues.filter(
      (item): item is string => typeof item === "string",
    ),
    processedCount: record.processedCount,
    failedCount: record.failedCount,
    currentJobId:
      typeof record.currentJobId === "string" ? record.currentJobId : null,
  };
}

export async function writeWorkerHeartbeat(
  heartbeat: WorkerHeartbeat,
): Promise<void> {
  const redis = getQueueConnection("worker");
  await redis.set(
    heartbeatKey(heartbeat.id),
    JSON.stringify(heartbeat),
    "EX",
    WORKER_HEARTBEAT_TTL_SECONDS,
  );
}

export async function listWorkerHeartbeats(
  now: Date = new Date(),
): Promise<WorkerHeartbeatView[]> {
  const redis = getQueueConnection("producer");
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [next, found] = await redis.scan(
      cursor,
      "MATCH",
      `${WORKER_HEARTBEAT_KEY_PREFIX}*`,
      "COUNT",
      50,
    );
    cursor = String(next);
    keys.push(...found);
  } while (cursor !== "0");

  if (keys.length === 0) {
    return [];
  }

  const values = await redis.mget(...keys);
  const heartbeats: WorkerHeartbeatView[] = [];

  for (const value of values) {
    if (value === null) {
      continue;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(value);
    } catch {
      continue;
    }

    const heartbeat = parseWorkerHeartbeat(parsed);

    if (heartbeat === undefined) {
      continue;
    }

    heartbeats.push({
      ...heartbeat,
      status: resolveWorkerHeartbeatStatus(new Date(heartbeat.lastSeenAt), now),
    });
  }

  return heartbeats.sort((left, right) => left.id.localeCompare(right.id));
}

export function createWorkerHeartbeatState(input?: {
  id?: string;
  hostname?: string;
  startedAt?: Date;
  queues?: readonly string[];
}): {
  snapshot(): WorkerHeartbeat;
  markJobStarted(jobId: string): void;
  markJobCompleted(): void;
  markJobFailed(): void;
} {
  const startedAt = (input?.startedAt ?? new Date()).toISOString();
  const state = {
    id: input?.id ?? hostname(),
    hostname: input?.hostname ?? hostname(),
    queues: input?.queues ?? [CONVERSION_QUEUE_NAME, FILE_CLEANUP_QUEUE_NAME],
    processedCount: 0,
    failedCount: 0,
    currentJobId: null as string | null,
  };

  return {
    snapshot() {
      return {
        id: state.id,
        hostname: state.hostname,
        startedAt,
        lastSeenAt: new Date().toISOString(),
        queues: state.queues,
        processedCount: state.processedCount,
        failedCount: state.failedCount,
        currentJobId: state.currentJobId,
      };
    },
    markJobStarted(jobId) {
      state.currentJobId = jobId;
    },
    markJobCompleted() {
      state.processedCount += 1;
      state.currentJobId = null;
    },
    markJobFailed() {
      state.failedCount += 1;
      state.currentJobId = null;
    },
  };
}

export function startWorkerHeartbeat(input: {
  state: ReturnType<typeof createWorkerHeartbeatState>;
  write?: (heartbeat: WorkerHeartbeat) => Promise<void>;
  intervalMs?: number;
}): () => void {
  const write = input.write ?? writeWorkerHeartbeat;
  const intervalMs = input.intervalMs ?? WORKER_HEARTBEAT_INTERVAL_MS;
  let stopped = false;

  const publish = (): void => {
    if (stopped) {
      return;
    }

    void write(input.state.snapshot()).catch(() => {
      // Heartbeats are observability only. A Redis write failure must not stop the worker.
    });
  };

  publish();
  const timer = setInterval(publish, intervalMs);
  timer.unref();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
