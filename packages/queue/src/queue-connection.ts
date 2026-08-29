import { loadQueueConfig, type QueueConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { Redis } from "ioredis";

const UPSTASH_REDIS_PORT = 6379;

export type QueueConnectionRole = "producer" | "worker";

export type QueueConnectionOptions = {
  host: string;
  port: number;
  username: "default";
  password: string;
  tls: Record<string, never>;
  family: 4;
  connectTimeout: number;
  maxRetriesPerRequest: number | null;
  enableReadyCheck: false;
};

function parseUpstashRestUrl(restUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(restUrl);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  if (parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  if (parsed.hostname.length === 0 || parsed.username || parsed.password) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  return parsed;
}

export function createQueueConnectionOptions(
  config: QueueConfig,
  role: QueueConnectionRole = "producer",
): QueueConnectionOptions {
  const parsed = parseUpstashRestUrl(config.restUrl);

  return {
    host: parsed.hostname,
    port: UPSTASH_REDIS_PORT,
    username: "default",
    password: config.restToken,
    tls: {},
    family: 4,
    connectTimeout: 10_000,
    maxRetriesPerRequest: role === "worker" ? null : 20,
    enableReadyCheck: false,
  };
}

export function getQueueConnectionOptions(
  role: QueueConnectionRole = "producer",
): QueueConnectionOptions {
  return createQueueConnectionOptions(loadQueueConfig(), role);
}

let producerConnection: Redis | undefined;
let workerConnection: Redis | undefined;

export function createQueueConnection(
  config: QueueConfig,
  role: QueueConnectionRole = "producer",
): Redis {
  return new Redis(createQueueConnectionOptions(config, role));
}

export function getQueueConnection(
  role: QueueConnectionRole = "producer",
): Redis {
  if (role === "worker") {
    if (workerConnection === undefined) {
      workerConnection = createQueueConnection(loadQueueConfig(), "worker");
    }

    return workerConnection;
  }

  if (producerConnection === undefined) {
    producerConnection = createQueueConnection(loadQueueConfig(), "producer");
  }

  return producerConnection;
}

export async function pingQueueConnection(
  role: QueueConnectionRole = "worker",
): Promise<void> {
  const result = await getQueueConnection(role).ping();

  if (result !== "PONG") {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Queue connection failed",
    });
  }
}

export async function closeQueueConnections(): Promise<void> {
  const connections = [producerConnection, workerConnection].filter(
    (connection): connection is Redis => connection !== undefined,
  );
  producerConnection = undefined;
  workerConnection = undefined;

  await Promise.all(
    connections.map(async (connection) => {
      await connection.quit();
    }),
  );
}
